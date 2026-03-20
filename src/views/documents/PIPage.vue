<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TableActions from '@/components/common/TableActions.vue'
import PIFormModal from '@/components/domain/document/PIFormModal.vue'
import { fetchBuyers, fetchClients, fetchCountries, fetchCurrencies } from '@/api/master'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success } = useToast()

const isAdvancedOpen = ref(true)
const formOpen = ref(false)
const formMode = ref('create')
const selectedRow = ref(null)
const deleteOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedClient = ref(null)
const codeSearchOpen = ref(false)
const codeSearchKeyword = ref('')
const productSearchOpen = ref(false)
const productSearchKeyword = ref('')
const clientSearchContext = ref('filter')

const managerOptions = [
  { value: '김영업', label: '김영업' },
  { value: '정영업', label: '정영업' },
  { value: '최관리', label: '최관리' },
]

const countryOptions = [
  { value: '말레이시아', label: '말레이시아' },
  { value: '독일', label: '독일' },
  { value: '미국', label: '미국' },
  { value: '태국', label: '태국' },
  { value: '싱가포르', label: '싱가포르' },
  { value: '인도', label: '인도' },
  { value: '호주', label: '호주' },
]

const statusOptions = [
  { value: '초안', label: '초안' },
  { value: '발송', label: '발송' },
  { value: '확정', label: '확정' },
  { value: '취소', label: '취소' },
]
const fallbackClientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아', currency: 'USD', buyers: ['Mr. Ahmad Razak (Purchasing Manager)', 'Ms. Siti Nurhaliza (Director)'] },
  { id: 'CL002', name: 'TechBridge GmbH', country: '독일', currency: 'EUR', buyers: ['Ms. Hanna Schneider (Procurement Lead)'] },
  { id: 'CL003', name: 'Pacific Trading Inc.', country: '미국', currency: 'USD', buyers: ['Mr. Jacob Miller (Import Manager)'] },
]
const clientRowsSource = ref([...fallbackClientRowsSource])

