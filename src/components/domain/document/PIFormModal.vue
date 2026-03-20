<script setup>
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import {
  fetchBuyersByClient,
  fetchClients,
  fetchCountries,
  fetchCurrencies,
  fetchItems,
  fetchUsers,
} from '@/api/master'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  document: { type: Object, default: null },
  selectedClient: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save', 'open-client-search'])
const { error, success } = useToast()

const defaultCurrencyOptions = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'CNY', 'MYR', 'THB', 'VND', 'IDR', 'INR', 'SAR', 'BRL', 'SEK', 'CHF']
const incotermsOptions = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']
const defaultBuyerOptions = [
  'Mr. Ahmad Razak (Purchasing Manager)',
  'Ms. Siti Nurhaliza (Director)',
]
const defaultApproverOptions = [
  '최관리 (경영지원 · 관리자)',
  '박리드 (영업지원 · 팀장)',
]
const defaultProductOptions = [
  'H-Beam 482x300x11x15',
  'H-Beam 488x300x11x18',
  'Steel Girder 340x250x9x14',
  'Lubricant Oil SAE 10W-40',
  'Industrial Grease EP-2',
  'Hydraulic Oil ISO VG 46',
  'Seamless Steel Pipe 168x7',
  'Welded Steel Pipe 323x6.4',
  'Hydraulic Cylinder 100x500',
  'Gear Pump GP-20',
]
const defaultProductCatalog = defaultProductOptions.map((name, index) => ({
  id: `default-${index + 1}`,
  code: `DEF${String(index + 1).padStart(3, '0')}`,
  name,
  spec: '',
  unit: 'EA',
  unitPrice: 0,
}))
const exchangeRateRangeMap = {
  USD: { unitLabel: '1 USD', quoteAmount: 1, min: 1430, max: 1490 },
  EUR: { unitLabel: '1 EUR', quoteAmount: 1, min: 1560, max: 1640 },
  JPY: { unitLabel: '100 JPY', quoteAmount: 100, min: 900, max: 950 },
  GBP: { unitLabel: '1 GBP', quoteAmount: 1, min: 1830, max: 1910 },
  AUD: { unitLabel: '1 AUD', quoteAmount: 1, min: 930, max: 980 },
  CAD: { unitLabel: '1 CAD', quoteAmount: 1, min: 1030, max: 1080 },
  SGD: { unitLabel: '1 SGD', quoteAmount: 1, min: 1070, max: 1130 },
  AED: { unitLabel: '1 AED', quoteAmount: 1, min: 390, max: 410 },
  CNY: { unitLabel: '1 CNY', quoteAmount: 1, min: 197, max: 208 },
  MYR: { unitLabel: '1 MYR', quoteAmount: 1, min: 300, max: 340 },
  THB: { unitLabel: '1 THB', quoteAmount: 1, min: 41, max: 45 },
  VND: { unitLabel: '1000 VND', quoteAmount: 1000, min: 56, max: 62 },
  IDR: { unitLabel: '100 IDR', quoteAmount: 100, min: 8, max: 10 },
  INR: { unitLabel: '1 INR', quoteAmount: 1, min: 16, max: 18 },
  SAR: { unitLabel: '1 SAR', quoteAmount: 1, min: 381, max: 398 },
  BRL: { unitLabel: '1 BRL', quoteAmount: 1, min: 255, max: 290 },
  SEK: { unitLabel: '1 SEK', quoteAmount: 1, min: 136, max: 145 },
  CHF: { unitLabel: '1 CHF', quoteAmount: 1, min: 1620, max: 1690 },
}
const currencySymbolMap = {
  KRW: '₩',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  AED: 'د.إ',
  CNY: '¥',
  MYR: 'RM',
  THB: '฿',
  VND: '₫',
  IDR: 'Rp',
  INR: '₹',
  SAR: '﷼',
  BRL: 'R$',
  SEK: 'kr',
  CHF: 'CHF',
}

