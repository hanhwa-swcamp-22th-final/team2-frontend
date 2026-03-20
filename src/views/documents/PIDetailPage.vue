<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import PIDocumentTemplate from '@/components/domain/document/PIDocumentTemplate.vue'
import PIFormModal from '@/components/domain/document/PIFormModal.vue'
import { fetchBuyers, fetchClients, fetchCountries } from '@/api/master'
import { useToast } from '@/composables/useToast'
import { openDocumentOutputByType } from '@/utils/documentOutput'
import { formatIncotermsLabel, resolveIncotermState } from '@/utils/incoterms'

const route = useRoute()
const router = useRouter()
const { info, success } = useToast()

const previewOpen = ref(false)
const formOpen = ref(false)
const deleteOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedClient = ref(null)

const detailMap = ref({
  PI26001: {
    id: 'PI26001',
    status: '확정',
    clientName: 'COOLSAY SDN BHD',
    buyer: 'Mr. Ahmad Razak (Purchasing Manager)',
    currency: 'USD',
    incoterms: 'FOB',
    namedPlace: 'BUSAN',
    deliveryDate: '2026/04/15',
    issueDate: '2026/02/01',
    manager: '김영업',
    linkedDocuments: [
      { id: 'PO26001', status: '생산중' },
    ],
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '30', unit: 'EA', unitPrice: '$850', amount: '$25,500', remark: '' },
      { name: 'Lubricant Oil SAE 10W-40', quantity: '200', unit: 'EA', unitPrice: '$30', amount: '$6,000', remark: '' },
      { name: 'Industrial Grease EP-2', quantity: '100', unit: 'EA', unitPrice: '$45', amount: '$4,500', remark: '' },
      { name: 'Hydraulic Oil ISO VG 46', quantity: '32', unit: 'EA', unitPrice: '$200', amount: '$6,400', remark: '' },
    ],
    totalAmount: '$42,400',
    revisionHistory: [],
  },
  PI26002: {
    id: 'PI26002',
    status: '발송',
    clientName: 'TechBridge GmbH',
    buyer: 'Ms. Hanna Schneider (Procurement Lead)',
    currency: 'EUR',
    incoterms: 'CIF',
    namedPlace: 'HAMBURG',
    deliveryDate: '2026/05/20',
    issueDate: '2026/02/15',
    manager: '김영업',
    linkedDocuments: [
      { id: 'PO26002', status: '생산중' },
    ],
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '80', unit: 'EA', unitPrice: '€855', amount: '€68,400', remark: '' },
    ],
    totalAmount: '€68,400',
    revisionHistory: [],
  },
  PI26003: {
    id: 'PI26003',
    status: '초안',
    clientName: 'Pacific Trading Inc.',
    buyer: 'Mr. Jacob Miller (Import Manager)',
    currency: 'USD',
    incoterms: 'CFR',
    namedPlace: 'LOS ANGELES',
    deliveryDate: '2026/06/01',
    issueDate: '2026/03/01',
    manager: '정영업',
    linkedDocuments: [],
    items: [
      { name: 'Lubricant Oil SAE 10W-40', quantity: '520', unit: 'EA', unitPrice: '$30', amount: '$15,600', remark: '' },
    ],
    totalAmount: '$15,600',
    revisionHistory: [],
  },
})

const detail = computed(() => detailMap.value[route.params.id] ?? null)

const fallbackClientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아', buyers: ['Mr. Ahmad Razak (Purchasing Manager)', 'Ms. Siti Nurhaliza (Director)'] },
  { id: 'CL002', name: 'TechBridge GmbH', country: '독일', buyers: ['Ms. Hanna Schneider (Procurement Lead)'] },
  { id: 'CL003', name: 'Pacific Trading Inc.', country: '미국', buyers: ['Mr. Jacob Miller (Import Manager)'] },
]
const clientRowsSource = ref([...fallbackClientRowsSource])

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource.value
  return clientRowsSource.value.filter((client) => [client.id, client.name, client.country].some((value) => value.toLowerCase().includes(keyword)))
})

const incotermsLabel = computed(() => (
  detail.value ? formatIncotermsLabel(detail.value.incoterms, detail.value.namedPlace) : '-'
))

const previewFields = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '바이어', value: detail.value.buyer },
    { label: '통화', value: detail.value.currency },
    { label: '인코텀즈', value: incotermsLabel.value },
    { label: '납기일', value: detail.value.deliveryDate },
    { label: '발행일', value: detail.value.issueDate },
  ]
})

const currencySymbolMap = {
  KRW: '₩',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  AED: 'AED ',
  CNY: '¥',
  MYR: 'RM ',
  THB: '฿',
  VND: '₫',
  IDR: 'Rp ',
  INR: '₹',
  SAR: 'SAR ',
  BRL: 'R$',
  SEK: 'kr ',
  CHF: 'CHF ',
}

