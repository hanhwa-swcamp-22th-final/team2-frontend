<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ClientBuyerCard from '@/components/domain/master/ClientBuyerCard.vue'
import ClientFormModal from '@/components/domain/master/ClientFormModal.vue'
import LinkedDocumentList from '@/components/domain/document/LinkedDocumentList.vue'
import {
  deleteClient,
  fetchClient,
  fetchCountries,
  fetchCurrencies,
  fetchPaymentTerms,
  fetchPorts,
  updateClient,
} from '@/api/master'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { success, error } = useToast()

const client = ref(null)
const countries = ref([])
const ports = ref([])
const currencies = ref([])
const paymentTerms = ref([])
const loading = ref(false)
const saving = ref(false)

const showFormModal = ref(false)
const showConfirmModal = ref(false)

function getCountryName(countryId) {
  const found = countries.value.find((c) => String(c.id) === String(countryId))
  return found ? `${found.nameKr} (${found.name})` : '-'
}

function getPortName(portId) {
  const found = ports.value.find((p) => String(p.id) === String(portId))
  return found ? found.name : '-'
}

function getPaymentTermsLabel(paymentTermsId) {
  const found = paymentTerms.value.find((p) => String(p.id) === String(paymentTermsId))
  return found ? `${found.code} (${found.description})` : '-'
}

function getCurrencyCode(currencyId) {
  const found = currencies.value.find((c) => String(c.id) === String(currencyId))
  return found ? `${found.code} (${found.symbol})` : '-'
}

const buyers = computed(() => {
  if (!client.value) return []
  return [
    {
      name: client.value.manager,
      position: 'Sales Manager',
      email: client.value.email,
      phone: client.value.tel,
    },
  ]
})

// TODO: API로 해당 거래처의 연결 문서 조회
const linkedDocuments = [
  { code: 'PI-2025-001', label: 'Proforma Invoice #001', status: '확정' },
  { code: 'PI-2025-003', label: 'Proforma Invoice #003', status: '초안' },
  { code: 'PO-2025-002', label: 'Purchase Order #002', status: '발송' },
]

const infoFields = computed(() => {
  if (!client.value) return []
  return [
    { label: '코드', value: client.value.code },
    { label: '한글명', value: client.value.nameKr },
    { label: '국가', value: getCountryName(client.value.countryId) },
    { label: '도시', value: client.value.city },
    { label: '도착항', value: getPortName(client.value.portId) },
    { label: '주소', value: client.value.address },
    { label: 'TEL', value: client.value.tel },
    { label: 'Email', value: client.value.email },
    { label: '결제조건', value: getPaymentTermsLabel(client.value.paymentTermsId) },
    { label: '통화', value: getCurrencyCode(client.value.currencyId) },
    { label: '담당자', value: client.value.manager },
    { label: '등록일', value: client.value.regDate },
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
    const [clientData, countriesData, portsData, currenciesData, paymentTermsData] =
      await Promise.all([
        fetchClient(route.params.id),
        fetchCountries(),
        fetchPorts(),
        fetchCurrencies(),
        fetchPaymentTerms(),
      ])
    client.value = clientData
    countries.value = countriesData
    ports.value = portsData
    currencies.value = currenciesData
    paymentTerms.value = paymentTermsData
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
    await deleteClient(client.value.id)
    success(`${name} 거래처가 삭제되었습니다.`)
    router.push({ name: 'client-list' })
  } catch {
    error('삭제 중 오류가 발생했습니다.')
  } finally {
    showConfirmModal.value = false
    deleting.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'client-list' })
}

function handleDocumentSelect(doc) {
  // Navigate to the relevant document based on its code prefix
  const code = doc.code ?? ''
  if (code.startsWith('PI')) router.push({ path: '/pi', query: { code } })
  else if (code.startsWith('PO')) router.push({ path: '/po', query: { code } })
  else if (code.startsWith('CI')) router.push({ path: '/ci', query: { code } })
  else if (code.startsWith('PL')) router.push({ path: '/pl', query: { code } })
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-slate-400">
    데이터를 불러오는 중입니다...
  </div>

  <div v-else-if="client" class="space-y-6">
    <!-- 헤더 -->
    <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <button type="button" class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" @click="goBack">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold tracking-tight text-ink">{{ client.name }}</h1>
        <StatusBadge :value="client.status" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <BaseButton variant="secondary" size="sm" @click="openEditModal">수정</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="showConfirmModal = true">삭제</BaseButton>
        <BaseButton variant="ghost" size="sm" :disabled="true" title="준비 중">인쇄</BaseButton>
        <BaseButton variant="ghost" size="sm" :disabled="true" title="준비 중">PDF</BaseButton>
      </div>
    </div>

    <!-- 2열 레이아웃 -->
    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- 좌측 -->
      <div class="space-y-6">
        <BaseCard title="기본 정보" subtitle="거래처의 상세 정보입니다.">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="field in infoFields" :key="field.label">
              <p class="text-xs font-medium text-slate-500">{{ field.label }}</p>
              <p class="mt-1 text-sm text-ink">{{ field.value || '-' }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="바이어 / 담당자" subtitle="거래처 담당자 정보입니다.">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ClientBuyerCard v-for="buyer in buyers" :key="buyer.name" :buyer="buyer" />
          </div>
        </BaseCard>

        <!-- 연결 문서 링크 -->
        <BaseCard title="관련 문서 바로가기" subtitle="이 거래처의 관련 문서를 조회합니다.">
          <div class="flex flex-wrap gap-2">
            <RouterLink
              :to="{ path: '/pi', query: { clientId: client.id } }"
              class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
            >
              PI 조회
            </RouterLink>
            <RouterLink
              :to="{ path: '/po', query: { clientId: client.id } }"
              class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
            >
              PO 조회
            </RouterLink>
            <RouterLink
              :to="{ path: '/ci', query: { clientId: client.id } }"
              class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
            >
              CI 조회
            </RouterLink>
            <RouterLink
              :to="{ path: '/pl', query: { clientId: client.id } }"
              class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
            >
              PL 조회
            </RouterLink>
          </div>
        </BaseCard>
      </div>

      <!-- 우측 -->
      <div>
        <!-- 플레이스홀더 데이터 — TODO: API로 해당 거래처의 연결 문서 조회 -->
        <LinkedDocumentList :documents="linkedDocuments" @select="handleDocumentSelect" />
      </div>
    </div>

    <ClientFormModal
      :open="showFormModal"
      mode="edit"
      :client="client"
      :countries="countries"
      :ports="ports"
      :currencies="currencies"
      :payment-terms="paymentTerms"
      :all-clients="[]"
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