function getTodayDateInput() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDeterministicRate(seedText, min, max) {
  let hash = 0

  for (let index = 0; index < seedText.length; index += 1) {
    hash = (hash * 31 + seedText.charCodeAt(index)) >>> 0
  }

  return min + (hash % (max - min + 1))
}

function createExchangeRateHint(currency, issueDate) {
  const range = exchangeRateRangeMap[currency]

  if (!range) {
    return `${currency} 환율은 실시간 변동 통화입니다.`
  }

  const seed = `${currency}:${issueDate || getTodayDateInput()}`
  const rate = getDeterministicRate(seed, range.min, range.max)
  return `참고 환율 ${range.unitLabel} = ${rate.toLocaleString('ko-KR')} KRW`
}

function resolveExchangeRateValue(currency, issueDate) {
  const range = exchangeRateRangeMap[currency]

  if (!range) {
    return null
  }

  const seed = `${currency}:${issueDate || getTodayDateInput()}`
  return getDeterministicRate(seed, range.min, range.max)
}

function getDefaultApprover() {
  return approverOptions.value[0] ?? defaultApproverOptions[0]
}

function createInitialForm() {
  return {
    clientName: '',
    buyerName: '',
    currency: 'USD',
    issueDate: getTodayDateInput(),
    deliveryDate: '',
    incoterms: 'FOB',
    reason: '',
    approver: defaultApproverOptions[0],
    items: [],
  }
}

function createEmptyItemRow(id = Date.now()) {
  return {
    id,
    name: '',
    qty: '1',
    unit: '',
    unitPrice: '0',
    amount: '0',
    remark: '',
    baseUnitPrice: null,
  }
}

const form = ref(createInitialForm())
const validationErrors = ref({})
const clientCatalog = ref([])
const buyerRows = ref([...defaultBuyerOptions])
const currencyOptions = ref([...defaultCurrencyOptions])
const approverOptions = ref([...defaultApproverOptions])
const productCatalog = ref([...defaultProductCatalog])
const exchangeRateHint = ref(createExchangeRateHint('USD', getTodayDateInput()))
const currentCurrency = computed(() => form.value.currency || 'USD')

const currentCurrencySymbol = computed(() => currencySymbolMap[currentCurrency.value] ?? currentCurrency.value)

const itemTableColumns = computed(() => [
  { key: 'name', label: '품목명', width: '32%' },
  { key: 'qty', label: '수량', align: 'center', width: '110px' },
  { key: 'unit', label: '단위', align: 'center', width: '90px' },
  { key: 'unitPrice', label: `단가 (${currentCurrency.value})`, align: 'right', width: '160px' },
  { key: 'amount', label: `금액 (${currentCurrency.value})`, align: 'right', width: '170px' },
  { key: 'remark', label: '비고', width: '20%' },
])

const buyerOptions = computed(() => {
  const buyers = new Set(buyerRows.value)

  for (const buyer of props.selectedClient?.buyers ?? []) {
    buyers.add(buyer)
  }

  if (form.value.buyerName) {
    buyers.add(form.value.buyerName)
  }

  return [...buyers]
})

const productOptions = computed(() => productCatalog.value.map((item) => ({
  label: item.name,
  value: item.name,
  sublabel: [item.code, item.spec].filter(Boolean).join(' · '),
})))

const reasonFieldLabel = computed(() => (
  props.mode === 'create' ? '특기사항' : '수정 사유'
))

const reasonFieldPlaceholder = computed(() => (
  `${reasonFieldLabel.value}를 입력하세요`
))

const isReasonRequired = computed(() => props.mode === 'edit')

function mapBuyerLabel(buyer) {
  if (!buyer?.name) return ''
  return buyer.position ? `${buyer.name} (${buyer.position})` : buyer.name
}

