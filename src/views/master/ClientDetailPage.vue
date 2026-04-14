<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import ClientFormModal from '@/components/domain/master/ClientFormModal.vue'
import { useAuthStore } from '@/stores/auth'
import {
  changeClientStatus,
  fetchBuyersByClient,
  fetchClient,
  fetchClients,
  updateClient,
} from '@/api/master'
import { createBuyer, updateBuyer, deleteBuyer } from '@/api/contacts'
import { fetchDepartments, fetchTeams } from '@/api/auth'
import { useMasterLookup } from '@/composables/useMasterLookup'
import { useToast } from '@/composables/useToast'
import { isValidEmail, isValidTel } from '@/utils/validators'
import { label, CLIENT_STATUS_LABEL } from '@/utils/enumLabels'

const route = useRoute()
const router = useRouter()
const { success, error } = useToast()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)
const isAdmin = computed(() => currentUser.value?.role === 'admin')

const { countries, ports, currencies, paymentTerms, loadReferenceData, getCountryName, getPortName, getPaymentTermsLabel, getCurrencyLabel } = useMasterLookup()

const client = ref(null)
const allClients = ref([])
const departments = ref([])
const teams = ref([])
const loading = ref(false)
const saving = ref(false)

const showFormModal = ref(false)
const showConfirmModal = ref(false)

// 바이어
const buyers = ref([])
const showBuyerModal = ref(false)
const buyerMode = ref('create')
const editingBuyerId = ref(null)
const buyerForm = ref(getEmptyBuyerForm())
const buyerErrors = ref({})
const buyerSaving = ref(false)
const showBuyerDeleteModal = ref(false)
const buyerToDelete = ref(null)

const positionOptions = [
  { label: '팀장', value: '팀장' },
  { label: '팀원', value: '팀원' },
]

function getEmptyBuyerForm() {
  return { name: '', position: '', email: '', tel: '' }
}

const infoGroups = computed(() => {
  if (!client.value) return []
  return [
    {
      title: '기본 정보',
      fields: [
        { label: '코드', value: client.value.clientCode, highlight: true },
        { label: '한글명', value: client.value.clientNameKr },
      ],
    },
    {
      title: '위치 정보',
      fields: [
        { label: '국가', value: client.value.countryName || getCountryName(client.value.countryId, { detailed: true }) },
        { label: '도시', value: client.value.clientCity },
        { label: '도착항', value: client.value.portName || getPortName(client.value.portId) },
        { label: '주소', value: client.value.clientAddress, wide: true },
      ],
    },
    {
      title: '연락처',
      fields: [
        { label: '거래처 담당자(바이어)', value: client.value.clientManager },
        { label: 'TEL', value: client.value.clientTel },
        { label: 'Email', value: client.value.clientEmail },
      ],
    },
    {
      title: '거래 조건',
      fields: [
        { label: '결제조건', value: getPaymentTermsLabel(client.value.paymentTermId, { detailed: true }) },
        { label: '통화', value: getCurrencyLabel(client.value.currencyId, { detailed: true }) },
        { label: '등록일', value: client.value.clientRegDate },
      ],
    },
    {
      title: '담당 조직',
      fields: [
        { label: '부서', value: client.value.departmentName ?? '-' },
        { label: '팀', value: client.value.teamName ?? '-' },
      ],
    },
  ]
})

