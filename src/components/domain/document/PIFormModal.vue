<script setup>
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import {
  fetchBuyersByClient,
  fetchClients,
  fetchCountries,
  fetchCurrencies,
  fetchIncoterms,
  fetchItems,
  fetchUsers,
} from '@/api/master'
import { useToast } from '@/composables/useToast'
import {
  fallbackIncotermsCatalog,
  formatIncotermsLabel,
  getIncotermMeta,
  resolveIncotermState,
  shippingStageDefinitions,
} from '@/utils/incoterms'
import {
  createExchangeRateHint,
  exchangeRateRangeMap,
  resolveExchangeRateValue,
} from '@/utils/exchangeRate'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  document: { type: Object, default: null },
  selectedClient: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save', 'open-client-search'])
const { error, success } = useToast()

const defaultCurrencyOptions = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'CNY', 'MYR', 'THB', 'VND', 'IDR', 'INR', 'SAR', 'BRL', 'SEK', 'CHF']
const defaultBuyerOptions = [
  'Mr. Ahmad Razak (Purchasing Manager)',
  'Ms. Siti Nurhaliza (Director)',
]
const defaultApproverOptions = [
  '최관리 (경영지원 · 관리자)',
  '박리드 (영업지원 · 팀장)',
]
const fallbackProductCatalog = [
  { id: '1', code: 'ITM001', name: 'Wireless Presenter', spec: '2.4GHz / 100m / USB Receiver / Laser Pointer', unit: 'EA', unitPrice: 55000 },
  { id: '2', code: 'ITM002', name: 'Tablet PC 10"', spec: '10.1" FHD / Octa-core / 4GB / 64GB / WiFi', unit: 'EA', unitPrice: 650000 },
  { id: '3', code: 'ITM003', name: 'Smart Projector FHD', spec: 'FHD 1920×1080 / 3500lm / HDMI / WiFi / BT', unit: 'EA', unitPrice: 780000 },
  { id: '4', code: 'ITM004', name: 'All-in-One PC 24"', spec: '24" FHD / Intel i5 / 16GB / 512GB SSD', unit: 'EA', unitPrice: 1650000 },
  { id: '5', code: 'ITM005', name: 'Network Switch 24Port', spec: '24-Port / Gigabit / PoE+ / Managed / 19" Rack', unit: 'EA', unitPrice: 420000 },
  { id: '6', code: 'ITM006', name: 'Multifunction Printer A3', spec: 'A3 / Print·Scan·Copy·Fax / 40ppm / WiFi', unit: 'EA', unitPrice: 1200000 },
  { id: '7', code: 'ITM007', name: 'USB-C Hub 7-in-1', spec: 'USB-C / HDMI 4K / USB3.0×3 / SD / PD100W', unit: 'EA', unitPrice: 48000 },
  { id: '8', code: 'ITM008', name: 'Bluetooth Headset', spec: 'BT 5.3 / ANC / 30h Battery / USB-C / Foldable', unit: 'EA', unitPrice: 95000 },
  { id: '9', code: 'ITM009', name: 'NAS Storage 4-Bay', spec: '4-Bay / Quad-core / 4GB ECC / 2×GbE / USB3.2', unit: 'EA', unitPrice: 680000 },
  { id: '10', code: 'ITM010', name: 'Smart Whiteboard 65"', spec: '65" 4K Touch / Android / WiFi / HDMI / 20pt', unit: 'EA', unitPrice: 3500000 },
  { id: '11', code: 'ITM011', name: 'Business Laptop 15"', spec: '15.6" FHD / Intel i7 / 16GB / 512GB SSD', unit: 'EA', unitPrice: 1850000 },
  { id: '12', code: 'ITM012', name: 'Desktop PC Set', spec: 'Intel i7 / 32GB / 1TB SSD / Tower', unit: 'SET', unitPrice: 2200000 },
  { id: '13', code: 'ITM013', name: 'LED Monitor 27"', spec: '27" QHD 2560×1440 / IPS / 75Hz', unit: 'EA', unitPrice: 450000 },
  { id: '14', code: 'ITM014', name: 'Laser Printer A4', spec: 'A4 / 30ppm / Duplex / WiFi / USB', unit: 'EA', unitPrice: 380000 },
  { id: '15', code: 'ITM015', name: 'Document Scanner', spec: 'A4 / ADF 50매 / 600dpi / USB', unit: 'EA', unitPrice: 290000 },
  { id: '16', code: 'ITM016', name: 'Mechanical Keyboard', spec: 'TKL / Cherry MX Red / USB-C / Backlit', unit: 'EA', unitPrice: 120000 },
  { id: '17', code: 'ITM017', name: 'Wireless Mouse', spec: '2.4GHz / 1600DPI / USB Dongle / 12M Battery', unit: 'EA', unitPrice: 35000 },
  { id: '18', code: 'ITM018', name: 'External SSD 1TB', spec: '1TB / USB 3.2 / 1050MB/s / Pocket Size', unit: 'EA', unitPrice: 98000 },
  { id: '19', code: 'ITM019', name: 'UPS 1000VA', spec: '1000VA / 600W / 8 Outlet / LCD Display', unit: 'EA', unitPrice: 185000 },
  { id: '20', code: 'ITM020', name: 'Video Conference Camera', spec: '4K / 120° FOV / Built-in Mic / USB-C', unit: 'EA', unitPrice: 320000 },
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

function getDefaultApprover() {
  return approverOptions.value[0] ?? defaultApproverOptions[0]
}

function createInitialForm() {
  return {
    clientName: '',
    clientAddress: '',
    clientTel: '',
    clientEmail: '',
    buyerName: '',
    currency: 'USD',
    issueDate: getTodayDateInput(),
    deliveryDate: '',
    incoterms: 'FOB',
    namedPlace: 'BUSAN',
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
const productCatalog = ref([...fallbackProductCatalog])
const incotermCatalog = ref([...fallbackIncotermsCatalog])
const exchangeRateHint = ref(createExchangeRateHint('USD', getTodayDateInput()))
const currentCurrency = computed(() => form.value.currency || 'USD')

const currentCurrencySymbol = computed(() => currencySymbolMap[currentCurrency.value] ?? currentCurrency.value)

const selectedIncotermState = computed(() => resolveIncotermState(
  form.value.incoterms,
  form.value.namedPlace,
  incotermCatalog.value,
))

const selectedIncotermMeta = computed(() => selectedIncotermState.value.meta)
const sellerSegments = computed(() => selectedIncotermMeta.value?.sellerSegments ?? 6)
const buyerSegments = computed(() => Math.max(0, shippingStageDefinitions.length - sellerSegments.value))
const selectedIncotermIndex = computed(() => {
  const index = incotermCatalog.value.findIndex((item) => item.code === selectedIncotermState.value.code)
  return index >= 0 ? index : 0
})
const incotermProgressStyle = computed(() => {
  const denominator = Math.max(incotermCatalog.value.length - 1, 1)
  const ratio = selectedIncotermIndex.value / denominator
  return {
    width: `calc((100% - 28px) * ${ratio})`,
  }
})
const selectedIncotermLabel = computed(() => formatIncotermsLabel(form.value.incoterms, form.value.namedPlace))

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
  sublabel: [item.code, item.spec, `${Number(item.unitPrice ?? 0).toLocaleString('ko-KR')} KRW`].filter(Boolean).join(' · '),
})))