async function loadReferenceData() {
  try {
    const [clientsData, countriesData, currenciesData, itemsData, usersData] = await Promise.all([
      fetchClients(),
      fetchCountries(),
      fetchCurrencies(),
      fetchItems(),
      fetchUsers(),
    ])

    const countryMap = new Map(
      countriesData.map((country) => [String(country.id), country.nameKr ?? country.name ?? '-']),
    )

    clientCatalog.value = clientsData.map((client) => ({
      id: String(client.id),
      name: client.name,
      country: countryMap.get(String(client.countryId)) ?? '-',
    }))

    currencyOptions.value = currenciesData.map((currency) => currency.code).filter(Boolean)
    productCatalog.value = itemsData
      .filter((item) => item.status !== '비활성')
      .map((item) => ({
        id: item.id,
        code: item.code ?? '',
        name: item.name ?? '',
        spec: item.spec ?? '',
        unit: item.unit ?? '',
        unitPrice: Number(item.unitPrice ?? 0),
      }))
      .filter((item) => item.name)

    const activeUsers = usersData
      .filter((user) => user.status === '재직')
      .map((user) => user.name)
      .filter(Boolean)

    if (activeUsers.length) {
      approverOptions.value = activeUsers
    }

    if (!approverOptions.value.includes(form.value.approver)) {
      form.value.approver = getDefaultApprover()
    }
  } catch {
    // json-server가 내려가 있어도 폼이 열리도록 기본값 유지
  }
}

function resolveSelectedClientId() {
  if (props.selectedClient?.id) {
    return String(props.selectedClient.id)
  }

  const matchedClient = clientCatalog.value.find((client) => client.name === form.value.clientName)
  return matchedClient?.id ?? null
}

async function loadBuyerOptions() {
  const clientId = resolveSelectedClientId()

  if (!clientId) {
    buyerRows.value = props.selectedClient?.buyers?.length ? props.selectedClient.buyers : [...defaultBuyerOptions]
    return
  }

  try {
    const buyersData = await fetchBuyersByClient(clientId)
    const nextBuyers = buyersData.map(mapBuyerLabel).filter(Boolean)
    buyerRows.value = nextBuyers.length ? nextBuyers : [...defaultBuyerOptions]
  } catch {
    buyerRows.value = props.selectedClient?.buyers?.length ? props.selectedClient.buyers : [...defaultBuyerOptions]
  }

  if (!form.value.buyerName && buyerRows.value.length) {
    form.value.buyerName = buyerRows.value[0]
  }
}

function itemErrorKey(itemId, field) {
  return `item:${itemId}:${field}`
}

function getFieldError(field) {
  return validationErrors.value[field] ?? ''
}

function getItemError(itemId, field) {
  return validationErrors.value[itemErrorKey(itemId, field)] ?? ''
}

function clearError(field) {
  if (!validationErrors.value[field]) return

  const nextErrors = { ...validationErrors.value }
  delete nextErrors[field]
  validationErrors.value = nextErrors
}

function clearItemError(itemId, field) {
  clearError(itemErrorKey(itemId, field))
}

function clearItemErrors(itemId) {
  const nextErrors = { ...validationErrors.value }

  for (const key of Object.keys(nextErrors)) {
    if (key.startsWith(`item:${itemId}:`)) {
      delete nextErrors[key]
    }
  }

  validationErrors.value = nextErrors
}

function findProductByName(name) {
  return productCatalog.value.find((item) => item.name === name) ?? null
}

function formatUnitPriceValue(value) {
  if (!Number.isFinite(value)) return '0'
  return String(Math.max(0, Math.round(value)))
}

function convertKrwPriceToCurrency(basePrice, currency, issueDate) {
  const numericBasePrice = Number(basePrice)

  if (!Number.isFinite(numericBasePrice)) {
    return 0
  }

  if (!currency || currency === 'KRW') {
    return numericBasePrice
  }

  const range = exchangeRateRangeMap[currency]
  const exchangeRateValue = resolveExchangeRateValue(currency, issueDate)

  if (!range || !exchangeRateValue) {
    return numericBasePrice
  }

  return (numericBasePrice / exchangeRateValue) * range.quoteAmount
}