function parseNumericValue(value) {
  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatCurrencyValue(currency, value) {
  const symbol = currencySymbolMap[currency] ?? `${currency} `
  return `${symbol}${Math.round(value).toLocaleString('en-US')}`
}

function formatSlashDate(value) {
  return value ? value.replaceAll('-', '/') : '-'
}

async function loadClientRows() {
  try {
    const [clientsData, countriesData, buyersData] = await Promise.all([
      fetchClients(),
      fetchCountries(),
      fetchBuyers(),
    ])

    const countryMap = new Map(
      countriesData.map((country) => [String(country.id), country.nameKr ?? country.name ?? '-']),
    )

    const buyersByClientId = buyersData.reduce((map, buyer) => {
      const clientId = String(buyer.clientId)
      const label = buyer.position ? `${buyer.name} (${buyer.position})` : buyer.name
      const rows = map.get(clientId) ?? []
      rows.push(label)
      map.set(clientId, rows)
      return map
    }, new Map())

    clientRowsSource.value = clientsData.map((client) => ({
      id: String(client.id),
      code: client.code,
      name: client.name,
      country: countryMap.get(String(client.countryId)) ?? '-',
      buyers: buyersByClientId.get(String(client.id)) ?? [],
    }))
  } catch {
    clientRowsSource.value = [...fallbackClientRowsSource]
  }
}

onMounted(loadClientRows)

function goBack() {
  router.push({ name: 'pi' })
}

function openPreview() {
  previewOpen.value = true
}

function handleEdit() {
  formOpen.value = true
}

function handleDelete() {
  deleteOpen.value = true
}

function handlePrint() {
  if (!detail.value) return
  openDocumentOutputByType('PI', detail.value, true)
}

function handlePdfDownload() {
  if (!detail.value) return
  const opened = openDocumentOutputByType('PI', detail.value, false)
  if (opened) {
    info('브라우저 인쇄 창에서 "PDF로 저장"을 선택하세요.', 'PDF')
  }
}

function handlePreviewPrint() {
  previewOpen.value = false
  handlePrint()
}

function handleSave(formValue) {
  if (!detail.value) return

  const normalizedIncoterms = resolveIncotermState(formValue.incoterms, formValue.namedPlace)
  const normalizedItems = (formValue.items ?? []).map((item) => {
    const quantity = String(item.qty ?? item.quantity ?? '')
    const unitPriceValue = parseNumericValue(item.unitPrice)
    const amountValue = parseNumericValue(item.amount)

    return {
      name: item.name ?? '',
      quantity,
      unit: item.unit ?? '',
      unitPrice: formatCurrencyValue(formValue.currency, unitPriceValue),
      amount: formatCurrencyValue(formValue.currency, amountValue),
      remark: item.remark ?? '',
    }
  })

  const totalAmount = normalizedItems.reduce((sum, item) => sum + parseNumericValue(item.amount), 0)

  detailMap.value = {
    ...detailMap.value,
    [detail.value.id]: {
      ...detail.value,
      clientName: formValue.clientName,
      buyer: formValue.buyerName,
      currency: formValue.currency,
      incoterms: normalizedIncoterms.code,
      namedPlace: normalizedIncoterms.namedPlace,
      issueDate: formatSlashDate(formValue.issueDate),
      deliveryDate: formatSlashDate(formValue.deliveryDate),
      items: normalizedItems,
      totalAmount: formatCurrencyValue(formValue.currency, totalAmount),
    },
  }

  formOpen.value = false
  success(`${detail.value?.id} 수정 폼이 연결되었습니다.`)
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function handleClientSelect(client) {
  selectedClient.value = client
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function goToLinkedDocument(documentId) {
  if (!documentId?.startsWith('PO')) return
  router.push({ name: 'po-detail', params: { id: documentId } })
}

function confirmDelete() {
  deleteOpen.value = false
  success(`${detail.value?.id}가 삭제되었습니다.`)
  router.push({ name: 'pi' })
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6">
      <DetailPageHeader :title="detail.id" :status="detail.status" @back="goBack">
        <template #actions>
          <BaseButton size="sm" @click="handleEdit">
            <template #leading>
              <i class="fas fa-edit text-xs" aria-hidden="true"></i>
            </template>
            수정
          </BaseButton>
          <BaseButton variant="secondary" size="sm" @click="handleDelete">
            <template #leading>
              <i class="fas fa-trash text-xs" aria-hidden="true"></i>
            </template>
            삭제
          </BaseButton>
          <BaseButton variant="secondary" size="sm" @click="openPreview">
            <template #leading>
              <i class="fas fa-eye text-xs text-brand-500" aria-hidden="true"></i>
            </template>
            미리보기
          </BaseButton>
          <BaseButton variant="secondary" size="sm" @click="handlePrint">
            <template #leading>
              <i class="fas fa-print text-xs text-slate-400" aria-hidden="true"></i>
            </template>
            인쇄
          </BaseButton>
          <BaseButton size="sm" @click="handlePdfDownload">
            <template #leading>
              <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
            </template>
            PDF 다운로드
          </BaseButton>
        </template>
      </DetailPageHeader>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">기본 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span class="text-slate-500">거래처</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.clientName }}</div>
            </div>
            <div>
              <span class="text-slate-500">바이어</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.buyer }}</div>
            </div>
            <div>
              <span class="text-slate-500">통화</span>
              <div class="mt-0.5">{{ detail.currency }}</div>
            </div>
            <div>
              <span class="text-slate-500">인코텀즈</span>
              <div class="mt-0.5">{{ incotermsLabel }}</div>
            </div>
            <div>
              <span class="text-slate-500">납기일</span>
              <div class="mt-0.5">{{ detail.deliveryDate }}</div>
            </div>
            <div>
              <span class="text-slate-500">발행일</span>
              <div class="mt-0.5">{{ detail.issueDate }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">품목 목록</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[620px] text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="p-3 text-left">품목</th>
                  <th class="p-3 text-right">수량</th>
                  <th class="p-3 text-right">단가</th>
                  <th class="p-3 text-right">금액</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in detail.items" :key="`${detail.id}-${item.name}`">
                  <td class="p-3">{{ item.name }}</td>
                  <td class="p-3 text-right">{{ item.quantity }}</td>
                  <td class="p-3 text-right">{{ item.unitPrice }}</td>
                  <td class="p-3 text-right font-semibold">{{ item.amount }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-slate-200">
                  <td colspan="3" class="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                    합계
                  </td>
                  <td class="p-3 text-right text-base font-extrabold text-slate-900">{{ detail.totalAmount }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">연결 문서</h3>
          <div class="space-y-2 text-sm">
            <template v-if="detail.linkedDocuments.length">
              <button
                v-for="document in detail.linkedDocuments"
                :key="document.id"
                type="button"
                class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50"
                @click="goToLinkedDocument(document.id)"
              >
                <i class="fas fa-file-contract" aria-hidden="true"></i>
                {{ document.id }}
                <StatusBadge :value="document.status" />
              </button>
            </template>
            <div v-else class="text-xs text-slate-400">연결 문서 없음</div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">담당자</h3>
          <div class="text-sm">{{ detail.manager }}</div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">수정 이력</h3>
          </div>
          <div class="text-xs text-slate-400">
            {{ detail.revisionHistory.length ? detail.revisionHistory.join(', ') : '수정 이력 없음' }}
          </div>
        </div>
      </div>
    </div>

    <DocumentPreviewModal
      :open="previewOpen"
      title="PI 미리보기"
      :document-title="detail.id"
      :fields="previewFields"
      @close="previewOpen = false"
      @print="handlePreviewPrint"
    >
      <PIDocumentTemplate :document="detail" />
    </DocumentPreviewModal>

    <PIFormModal
      :open="formOpen"
      mode="edit"
      :document="{
        id: detail.id,
        clientName: detail.clientName,
        buyerName: detail.buyer,
        country: selectedClient?.country ?? '',
        currency: detail.currency,
        incoterms: detail.incoterms,
        namedPlace: detail.namedPlace,
        issueDate: detail.issueDate,
        deliveryDate: detail.deliveryDate,
        items: detail.items.map((item) => ({
          name: item.name,
          qty: item.quantity,
          unit: item.unit ?? 'EA',
          unitPrice: item.unitPrice.replace(/[^0-9.]/g, ''),
          amount: item.amount,
          remark: item.remark ?? '',
        })),
      }"
      :selected-client="selectedClient"
      @open-client-search="openClientSearch"
      @close="formOpen = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="deleteOpen"
      title="PI 삭제"
      message="아래 PI를 삭제하시겠습니까?"
      :detail="detail.id"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
    />

    <SearchModal
      :open="clientSearchOpen"
      title="거래처 검색"
      :columns="[
        { key: 'id', label: '코드' },
        { key: 'name', label: '거래처명' },
        { key: 'country', label: '국가' },
      ]"
      :rows="clientRows"
      :search-keyword="clientSearchKeyword"
      @update:search-keyword="clientSearchKeyword = $event"
      @close="clientSearchOpen = false"
      @select="handleClientSelect"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    PI 문서를 찾을 수 없습니다.
  </div>
</template>