const reasonFieldLabel = computed(() => (
  props.mode === 'create' ? '특기사항' : '수정 사유'
))

const reasonFieldPlaceholder = computed(() => (
  `${reasonFieldLabel.value}를 입력하세요`
))

const isReasonRequired = computed(() => props.mode === 'edit')
const showApproverField = computed(() => true)

function mapBuyerLabel(buyer) {
  if (!buyer?.name) return ''
  return buyer.position ? `${buyer.name} (${buyer.position})` : buyer.name
}

async function loadReferenceData() {
  try {
    const [clientsData, countriesData, currenciesData, itemsData, usersData, incotermsData] = await Promise.all([
      fetchClients(),
      fetchCountries(),
      fetchCurrencies(),
      fetchItems(),
      fetchUsers(),
      fetchIncoterms(),
    ])

    const countryMap = new Map(
      countriesData.map((country) => [String(country.id), country.nameKr ?? country.name ?? '-']),
    )

    clientCatalog.value = clientsData.map((client) => ({
      id: String(client.id),
      name: client.name,
      country: countryMap.get(String(client.countryId)) ?? '-',
      address: client.address ?? '',
      tel: client.tel ?? '',
      email: client.email ?? '',
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

    if (!productCatalog.value.length) {
      productCatalog.value = [...fallbackProductCatalog]
    }
    incotermCatalog.value = incotermsData
      .map((item) => ({
        id: String(item.id),
        code: item.code,
        name: item.name,
        nameKr: item.nameKr,
        description: item.description,
        transportMode: item.transportMode,
        sellerSegments: Number(item.sellerSegments ?? 6),
        defaultNamedPlace: item.defaultNamedPlace ?? '',
        namedPlacePlaceholder: item.namedPlacePlaceholder ?? '',
      }))
      .filter((item) => item.code)

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
    incotermCatalog.value = [...fallbackIncotermsCatalog]
    productCatalog.value = [...fallbackProductCatalog]
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

function handleProductNameChange(itemRow, productName) {
  clearItemError(itemRow.id, 'name')
  applyCatalogItemToRow(itemRow, productName)
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

function selectIncoterm(code) {
  const previousMeta = getIncotermMeta(form.value.incoterms, incotermCatalog.value)
  const meta = getIncotermMeta(code, incotermCatalog.value)
  const currentNamedPlace = String(form.value.namedPlace ?? '').trim()
  const shouldReplaceNamedPlace = !currentNamedPlace || currentNamedPlace === (previousMeta.defaultNamedPlace ?? '')

  form.value.incoterms = code

  if (shouldReplaceNamedPlace) {
    form.value.namedPlace = meta.defaultNamedPlace ?? ''
  }

  clearError('incoterms')
  clearError('namedPlace')
}

function validateForm() {
  const errors = {}

  if (!form.value.clientName.trim()) {
    errors.clientName = '거래처를 선택하세요.'
  }

  if (!form.value.buyerName.trim()) {
    errors.buyerName = '바이어를 선택하세요.'
  }

  if (!form.value.currency.trim()) {
    errors.currency = '통화를 선택하세요.'
  }

  if (!form.value.deliveryDate) {
    errors.deliveryDate = '납기일을 입력하세요.'
  }

  if (!form.value.issueDate) {
    errors.issueDate = '발행일을 입력하세요.'
  }

  if (!form.value.incoterms.trim()) {
    errors.incoterms = '인코텀즈를 선택하세요.'
  }

  if (!form.value.namedPlace.trim()) {
    errors.namedPlace = 'Named Place를 입력하세요.'
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

    if (!String(item.unit ?? '').trim()) {
      errors[itemErrorKey(item.id, 'unit')] = '단위를 입력하세요.'
    }

    if (String(item.unitPrice ?? '').trim() === '' || Number(item.unitPrice) <= 0) {
      errors[itemErrorKey(item.id, 'unitPrice')] = '단가를 입력하세요.'
    }

  }

  if (isReasonRequired.value && !form.value.reason.trim()) {
    errors.reason = reasonFieldPlaceholder.value
  }

  if (showApproverField.value && !form.value.approver) {
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

async function initializeForm() {
  if (!props.open) return

  validationErrors.value = {}

  if (props.mode === 'edit' && props.document) {
    const normalizedIncoterms = resolveIncotermState(
      props.document.incoterms,
      props.document.namedPlace,
      incotermCatalog.value,
    )

    form.value = {
      clientName: props.document.clientName ?? '',
      clientAddress: props.document.clientAddress ?? '',
      clientTel: props.document.clientTel ?? '',
      clientEmail: props.document.clientEmail ?? '',
      buyerName: props.document.buyerName ?? 'Mr. Ahmad Razak (Purchasing Manager)',
      currency: props.document.currency ?? 'USD',
      issueDate: props.document.issueDate?.replaceAll('/', '-') ?? getTodayDateInput(),
      deliveryDate: props.document.deliveryDate?.replaceAll('/', '-') ?? '',
      incoterms: normalizedIncoterms.code || 'FOB',
      namedPlace: normalizedIncoterms.namedPlace || getIncotermMeta(normalizedIncoterms.code, incotermCatalog.value).defaultNamedPlace || '',
      reason: '',
      approver: getDefaultApprover(),
      items: props.document.items?.map((item, index) => ({
        id: item.id ?? index + 1,
        name: item.name ?? '',
        qty: String(item.qty ?? item.quantity ?? ''),
        unit: item.unit ?? '',
        unitPrice: String(item.unitPrice ?? ''),
        amount: String(item.amount ?? '0').replace(/[^0-9.]/g, '') || '0',
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
  if (!form.value.namedPlace) {
    form.value.namedPlace = getIncotermMeta(form.value.incoterms, incotermCatalog.value).defaultNamedPlace ?? ''
  }
  await loadBuyerOptions()
}

watch(
  () => [props.open, props.mode, props.document],
  async () => {
    await initializeForm()
  },
  { immediate: true },
)

function openClientSearch() {
  emit('open-client-search')
}

function addItem() {
  const itemRow = createEmptyItemRow()
  const defaultProductName = productCatalog.value[0]?.name ?? fallbackProductCatalog[0]?.name ?? ''

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
}

watch(
  () => props.selectedClient,
  async (client) => {
    if (!client) return
    form.value.clientName = client.name
    form.value.clientAddress = client.address ?? ''
    form.value.clientTel = client.tel ?? ''
    form.value.clientEmail = client.email ?? ''
    form.value.buyerName = client.buyers?.[0] ?? ''
    form.value.currency = client.currency ?? form.value.currency
    clearError('clientName')
    clearError('buyerName')
    clearError('currency')
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
        저장하면 선택한 결재자에게 결재 요청이 전송됩니다.
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-gray-600">거래처 <span class="text-red-500">*</span></label>
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
          <label class="mb-1 block text-gray-600">바이어 <span class="text-red-500">*</span></label>
          <BaseSelect
            v-model="form.buyerName"
            :options="buyerOptions"
            placeholder="바이어 선택"
            @update:modelValue="clearError('buyerName')"
          />
          <p v-if="getFieldError('buyerName')" class="mt-1 text-xs text-red-500">{{ getFieldError('buyerName') }}</p>
        </div>

        <div class="md:col-span-2">
          <label class="mb-1 block text-gray-600">거래처 영문주소</label>
          <BaseTextarea
            v-model="form.clientAddress"
            placeholder="거래처 선택 시 주소가 자동 입력됩니다."
            :rows="2"
            resize="none"
          />
        </div>

        <div>
          <label class="mb-1 block text-gray-600">거래처 연락처</label>
          <BaseTextField
            v-model="form.clientTel"
            placeholder="예: +60-3-555-0101"
          />
        </div>

        <div>
          <label class="mb-1 block text-gray-600">거래처 이메일</label>
          <BaseTextField
            v-model="form.clientEmail"
            placeholder="예: contact@client.com"
          />
        </div>

        <div>
          <label class="mb-1 block text-gray-600">통화 <span class="text-red-500">*</span></label>
          <BaseSelect
            v-model="form.currency"
            :options="currencyOptions"
            placeholder="통화 선택"
            @update:modelValue="clearError('currency')"
          />
          <p class="mt-1 text-xs text-slate-500">{{ exchangeRateHint }}</p>
          <p v-if="getFieldError('currency')" class="mt-1 text-xs text-red-500">{{ getFieldError('currency') }}</p>
        </div>

        <div>
          <label class="mb-1 block text-gray-600">발행일 <span class="text-red-500">*</span></label>
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
          <label class="mb-1 block text-gray-600">납기일 <span class="text-red-500">*</span></label>
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

        <div v-if="showApproverField">
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
        <label class="mb-1 block text-gray-600">인코텀즈 <span class="text-red-500">*</span></label>
        <input v-model="form.incoterms" type="hidden">
        <div class="rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-3 select-none">
          <div class="mb-2 flex items-center gap-1.5">
            <span class="text-[10px] font-bold text-emerald-500"><i class="fas fa-building mr-0.5"></i>인도자</span>
            <span class="h-px flex-1 bg-gradient-to-r from-emerald-500 to-blue-500"></span>
            <span class="text-[10px] font-bold text-blue-500">인수자 <i class="fas fa-user ml-0.5"></i></span>
          </div>

          <div class="mb-1.5 flex h-[18px] gap-px overflow-hidden rounded-md">
            <div
              v-for="(stage, index) in shippingStageDefinitions"
              :key="stage.key"
              class="flex flex-1 items-center justify-center"
              :class="index < sellerSegments ? 'bg-emerald-500' : 'bg-blue-500'"
              :title="stage.label"
            >
              <i :class="['fas', stage.icon, 'text-[7px] text-white/90']" aria-hidden="true"></i>
            </div>
          </div>

          <div class="mb-2 flex gap-px">
            <div
              v-for="(stage, index) in shippingStageDefinitions"
              :key="`${stage.key}-label`"
              class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight"
              :class="index < sellerSegments ? 'text-emerald-500' : 'text-blue-500'"
            >
              {{ stage.label }}
            </div>
          </div>

          <div class="mb-2 px-1">
            <div class="relative cursor-pointer touch-none">
              <div class="absolute left-[14px] right-[14px] top-3 h-[5px] rounded bg-slate-200"></div>
              <div class="absolute left-[14px] top-3 h-[5px] rounded bg-emerald-500 transition-all duration-150" :style="incotermProgressStyle"></div>
              <div class="relative z-[1] flex justify-between">
                <div
                  v-for="option in incotermCatalog"
                  :key="option.code"
                  class="flex flex-1 cursor-pointer flex-col items-center"
                  @click="selectIncoterm(option.code)"
                >
                  <div
                    :class="selectedIncotermState.code === option.code ? 'mt-[2px] flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 text-[7px] font-extrabold text-white shadow-[0_2px_6px_#10B98144]' : 'mt-[9px] flex h-[10px] w-[10px] items-center justify-center rounded-full border-2 border-blue-500 bg-white'"
                  >
                    <span v-if="selectedIncotermState.code === option.code">{{ option.code[0] }}</span>
                  </div>
                  <div :class="selectedIncotermState.code === option.code ? 'mt-0.5 whitespace-nowrap text-[9px] font-extrabold text-emerald-500' : 'mt-0.5 whitespace-nowrap text-[7px] font-medium text-slate-400'">
                    {{ option.code }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2">
            <div class="flex h-12 min-w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500">
              <span class="text-sm font-black text-white">{{ selectedIncotermState.code }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-slate-800">
                {{ selectedIncotermMeta.nameKr }}
                <span class="ml-1 text-[10px] font-normal text-slate-500">{{ selectedIncotermMeta.name }}</span>
              </div>
              <div class="mt-0.5 line-clamp-2 text-[9px] leading-[1.3] text-slate-500">
                {{ selectedIncotermMeta.description }}
              </div>
              <div class="mt-1 flex items-center gap-1.5">
                <span class="text-[8px] font-bold text-emerald-500">인도자 {{ sellerSegments }}구간</span>
                <span class="text-[8px] font-bold text-blue-500">인수자 {{ buyerSegments }}구간</span>
                <span class="text-[8px] text-slate-400"><i class="fas fa-ship mr-0.5"></i>{{ selectedIncotermMeta.transportMode }}</span>
              </div>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <label class="mb-1 block text-[11px] font-semibold text-slate-600">적용 조건</label>
              <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                {{ selectedIncotermLabel }}
              </div>
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-semibold text-slate-600">Named Place <span class="text-red-500">*</span></label>
              <BaseTextField
                v-model="form.namedPlace"
                :placeholder="selectedIncotermMeta.namedPlacePlaceholder || '예: BUSAN'"
                @update:modelValue="clearError('namedPlace')"
              />
            </div>
          </div>
        </div>
        <p v-if="getFieldError('incoterms')" class="mt-2 text-xs text-red-500">{{ getFieldError('incoterms') }}</p>
        <p v-if="getFieldError('namedPlace')" class="mt-1 text-xs text-red-500">{{ getFieldError('namedPlace') }}</p>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="font-medium text-gray-700">품목 목록 <span class="text-red-500">*</span></label>
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
                  @update:modelValue="handleProductNameChange(row, $event)"
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
                @update:modelValue="clearItemError(row.id, 'unit')"
              />
              <p v-if="getItemError(row.id, 'unit')" class="mt-1 text-[11px] text-red-500">{{ getItemError(row.id, 'unit') }}</p>
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
                @update:modelValue="clearItemError(row.id, 'remark')"
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
        <BaseTextarea
          v-model="form.reason"
          :placeholder="reasonFieldPlaceholder"
          :rows="4"
          resize="none"
          @update:modelValue="clearError('reason')"
        />
        <p v-if="getFieldError('reason')" class="mt-2 text-xs text-red-500">{{ getFieldError('reason') }}</p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