function sanitizeNonNegativeInteger(value, fallback = '0') {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return fallback
  }

  return String(Math.max(0, Math.round(numericValue)))
}

function handleQuantityChange(item) {
  item.qty = sanitizeNonNegativeInteger(item.qty, '0')
  clearItemError(item.id, 'qty')
  updateItemAmount(item)
}

function handleUnitPriceChange(item) {
  item.unitPrice = sanitizeNonNegativeInteger(item.unitPrice, '0')
  clearItemError(item.id, 'unitPrice')
  updateItemAmount(item)
}

function applyCatalogItemToRow(itemRow, productName) {
  const product = findProductByName(productName)

  if (!product) {
    itemRow.baseUnitPrice = null
    updateItemAmount(itemRow)
    return
  }

  itemRow.name = product.name
  itemRow.unit = product.unit || itemRow.unit
  itemRow.baseUnitPrice = product.unitPrice
  itemRow.unitPrice = formatUnitPriceValue(
    convertKrwPriceToCurrency(product.unitPrice, form.value.currency, form.value.issueDate),
  )
  updateItemAmount(itemRow)
}

function refreshAutoPricedItems() {
  for (const item of form.value.items) {
    if (!Number.isFinite(Number(item.baseUnitPrice))) continue

    item.unitPrice = formatUnitPriceValue(
      convertKrwPriceToCurrency(item.baseUnitPrice, form.value.currency, form.value.issueDate),
    )
    updateItemAmount(item)
  }
}

function validateForm() {
  const errors = {}

  if (!form.value.clientName.trim()) {
    errors.clientName = '거래처를 선택하세요.'
  }

  if (!form.value.deliveryDate) {
    errors.deliveryDate = '납기일을 입력하세요.'
  }

  if (!form.value.issueDate) {
    errors.issueDate = '발행일을 입력하세요.'
  }

  if (!form.value.items.length) {
    errors.items = '품목을 1개 이상 추가하세요.'
  }

  for (const item of form.value.items) {
    if (!String(item.name ?? '').trim()) {
      errors[itemErrorKey(item.id, 'name')] = '품목을 선택하세요.'
    }

    if (!String(item.qty ?? '').trim() || Number(item.qty) <= 0) {
      errors[itemErrorKey(item.id, 'qty')] = '수량은 1 이상이어야 합니다.'
    }

    if (String(item.unitPrice ?? '').trim() === '' || Number(item.unitPrice) < 0) {
      errors[itemErrorKey(item.id, 'unitPrice')] = '단가를 입력하세요.'
    }
  }

  if (isReasonRequired.value && !form.value.reason.trim()) {
    errors.reason = reasonFieldPlaceholder.value
  }

  if (!form.value.approver) {
    errors.approver = '결재자를 선택하세요.'
  }

  validationErrors.value = errors

  if (Object.keys(errors).length > 0) {
    error(Object.values(errors)[0], '입력 확인')
    return false
  }

  return true
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return '0'
  return Math.max(0, Math.round(value)).toLocaleString('en-US')
}

function updateItemAmount(item) {
  const quantity = Number(item.qty)
  const unitPrice = Number(item.unitPrice)

  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
    item.amount = '0'
    return
  }

  item.amount = formatAmount(quantity * unitPrice)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return

    validationErrors.value = {}

    if (props.mode === 'edit' && props.document) {
      form.value = {
        clientName: props.document.clientName ?? '',
        buyerName: props.document.buyerName ?? 'Mr. Ahmad Razak (Purchasing Manager)',
        currency: props.document.currency ?? 'USD',
        issueDate: props.document.issueDate?.replaceAll('/', '-') ?? getTodayDateInput(),
        deliveryDate: props.document.deliveryDate?.replaceAll('/', '-') ?? '',
        incoterms: props.document.incoterms ?? 'FOB',
        reason: '',
        approver: getDefaultApprover(),
        items: props.document.items?.map((item, index) => ({
          id: index + 1,
          name: item.name ?? '',
          qty: String(item.qty ?? ''),
          unit: item.unit ?? '',
          unitPrice: String(item.unitPrice ?? ''),
          amount: item.amount ?? '0',
          remark: item.remark ?? item.remarks ?? '',
          baseUnitPrice: null,
        })) ?? [],
      }
      form.value.items.forEach(updateItemAmount)
      await loadReferenceData()
      await loadBuyerOptions()
      return
    }

    form.value = createInitialForm()
    await loadReferenceData()
    await loadBuyerOptions()
  },
  { immediate: true },
)

