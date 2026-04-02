<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import ClientBuyerCard from '@/components/domain/master/ClientBuyerCard.vue'
import ClientFormModal from '@/components/domain/master/ClientFormModal.vue'
import DocumentLinkButton from '@/components/domain/master/DocumentLinkButton.vue'
import { useAuthStore } from '@/stores/auth'
import {
  changeClientStatus,
  fetchBuyersByClient,
  fetchClient,
  fetchClients,
  updateClient,
} from '@/api/master'
import { useMasterLookup } from '@/composables/useMasterLookup'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { success, error } = useToast()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)
const isAdmin = computed(() => currentUser.value?.role === 'admin')

const { countries, ports, currencies, paymentTerms, loadReferenceData, getCountryName, getPortName, getPaymentTermsLabel, getCurrencyLabel } = useMasterLookup()

const client = ref(null)
const allClients = ref([])
const loading = ref(false)
const saving = ref(false)

const showFormModal = ref(false)
const showConfirmModal = ref(false)

const buyers = ref([])

const infoGroups = computed(() => {
  if (!client.value) return []
  return [
    {
      title: '기본 정보',
      fields: [
        { label: '코드', value: client.value.code, highlight: true },
        { label: '한글명', value: client.value.nameKr },
      ],
    },
    {
      title: '위치 정보',
      fields: [
        { label: '국가', value: getCountryName(client.value.countryId, { detailed: true }) },
        { label: '도시', value: client.value.city },
        { label: '도착항', value: getPortName(client.value.portId) },
        { label: '주소', value: client.value.address, wide: true },
      ],
    },
    {
      title: '연락처',
      fields: [
        { label: '담당자', value: client.value.manager },
        { label: 'TEL', value: client.value.tel },
        { label: 'Email', value: client.value.email },
      ],
    },
    {
      title: '거래 조건',
      fields: [
        { label: '결제조건', value: getPaymentTermsLabel(client.value.paymentTermsId, { detailed: true }) },
        { label: '통화', value: getCurrencyLabel(client.value.currencyId, { detailed: true }) },
        { label: '등록일', value: client.value.regDate },
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
    const [clientData, buyersData, clientsData] =
      await Promise.all([
        fetchClient(route.params.id),
        fetchBuyersByClient(route.params.id),
        fetchClients(),
        loadReferenceData(),
      ])
    if (!clientData) {
      error('거래처를 찾을 수 없습니다.')
      router.push({ name: 'client-list' })
      return
    }
    client.value = clientData

    // 영업 사용자가 타부서 거래처에 접근 시 리다이렉트
    if (!isAdmin.value && currentUser.value?.role === 'sales' &&
        clientData.departmentId !== Number(currentUser.value?.departmentId)) {
      error('접근 권한이 없는 거래처입니다.')
      router.push({ name: 'client-list' })
      return
    }

    allClients.value = clientsData
    buyers.value = buyersData.map((b) => ({
      name: b.name,
      position: b.position,
      email: b.email,
      phone: b.tel,
    }))
  } catch {
    error('데이터를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
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
    await updateClient(client.value.id, formData)
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
  const name = client.value.name
  try {
    await changeClientStatus(client.value.id, 'INACTIVE')
    success(`${name} 거래처가 비활성화되었습니다.`)
    router.push({ name: 'client-list' })
  } catch {
    error('삭제 중 오류가 발생했습니다.')
  } finally {
    showConfirmModal.value = false
    deleting.value = false
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
    <DetailPageHeader :title="`${client.code} · ${client.name}`" :status="client.status" @back="goBack">
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

      <BaseCard title="바이어 / 담당자" subtitle="거래처 담당자 정보입니다.">
        <div v-if="buyers.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ClientBuyerCard v-for="buyer in buyers" :key="buyer.name" :buyer="buyer" />
        </div>
        <div v-else class="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
          등록된 바이어가 없습니다.
        </div>
      </BaseCard>

      <!-- 연결 문서 링크 -->
      <BaseCard title="관련 문서 바로가기" subtitle="이 거래처의 관련 문서를 조회합니다.">
        <div class="flex flex-wrap gap-2">
          <DocumentLinkButton :to="{ path: '/pi', query: { clientId: client.id } }">
            PI 조회
          </DocumentLinkButton>
          <DocumentLinkButton :to="{ path: '/po', query: { clientId: client.id } }">
            PO 조회
          </DocumentLinkButton>
          <DocumentLinkButton :to="{ path: '/ci', query: { clientId: client.id } }">
            CI 조회
          </DocumentLinkButton>
          <DocumentLinkButton :to="{ path: '/pl', query: { clientId: client.id } }">
            PL 조회
          </DocumentLinkButton>
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
      :all-clients="allClients"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="showConfirmModal"
      title="거래처 삭제"
      message="해당 거래처를 삭제하시겠습니까?"
      :detail="client?.name"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="handleDelete"
      @cancel="showConfirmModal = false"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    거래처를 찾을 수 없습니다.
  </div>
</template>