const columns = [
  { key: 'id', label: 'PI번호', align: 'center', width: '140px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'manager', label: '영업담당자', align: 'center', width: '120px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
  { key: 'deliveryDate', label: '납기', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'center', width: '90px' },
]

const initialRows = [
  {
    id: 'PI26001',
    issueDate: '2026/02/01',
    clientName: 'COOLSAY SDN BHD',
    buyerName: 'Mr. Ahmad Razak (Purchasing Manager)',
    currency: 'USD',
    country: '말레이시아',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$42,400',
    incoterms: 'FOB',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/04/15',
    items: [
      { name: 'H-Beam 482x300x11x15', qty: '30', unit: 'EA', unitPrice: '850', amount: '25500', remark: '' },
      { name: 'Lubricant Oil SAE 10W-40', qty: '200', unit: 'EA', unitPrice: '30', amount: '6000', remark: '' },
      { name: 'Industrial Grease EP-2', qty: '100', unit: 'EA', unitPrice: '45', amount: '4500', remark: '' },
      { name: 'Hydraulic Oil ISO VG 46', qty: '32', unit: 'EA', unitPrice: '200', amount: '6400', remark: '' },
    ],
  },
  {
    id: 'PI26002',
    issueDate: '2026/02/15',
    clientName: 'TechBridge GmbH',
    buyerName: 'Ms. Hanna Schneider (Procurement Lead)',
    currency: 'EUR',
    country: '독일',
    itemName: 'H-Beam 482x300x11x15',
    amount: '€68,400',
    incoterms: 'FOB',
    manager: '김영업',
    status: '발송',
    deliveryDate: '2026/05/20',
    items: [
      { name: 'H-Beam 482x300x11x15', qty: '40', unit: 'EA', unitPrice: '900', amount: '36000', remark: '' },
      { name: 'Steel Girder 340x250x9x14', qty: '18', unit: 'EA', unitPrice: '1800', amount: '32400', remark: '' },
    ],
  },
  {
    id: 'PI26003',
    issueDate: '2026/03/01',
    clientName: 'Pacific Trading Inc.',
    buyerName: 'Mr. Jacob Miller (Import Manager)',
    currency: 'USD',
    country: '미국',
    itemName: 'Lubricant Oil SAE 10W-40',
    amount: '$15,600',
    incoterms: 'FOB',
    manager: '정영업',
    status: '초안',
    deliveryDate: '2026/06/01',
    items: [
      { name: 'Lubricant Oil SAE 10W-40', qty: '320', unit: 'EA', unitPrice: '30', amount: '9600', remark: '' },
      { name: 'Industrial Grease EP-2', qty: '120', unit: 'EA', unitPrice: '50', amount: '6000', remark: '' },
    ],
  },
  {
    id: 'PI26004',
    issueDate: '2025/12/10',
    clientName: 'Viet Steel JSC',
    buyerName: 'Purchasing Team',
    currency: 'USD',
    country: '베트남',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$53,600',
    incoterms: 'FOB',
    manager: '정영업',
    status: '확정',
    deliveryDate: '2026/04/30',
    items: [
      { name: 'H-Beam 482x300x11x15', qty: '40', unit: 'EA', unitPrice: '1340', amount: '53600', remark: '' },
    ],
  },
  {
    id: 'PI26005',
    issueDate: '2026/01/15',
    clientName: 'Siam Industrial Co., Ltd.',
    buyerName: 'Purchasing Team',
    currency: 'USD',
    country: '태국',
    itemName: 'H-Beam 488x300x11x18',
    amount: '$38,850',
    incoterms: 'FOB',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/05/15',
    items: [
      { name: 'H-Beam 488x300x11x18', qty: '21', unit: 'EA', unitPrice: '1850', amount: '38850', remark: '' },
    ],
  },
  {
    id: 'PI26006',
    issueDate: '2026/03/05',
    clientName: 'Meridian Engineering Pte Ltd',
    buyerName: 'Procurement Team',
    currency: 'USD',
    country: '싱가포르',
    itemName: 'Seamless Steel Pipe 168x7',
    amount: '$29,700',
    incoterms: 'FOB',
    manager: '정영업',
    status: '발송',
    deliveryDate: '2026/06/10',
    items: [
      { name: 'Seamless Steel Pipe 168x7', qty: '90', unit: 'EA', unitPrice: '330', amount: '29700', remark: '' },
    ],
  },
  {
    id: 'PI26007',
    issueDate: '2026/01/20',
    clientName: 'Tata Steel Traders Pvt Ltd',
    buyerName: 'Procurement Team',
    currency: 'USD',
    country: '인도',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$76,400',
    incoterms: 'FOB',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/05/30',
    items: [
      { name: 'H-Beam 482x300x11x15', qty: '40', unit: 'EA', unitPrice: '1910', amount: '76400', remark: '' },
    ],
  },
  {
    id: 'PI26008',
    issueDate: '2026/03/10',
    clientName: 'OzSteel Supplies Pty Ltd',
    buyerName: 'Procurement Team',
    currency: 'USD',
    country: '호주',
    itemName: 'Hydraulic Cylinder 100x500',
    amount: '$23,960',
    incoterms: 'FOB',
    manager: '정영업',
    status: '초안',
    deliveryDate: '2026/06/30',
    items: [
      { name: 'Hydraulic Cylinder 100x500', qty: '28', unit: 'EA', unitPrice: '820', amount: '22960', remark: '' },
      { name: 'Gear Pump GP-20', qty: '4', unit: 'EA', unitPrice: '250', amount: '1000', remark: '' },
    ],
  },
]

const rowsData = ref([...initialRows])
const { filters, filteredRows, resetFilters, applyFilters } = useDocumentFilter(rowsData, {
  keywordFields: ['id', 'clientName', 'country', 'itemName', 'amount', 'manager', 'status', 'issueDate', 'deliveryDate'],
  issueDateField: 'issueDate',
  deliveryDateField: 'deliveryDate',
})

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource.value
  return clientRowsSource.value.filter((client) => [client.id, client.name, client.country].some((value) => value.toLowerCase().includes(keyword)))
})

const codeRows = computed(() => {
  const keyword = codeSearchKeyword.value.trim().toLowerCase()
  const rows = rowsData.value.map((row) => ({ id: row.id, issueDate: row.issueDate, clientName: row.clientName }))
  if (!keyword) return rows
  return rows.filter((row) => [row.id, row.issueDate, row.clientName].some((value) => String(value).toLowerCase().includes(keyword)))
})

const productRows = computed(() => {
  const keyword = productSearchKeyword.value.trim().toLowerCase()
  const rows = [...new Map(rowsData.value.map((row) => [row.itemName, { name: row.itemName, country: row.country, manager: row.manager }])).values()]
  if (!keyword) return rows
  return rows.filter((row) => [row.name, row.country, row.manager].some((value) => String(value).toLowerCase().includes(keyword)))
})

const currencySymbolMap = {
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

async function loadClientRows() {
  try {
    const [clientsData, countriesData, buyersData, currenciesData] = await Promise.all([
      fetchClients(),
      fetchCountries(),
      fetchBuyers(),
      fetchCurrencies(),
    ])

    const countryMap = new Map(
      countriesData.map((country) => [String(country.id), country.nameKr ?? country.name ?? '-']),
    )
    const currencyMap = new Map(
      currenciesData.map((currency) => [String(currency.id), currency.code ?? 'USD']),
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
      currency: currencyMap.get(String(client.currencyId)) ?? 'USD',
      buyers: buyersByClientId.get(String(client.id)) ?? [],
    }))
  } catch {
    clientRowsSource.value = [...fallbackClientRowsSource]
  }
}