function openClientSearch() {
  emit('open-client-search')
}

function addItem() {
  const itemRow = createEmptyItemRow()
  const defaultProductName = productCatalog.value[0]?.name ?? defaultProductCatalog[0]?.name ?? ''

  if (defaultProductName) {
    applyCatalogItemToRow(itemRow, defaultProductName)
  }

  form.value.items.push(itemRow)
  clearError('items')
}

function removeItem(index) {
  const [removedItem] = form.value.items.splice(index, 1)
  if (removedItem) {
    clearItemErrors(removedItem.id)
  }
}

function handleSave() {
  if (!validateForm()) return

  success(props.mode === 'create' ? 'PI 작성 폼 구조가 준비되었습니다.' : 'PI 수정 폼 구조가 준비되었습니다.')
  emit('save', {
    ...form.value,
    items: form.value.items.map(({ baseUnitPrice, ...item }) => ({ ...item })),
  })
  emit('close')
}

watch(
  () => props.selectedClient,
  async (client) => {
    if (!client) return
    form.value.clientName = client.name
    form.value.buyerName = client.buyers?.[0] ?? ''
    clearError('clientName')
    await loadBuyerOptions()
  },
)

watch(
  () => [form.value.currency, form.value.issueDate],
  ([currency, issueDate]) => {
    exchangeRateHint.value = createExchangeRateHint(currency || 'USD', issueDate)
    refreshAutoPricedItems()
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? 'PI 등록' : `PI 수정 – ${document?.id ?? ''}`"
    width="max-w-5xl"
    @close="emit('close')"
  >
    <div class="space-y-4 text-sm">
      <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-brand-700">
        <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
        수정 내용을 입력한 후 저장하면 상급자에게 결재 요청이 전송됩니다.
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-gray-600">거래처 *</label>
          <div class="relative">
            <BaseTextField
              v-model="form.clientName"
              placeholder="거래처 검색..."
              readonly
              class="cursor-pointer pr-9"
              style="background:var(--bg-input)"
              @click.stop.prevent="openClientSearch"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-500"
              @click.stop.prevent="openClientSearch"
            >
              <i class="fas fa-search text-xs" aria-hidden="true"></i>
            </button>
          </div>
          <p v-if="getFieldError('clientName')" class="mt-1 text-xs text-red-500">{{ getFieldError('clientName') }}</p>
        </div>

        <div>
          <label class="mb-1 block text-gray-600">바이어</label>
          <BaseSelect v-model="form.buyerName" :options="buyerOptions" placeholder="바이어 선택" />
        </div>

        <div>
          <label class="mb-1 block text-gray-600">통화</label>
          <BaseSelect v-model="form.currency" :options="currencyOptions" placeholder="통화 선택" />
          <p class="mt-1 text-xs text-slate-500">{{ exchangeRateHint }}</p>
        </div>

        <div>
          <label class="mb-1 block text-gray-600">발행일 *</label>
          <div class="relative">
            <BaseTextField
              v-model="form.issueDate"
              type="date"
              class="pr-8"
              @update:modelValue="clearError('issueDate')"
            />
            <span class="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i>
            </span>
          </div>
          <p v-if="getFieldError('issueDate')" class="mt-1 text-xs text-red-500">{{ getFieldError('issueDate') }}</p>
        </div>

        <div>
          <label class="mb-1 block text-gray-600">납기일 *</label>
          <div class="relative">
            <BaseTextField
              v-model="form.deliveryDate"
              type="date"
              class="pr-8"
              @update:modelValue="clearError('deliveryDate')"
            />
            <span class="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i>
            </span>
          </div>
          <p v-if="getFieldError('deliveryDate')" class="mt-1 text-xs text-red-500">{{ getFieldError('deliveryDate') }}</p>
        </div>

        <div>
          <label class="mb-1 block text-gray-600">
            결재자 <span class="text-red-500">*</span>
          </label>
          <BaseSelect
            v-model="form.approver"
            :options="approverOptions"
            placeholder="결재자 선택"
            @update:modelValue="clearError('approver')"
          />
          <p v-if="getFieldError('approver')" class="mt-1 text-xs text-red-500">{{ getFieldError('approver') }}</p>
        </div>
      </div>

      <div>
        <label class="mb-1 block text-gray-600">인코텀즈</label>
        <input v-model="form.incoterms" type="hidden">
        <div class="rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-3 select-none">
          <div class="mb-2 flex items-center gap-1.5">
            <span class="text-[10px] font-bold text-emerald-500"><i class="fas fa-building mr-0.5"></i>매도인</span>
            <span class="h-px flex-1 bg-gradient-to-r from-emerald-500 to-blue-500"></span>
            <span class="text-[10px] font-bold text-blue-500">매수인 <i class="fas fa-user ml-0.5"></i></span>
          </div>

          <div class="mb-1.5 flex h-[18px] gap-px overflow-hidden rounded-md">
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="포장"><i class="fas fa-box text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="적하"><i class="fas fa-dolly text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="내륙운송"><i class="fas fa-truck text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="수출통관"><i class="fas fa-stamp text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="선적터미널"><i class="fas fa-warehouse text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="본선적재"><i class="fas fa-ship text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="해상운송"><i class="fas fa-water text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="도착터미널"><i class="fas fa-anchor text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="수입통관"><i class="fas fa-passport text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="내륙운송"><i class="fas fa-truck-moving text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="양하"><i class="fas fa-boxes-stacked text-[7px] text-white/90"></i></div>
          </div>

          <div class="mb-2 flex gap-px">
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">포장</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">적하</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">내륙운송</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">수출통관</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">선적터미널</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">본선적재</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">해상운송</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">도착터미널</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">수입통관</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">내륙운송</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">양하</div>
          </div>

          <div class="mb-2 px-1">
            <div class="relative cursor-pointer">
              <div class="absolute left-[14px] right-[14px] top-3 h-[5px] rounded bg-slate-200"></div>
              <div class="absolute left-[14px] top-3 h-[5px] w-[30%] rounded bg-emerald-500 transition-all"></div>
              <div class="relative z-[1] flex justify-between">
                <div
                  v-for="option in incotermsOptions"
                  :key="option"
                  class="flex flex-1 cursor-pointer flex-col items-center"
                  @click="form.incoterms = option"
                >
                  <div
                    :class="form.incoterms === option ? 'mt-[2px] flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 text-[7px] font-extrabold text-white shadow-[0_2px_6px_#10B98144]' : 'mt-[9px] flex h-[10px] w-[10px] items-center justify-center rounded-full border-2 border-blue-500 bg-white'"
                  >
                    <span v-if="form.incoterms === option">{{ option[0] }}</span>
                  </div>
                  <div :class="form.incoterms === option ? 'mt-0.5 whitespace-nowrap text-[9px] font-extrabold text-emerald-500' : 'mt-0.5 whitespace-nowrap text-[7px] font-medium text-slate-400'">
                    {{ option }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2">
            <div class="flex h-12 min-w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500">
              <span class="text-sm font-black text-white">{{ form.incoterms }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-slate-800">
                본선인도
                <span class="ml-1 text-[10px] font-normal text-slate-500">Free On Board</span>
              </div>
              <div class="mt-0.5 line-clamp-2 text-[9px] leading-[1.3] text-slate-500">
                매도인이 본선 갑판에 물품을 적재하여 인도. 해상/내수로 전용.
              </div>
              <div class="mt-1 flex items-center gap-1.5">
                <span class="text-[8px] font-bold text-emerald-500">매도인 6구간</span>
                <span class="text-[8px] font-bold text-blue-500">매수인 5구간</span>
                <span class="text-[8px] text-slate-400"><i class="fas fa-ship mr-0.5"></i>해상</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="font-medium text-gray-700">품목 목록</label>
          <button type="button" class="text-xs text-brand-500 hover:underline" @click="addItem">
            <i class="fas fa-plus mr-1"></i>품목 추가
          </button>
        </div>
        <BaseTable
          :columns="itemTableColumns"
          :rows="form.items"
          row-key="id"
          empty-text="품목을 추가하세요"
        >
          <template #cell-name="{ row }">
            <div class="flex items-start gap-2 py-1">
              <button
                type="button"
                class="mt-2 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                aria-label="품목 삭제"
                @click="removeItem(form.items.findIndex((item) => item.id === row.id))"
              >
                <i class="fas fa-xmark" aria-hidden="true"></i>
              </button>
              <div class="min-w-0 flex-1">
                <SearchableCombobox
                  v-model="row.name"
                  :options="productOptions"
                  placeholder="품목명을 검색하세요"
                  @update:modelValue="clearItemError(row.id, 'name'); applyCatalogItemToRow(row, row.name)"
                />
                <p v-if="getItemError(row.id, 'name')" class="mt-1 text-[11px] text-red-500">{{ getItemError(row.id, 'name') }}</p>
              </div>
            </div>
          </template>

          <template #cell-qty="{ row }">
            <div class="mx-auto w-20 py-1">
              <BaseTextField
                v-model="row.qty"
                type="number"
                class="text-center"
                @update:modelValue="handleQuantityChange(row)"
              />
              <p v-if="getItemError(row.id, 'qty')" class="mt-1 text-[11px] text-red-500">{{ getItemError(row.id, 'qty') }}</p>
            </div>
          </template>

          <template #cell-unit="{ row }">
            <div class="mx-auto w-[72px] py-1">
              <BaseTextField
                v-model="row.unit"
                placeholder="EA"
                class="text-center"
              />
            </div>
          </template>

          <template #cell-unitPrice="{ row }">
            <div class="py-1">
              <div class="flex items-center justify-end gap-2">
                <span class="shrink-0 text-sm font-semibold text-slate-500">
                  {{ currentCurrencySymbol }}
                </span>
                <div class="w-28">
                  <BaseTextField
                    v-model="row.unitPrice"
                    type="number"
                    class="text-right"
                    @update:modelValue="handleUnitPriceChange(row)"
                  />
                </div>
              </div>
              <p v-if="getItemError(row.id, 'unitPrice')" class="mt-1 text-[11px] text-red-500">{{ getItemError(row.id, 'unitPrice') }}</p>
            </div>
          </template>

          <template #cell-amount="{ row }">
            <div class="rounded-md bg-slate-50 px-3 py-2 text-right font-medium text-slate-700">
              {{ currentCurrencySymbol }} {{ row.amount }}
            </div>
          </template>

          <template #cell-remark="{ row }">
            <div class="py-1">
              <BaseTextField
                v-model="row.remark"
                placeholder="비고 입력"
              />
            </div>
          </template>
        </BaseTable>
        <p v-if="getFieldError('items')" class="mt-2 text-xs text-red-500">{{ getFieldError('items') }}</p>
      </div>

      <div class="border-t border-slate-200 pt-4">
        <label class="mb-1.5 block text-sm font-medium text-slate-700">
          {{ reasonFieldLabel }}
          <span v-if="isReasonRequired" class="text-red-500">*</span>
        </label>
        <textarea
          v-model="form.reason"
          class="h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink transition placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          :placeholder="reasonFieldPlaceholder"
          @input="clearError('reason')"
        ></textarea>
        <p v-if="getFieldError('reason')" class="mt-2 text-xs text-red-500">{{ getFieldError('reason') }}</p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