async function loadData() {
  const rawId = route.params.id
  if (!/^\d+$/.test(String(rawId))) {
    router.replace({ name: 'client-list' })
    return
  }
  loading.value = true
  try {
    const [clientData, buyersData, clientsData, , deptsData, teamsData] =
      await Promise.all([
        fetchClient(route.params.id),
        fetchBuyersByClient(route.params.id),
        fetchClients(),
        loadReferenceData(),
        fetchDepartments(),
        fetchTeams(),
      ])
    departments.value = deptsData ?? []
    teams.value = teamsData ?? []
    if (!clientData) {
      error('거래처를 찾을 수 없습니다.')
      router.push({ name: 'client-list' })
      return
    }
    client.value = clientData

    if (!isAdmin.value && currentUser.value?.role === 'sales' &&
        clientData.teamId !== Number(currentUser.value?.teamId)) {
      error('접근 권한이 없는 거래처입니다.')
      router.push({ name: 'client-list' })
      return
    }

    allClients.value = clientsData
    buyers.value = buyersData
  } catch {
    error('데이터를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

async function reloadBuyers() {
  try {
    buyers.value = await fetchBuyersByClient(route.params.id)
  } catch {
    error('바이어 목록을 다시 불러오지 못했습니다.')
  }
}

onMounted(loadData)

function openEditModal() {
  showFormModal.value = true
}

async function handleSave(formData) {
  if (saving.value) return
  saving.value = true
  try {
    await updateClient(client.value.id ?? client.value.clientId, formData)
    success('거래처 정보가 수정되었습니다.')
    showFormModal.value = false
    await loadData()
  } catch {
    error('수정 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

const deleting = ref(false)

async function handleDelete() {
  if (!client.value || deleting.value) return
  deleting.value = true
  const name = client.value.clientName
  try {
    await changeClientStatus(client.value.id ?? client.value.clientId, 'inactive')
    success(`${name} 거래처가 비활성화되었습니다.`)
    router.push({ name: 'client-list' })
  } catch {
    error('삭제 중 오류가 발생했습니다.')
  } finally {
    showConfirmModal.value = false
    deleting.value = false
  }
}

// ── 바이어 CRUD ─────────────────────────────────────────────
function openBuyerCreate() {
  buyerMode.value = 'create'
  editingBuyerId.value = null
  buyerForm.value = getEmptyBuyerForm()
  buyerErrors.value = {}
  showBuyerModal.value = true
}

function openBuyerEdit(buyer) {
  buyerMode.value = 'edit'
  editingBuyerId.value = buyer.id ?? buyer.buyerId
  buyerForm.value = {
    name: buyer.buyerName ?? '',
    position: buyer.buyerPosition ?? '',
    email: buyer.buyerEmail ?? '',
    tel: buyer.buyerTel ?? '',
  }
  buyerErrors.value = {}
  showBuyerModal.value = true
}

function validateBuyerForm() {
  const e = {}
  if (!buyerForm.value.name.trim()) e.name = '이름을 입력하세요.'
  if (!buyerForm.value.email.trim()) {
    e.email = '이메일을 입력하세요.'
  } else if (!isValidEmail(buyerForm.value.email)) {
    e.email = '올바른 이메일 형식을 입력하세요.'
  }
  if (buyerForm.value.tel.trim() && !isValidTel(buyerForm.value.tel)) {
    e.tel = '올바른 전화번호 형식을 입력하세요.'
  }
  buyerErrors.value = e
  return Object.keys(e).length === 0
}

async function handleBuyerSave() {
  if (!validateBuyerForm() || buyerSaving.value) return
  buyerSaving.value = true
  const payload = {
    clientId: client.value.id ?? client.value.clientId,
    buyerName: buyerForm.value.name,
    buyerPosition: buyerForm.value.position,
    buyerEmail: buyerForm.value.email,
    buyerTel: buyerForm.value.tel,
  }
  try {
    if (buyerMode.value === 'create') {
      await createBuyer(payload)
      success('바이어가 등록되었습니다.')
    } else {
      await updateBuyer(editingBuyerId.value, payload)
      success('바이어 정보가 수정되었습니다.')
    }
    showBuyerModal.value = false
    await reloadBuyers()
  } catch {
    error('바이어 저장 중 오류가 발생했습니다.')
  } finally {
    buyerSaving.value = false
  }
}

function openBuyerDelete(buyer) {
  buyerToDelete.value = buyer
  showBuyerDeleteModal.value = true
}

async function handleBuyerDelete() {
  if (!buyerToDelete.value) return
  try {
    await deleteBuyer(buyerToDelete.value.id ?? buyerToDelete.value.buyerId)
    success('바이어가 삭제되었습니다.')
    showBuyerDeleteModal.value = false
    buyerToDelete.value = null
    await reloadBuyers()
  } catch {
    error('삭제 중 오류가 발생했습니다.')
  }
}

function goBack() {
  if (router.options.history.state?.back) router.back()
  else router.push({ name: 'client-list' })
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-slate-400">
    데이터를 불러오는 중입니다...
  </div>

  <div v-else-if="client" class="space-y-6">
    <DetailPageHeader :title="`${client.clientCode} · ${client.clientName}`" :status="label(CLIENT_STATUS_LABEL, client.clientStatus)" @back="goBack">
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="openEditModal">수정</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="showConfirmModal = true">삭제</BaseButton>
      </template>
    </DetailPageHeader>

    <div class="space-y-6">
      <BaseCard title="기본 정보" subtitle="거래처의 상세 정보입니다.">
        <div class="space-y-6">
          <div v-for="group in infoGroups" :key="group.title">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{{ group.title }}</h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div v-for="field in group.fields" :key="field.label" :class="field.wide ? 'sm:col-span-2' : ''">
                <p class="text-xs font-medium text-slate-500">{{ field.label }}</p>
                <p class="mt-1 text-sm text-ink" :class="field.highlight ? 'font-mono font-semibold text-brand-600' : ''">{{ field.value || '-' }}</p>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 바이어 CRUD 인라인 -->
      <BaseCard title="바이어" subtitle="거래처 측 연락 담당자(바이어) 목록입니다.">
        <template #header-actions>
          <BaseButton variant="primary" size="sm" @click="openBuyerCreate">
            <template #leading><i class="fas fa-plus text-xs" aria-hidden="true"></i></template>
            바이어 추가
          </BaseButton>
        </template>
        <div v-if="buyers.length" class="overflow-hidden rounded-xl border border-slate-200">
          <table class="min-w-full divide-y divide-slate-100 text-sm">
            <thead class="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th class="px-3 py-2 text-left">이름</th>
                <th class="px-3 py-2 text-left">직책</th>
                <th class="px-3 py-2 text-left">이메일</th>
                <th class="px-3 py-2 text-left">전화</th>
                <th class="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="buyer in buyers" :key="buyer.id ?? buyer.buyerId">
                <td class="px-3 py-2 font-medium text-slate-800">{{ buyer.buyerName || '-' }}</td>
                <td class="px-3 py-2 text-slate-600">{{ buyer.buyerPosition || '-' }}</td>
                <td class="px-3 py-2 text-slate-600">{{ buyer.buyerEmail || '-' }}</td>
                <td class="px-3 py-2 text-slate-600">{{ buyer.buyerTel || '-' }}</td>
                <td class="px-3 py-2 text-right">
                  <button type="button" class="mr-2 text-xs text-slate-500 hover:text-brand-600" @click="openBuyerEdit(buyer)">수정</button>
                  <button type="button" class="text-xs text-slate-500 hover:text-red-600" @click="openBuyerDelete(buyer)">삭제</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
          등록된 바이어가 없습니다. 상단 "바이어 추가"로 등록하세요.
        </div>
      </BaseCard>
    </div>

    <ClientFormModal
      :open="showFormModal"
      mode="edit"
      :client="client"
      :countries="countries"
      :ports="ports"
      :currencies="currencies"
      :payment-terms="paymentTerms"
      :departments="departments"
      :teams="teams"
      :lock-team="!isAdmin"
      :all-clients="allClients"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="showConfirmModal"
      title="거래처 삭제"
      message="해당 거래처를 삭제하시겠습니까?"
      :detail="client?.clientName"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="handleDelete"
      @cancel="showConfirmModal = false"
    />

    <!-- 바이어 등록/수정 모달 -->
    <BaseModal
      :open="showBuyerModal"
      :title="buyerMode === 'create' ? '바이어 추가' : '바이어 수정'"
      width="max-w-md"
      :z-index="60"
      @close="showBuyerModal = false"
    >
      <div class="space-y-4">
        <FormField label="이름" required :error="buyerErrors.name">
          <BaseTextField v-model="buyerForm.name" placeholder="바이어 이름" />
        </FormField>
        <FormField label="직책">
          <BaseSelect v-model="buyerForm.position" :options="positionOptions" placeholder="직책 선택" />
        </FormField>
        <FormField label="이메일" required :error="buyerErrors.email">
          <BaseTextField v-model="buyerForm.email" type="email" placeholder="buyer@example.com" />
        </FormField>
        <FormField label="전화" :error="buyerErrors.tel">
          <BaseTextField v-model="buyerForm.tel" placeholder="+1 555-123-4567" />
        </FormField>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showBuyerModal = false">취소</BaseButton>
        <BaseButton :disabled="buyerSaving" @click="handleBuyerSave">
          {{ buyerSaving ? '저장 중...' : (buyerMode === 'create' ? '추가' : '저장') }}
        </BaseButton>
      </template>
    </BaseModal>

    <ConfirmModal
      :open="showBuyerDeleteModal"
      title="바이어 삭제"
      message="해당 바이어를 삭제하시겠습니까?"
      :detail="buyerToDelete?.buyerName"
      confirm-label="삭제"
      confirm-variant="danger"
      :z-index="70"
      @confirm="handleBuyerDelete"
      @cancel="showBuyerDeleteModal = false"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    거래처를 찾을 수 없습니다.
  </div>
</template>