onMounted(loadClientRows)

function openClientSearch(context = 'filter') {
  clientSearchContext.value = context
  clientSearchOpen.value = true
}

function openCodeSearch() {
  codeSearchOpen.value = true
}

function openProductSearch() {
  productSearchOpen.value = true
}

function searchRows() {
  applyFilters()
}

function openCreateForm() {
  formMode.value = 'create'
  selectedRow.value = null
  selectedClient.value = null
  formOpen.value = true
}

function openEditForm(row) {
  const matchedClient = clientRowsSource.value.find((client) => client.name === row.clientName) ?? null
  selectedClient.value = matchedClient
  formMode.value = 'edit'
  selectedRow.value = {
    id: row.id,
    clientName: row.clientName,
    buyerName: row.buyerName ?? matchedClient?.buyers?.[0] ?? '',
    currency: row.currency ?? matchedClient?.currency ?? (row.amount.startsWith('€') ? 'EUR' : 'USD'),
    country: row.country,
    incoterms: row.incoterms ?? 'FOB',
    issueDate: row.issueDate,
    deliveryDate: row.deliveryDate,
    items: (row.items ?? []).map((item) => ({
      ...item,
    })),
  }
  formOpen.value = true
}

function parseAmount(value) {
  const normalized = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

function formatAmount(currency, value) {
  const symbol = currencySymbolMap[currency] ?? `${currency} `
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatSlashDate(value) {
  return value ? value.replaceAll('-', '/') : '-'
}

function handleSave(formValue) {
  const currency = formValue.currency || 'USD'
  const totalAmount = (formValue.items ?? []).reduce((sum, item) => {
    const qty = Number.parseFloat(String(item.qty ?? '0'))
    const unitPrice = Number.parseFloat(String(item.unitPrice ?? '0'))
    const amount = Number.parseFloat(String(item.amount ?? '0'))
    const calculatedAmount = Number.isFinite(amount) ? amount : (Number.isFinite(qty) && Number.isFinite(unitPrice) ? qty * unitPrice : 0)
    return sum + calculatedAmount
  }, 0)
  const matchedClient = clientRowsSource.value.find((client) => client.name === formValue.clientName)
  const nextRow = {
    clientName: formValue.clientName || '거래처 미선택',
    buyerName: formValue.buyerName || '',
    currency,
    country: formValue.country || matchedClient?.country || selectedClient.value?.country || '-',
    itemName: formValue.items?.[0]?.name || '품목 미입력',
    amount: formatAmount(currency, totalAmount),
    issueDate: formatSlashDate(formValue.issueDate),
    deliveryDate: formatSlashDate(formValue.deliveryDate),
    incoterms: formValue.incoterms || 'FOB',
    items: (formValue.items ?? []).map((item) => ({
      name: item.name ?? '',
      qty: String(item.qty ?? ''),
      unit: item.unit ?? '',
      unitPrice: String(item.unitPrice ?? ''),
      amount: String(item.amount ?? '0'),
      remark: item.remark ?? '',
    })),
  }

  if (formMode.value === 'create') {
    rowsData.value = [
      {
        id: `PI26${String(rowsData.value.length + 1).padStart(3, '0')}`,
        ...nextRow,
        manager: '김영업',
        status: '초안',
      },
      ...rowsData.value,
    ]
    success('PI 작성 폼이 연결되었습니다.')
    return
  }

  rowsData.value = rowsData.value.map((row) => (
    row.id === selectedRow.value?.id
      ? {
        ...row,
        ...nextRow,
      }
      : row
  ))
  success(`${selectedRow.value?.id} 수정 폼이 연결되었습니다.`)
}

function openDeleteModal(row) {
  selectedRow.value = row
  deleteOpen.value = true
}

function confirmDelete() {
  rowsData.value = rowsData.value.filter((row) => row.id !== selectedRow.value?.id)
  success(`${selectedRow.value?.id}가 삭제되었습니다.`)
  deleteOpen.value = false
  selectedRow.value = null
}

function goToDetail(id) {
  router.push({ name: 'pi-detail', params: { id } })
}

function handleClientSelect(client) {
  if (clientSearchContext.value === 'form') {
    selectedClient.value = client
  } else {
    filters.value.clientName = client.name
  }
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function handleCodeSelect(code) {
  filters.value.code = code.id
  codeSearchOpen.value = false
  codeSearchKeyword.value = ''
}

function handleProductSelect(product) {
  filters.value.productName = product.name
  productSearchOpen.value = false
  productSearchKeyword.value = ''
}
</script>

<template>
  <div class="fade-in space-y-5">
    <PageHeader title="PI 관리" icon-class="fas fa-file-invoice">
      <template #actions>
        <BaseButton @click="openCreateForm">
          <template #leading>
            <i class="fas fa-plus text-xs" aria-hidden="true"></i>
          </template>
          PI 작성
        </BaseButton>
      </template>
    </PageHeader>

    <FilterToolbarCard
      v-model="filters.keyword"
      :advanced-open="isAdvancedOpen"
      @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
    />

    <CollapsibleFilterCard :open="isAdvancedOpen">
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <FormField label="발행일" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <DateField v-model="filters.registeredFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filters.registeredTo" />
          </div>
        </FormField>

        <FormField label="담당자">
          <SearchableCombobox
            v-model="filters.manager"
            :options="managerOptions"
            placeholder="담당자 검색..."
          />
        </FormField>

        <FormField label="거래처명">
          <SearchTriggerField
            v-model="filters.clientName"
            placeholder="거래처 검색..."
            title="거래처 검색"
            @trigger="openClientSearch"
          />
        </FormField>

        <FormField label="PI번호">
          <SearchTriggerField
            v-model="filters.code"
            placeholder="PI번호"
            title="PI번호 검색"
            @trigger="openCodeSearch"
          />
        </FormField>

        <FormField label="품목명">
          <SearchTriggerField
            v-model="filters.productName"
            placeholder="품목명 검색..."
            title="품목명 검색"
            @trigger="openProductSearch"
          />
        </FormField>

        <FormField label="국가">
          <SearchableCombobox
            v-model="filters.country"
            :options="countryOptions"
            placeholder="국가 검색..."
          />
        </FormField>

        <FormField label="상태">
          <SearchableCombobox
            v-model="filters.status"
            :options="statusOptions"
            placeholder="상태 선택..."
          />
        </FormField>

        <FormField label="납기일" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <div>
              <DateField v-model="filters.deliveryFrom" />
            </div>
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <div>
              <DateField v-model="filters.deliveryTo" />
            </div>
          </div>
        </FormField>
      </div>

      <div class="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">
          <template #leading>
            <i class="fas fa-undo text-xs" aria-hidden="true"></i>
          </template>
          초기화
        </BaseButton>

        <BaseButton size="sm" @click="searchRows">
          <template #leading>
            <i class="fas fa-search text-xs" aria-hidden="true"></i>
          </template>
          검색
        </BaseButton>
      </div>
    </CollapsibleFilterCard>

    <BaseTable
      :columns="columns"
      :rows="filteredRows"
      clickable-rows
      empty-text="데이터가 없습니다."
      :footer-text="`총 ${filteredRows.length}건`"
      @row-click="goToDetail($event.id)"
    >
      <template #cell-id="{ value }">
        <button type="button" class="font-mono text-xs font-semibold text-brand-600 hover:underline" @click.stop="goToDetail(value)">
          {{ value }}
        </button>
      </template>

      <template #cell-status="{ value }">
        <StatusBadge :value="value" />
      </template>

      <template #cell-actions="{ row }">
        <TableActions @edit="openEditForm(row)" @delete="openDeleteModal(row)" />
      </template>
    </BaseTable>

    <PIFormModal
      :open="formOpen"
      :mode="formMode"
      :document="selectedRow"
      :selected-client="selectedClient"
      @open-client-search="openClientSearch('form')"
      @close="formOpen = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="deleteOpen"
      title="PI 삭제"
      message="아래 PI를 삭제하시겠습니까?"
      :detail="selectedRow?.id"
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

    <SearchModal
      :open="codeSearchOpen"
      title="PI번호 검색"
      :columns="[
        { key: 'id', label: 'PI번호' },
        { key: 'issueDate', label: '발행일' },
        { key: 'clientName', label: '거래처명' },
      ]"
      :rows="codeRows"
      :search-keyword="codeSearchKeyword"
      @update:search-keyword="codeSearchKeyword = $event"
      @close="codeSearchOpen = false"
      @select="handleCodeSelect"
    />

    <SearchModal
      :open="productSearchOpen"
      title="품목명 검색"
      :columns="[
        { key: 'name', label: '품목명' },
        { key: 'country', label: '국가' },
        { key: 'manager', label: '영업담당자' },
      ]"
      :rows="productRows"
      :search-keyword="productSearchKeyword"
      @update:search-keyword="productSearchKeyword = $event"
      @close="productSearchOpen = false"
      @select="handleProductSelect"
    />
  </div>
</template>
