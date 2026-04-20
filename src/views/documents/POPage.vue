<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ApprovalRequestModal from '@/components/common/ApprovalRequestModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TableActions from '@/components/common/TableActions.vue'
import POFormModal from '@/components/domain/document/POFormModal.vue'
import {
  createPurchaseOrder,
  requestPoRegistration,
  requestPoModification,
  validatePoDeletable,
  requestPoDeletion,
} from '@/api/documents'
import { fetchCurrencies, fetchItems } from '@/api/master'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { usePagination } from '@/composables/usePagination'
import { useSearchModalLookups } from '@/composables/useSearchModalLookups'
import { useAuthStore } from '@/stores/auth'
import { useCiDocuments } from '@/stores/ciDocuments'
import { usePiDocuments } from '@/stores/piDocuments'
import { usePlDocuments } from '@/stores/plDocuments'
import { loadPoDocuments, usePoDocuments } from '@/stores/poDocuments'
import { useProductionOrderDocuments } from '@/stores/productionOrderDocuments'
import { useShipmentOrderDocuments } from '@/stores/shipmentOrderDocuments'
import { useShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'
import { useSalesCollectionDocuments } from '@/stores/salesCollectionDocuments'
import { useToast } from '@/composables/useToast'
import {
  buildApprovalRequestRows,
  DELETE_REQUEST_DOCUMENT_STATUS,
  DELETE_REQUEST_STATUS,
  EDIT_REQUEST_DOCUMENT_STATUS,
  EDIT_REQUEST_STATUS,
  REGISTRATION_DOCUMENT_STATUS,
  REGISTRATION_REQUEST_STATUS,
} from '@/utils/documentApproval'
import { openDocumentOutputByType, openTableOutput } from '@/utils/documentOutput'
import {
  formatPiPoSelectionMessage,
  formatPoShipmentLockMessage,
  formatPoCollectionLockMessage,
  getPiPoSelectionInfo,
  getPoShipmentLockInfo,
  getPoCollectionLockInfo,
  resolvePoShipmentDocumentStatus,
} from '@/utils/documentShipmentLock'
import { canMutateDocument } from '@/utils/documentOwnership'
import { clientSearchColumns, productSearchColumns } from '@/utils/searchModalColumns'
import { buildSelectOptionsFromRows } from '@/utils/selectOptions'
import { formatCurrencyAmount } from '@/utils/currencyFormat'

const router = useRouter()
const authStore = useAuthStore()
const { success, warning, error } = useToast()

const isAdvancedOpen = ref(false)
const formOpen = ref(false)
const formMode = ref('create')
const selectedRow = ref(null)
const deleteApprovalRequestOpen = ref(false)
const createApprovalRequestOpen = ref(false)
const editApprovalRequestOpen = ref(false)
const piSearchOpen = ref(false)
const piSearchKeyword = ref('')
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedPi = ref(null)
const selectedClient = ref(null)
const codeSearchOpen = ref(false)
const codeSearchKeyword = ref('')
const productSearchOpen = ref(false)
const productSearchKeyword = ref('')
const clientSearchContext = ref('filter')
const pendingCreateFormValue = ref(null)
// G5: createPurchaseOrder 성공 후 requestPoRegistration 가 실패하면 DRAFT PO 가
// 서버에 남는다. 같은 buildCreatePayload 결과로 재시도하면 또 다른 DRAFT 가
// 생겨버려 초안 중복이 쌓이던 문제를 방지하기 위해, 생성된 poId 를 보관하고
// 다음 시도에서는 create 를 건너뛰고 request-registration 만 재시도한다.
const pendingDraftPoId = ref(null)
const createSaving = ref(false)
const pendingEditRequest = ref(null)
const ciDocuments = useCiDocuments()
const piRowsSource = usePiDocuments()
const plDocuments = usePlDocuments()
const productionOrderDocuments = useProductionOrderDocuments()
const shipmentOrderDocuments = useShipmentOrderDocuments()
const shipmentStatusDocuments = useShipmentStatusDocuments()
const { clientRowsSource, createClientRows, createProductRows } = useSearchModalLookups()
const currencyCatalog = ref([])
const itemCatalog = ref([])

async function loadCatalogs() {
  try {
    const [currenciesData, itemsData] = await Promise.all([
      fetchCurrencies().catch(() => []),
      fetchItems().catch(() => []),
    ])
    currencyCatalog.value = currenciesData ?? []
    itemCatalog.value = itemsData ?? []
  } catch {
    currencyCatalog.value = []
    itemCatalog.value = []
  }
}

onMounted(() => {
  loadCatalogs()
})

const columns = [
  { key: 'id', label: 'PO 번호', align: 'center', width: '140px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'left', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'left', width: '220px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'manager', label: '영업담당자', align: 'left', width: '120px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
  { key: 'deliveryDate', label: '납기', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'center', width: '90px', sortable: false },
]

const approvalItemColumns = [
  { key: 'name', label: '품목명', align: 'left' },
  { key: 'qty', label: '수량', align: 'right' },
  { key: 'unit', label: '단위', align: 'center' },
  { key: 'unitPrice', label: '단가', align: 'right' },
  { key: 'amount', label: '금액', align: 'right' },
  { key: 'remark', label: '비고', align: 'left' },
]

const approvalChangeColumns = [
  { key: 'label', label: '변경 항목', align: 'left' },
  { key: 'before', label: '원본값', align: 'left' },
  { key: 'after', label: '변경값', align: 'left' },
]

const poRowsData = usePoDocuments()
const rowsData = computed(() => (
  poRowsData.value.map((row) => ({
    ...row,
    status: resolvePoShipmentDocumentStatus(
      row.id,
      row.status,
      shipmentOrderDocuments.value,
      shipmentStatusDocuments.value,
    ),
  }))
))
const { filters, filteredRows, resetFilters, applyFilters } = useDocumentFilter(rowsData, {
  keywordFields: ['id', 'clientName', 'country', 'itemName', 'amount', 'manager', 'status', 'issueDate', 'deliveryDate'],
  issueDateField: 'issueDate',
  deliveryDateField: 'deliveryDate',
})
const { currentPage, totalPages, paginatedRows } = usePagination(filteredRows)

const isTeamLeader = computed(() => Number(authStore.currentUser?.positionId) === 1)

// 팀장(MANAGER) 은 백엔드 requestRegistration 에서 즉시 CONFIRMED 처리되므로
// 결재대기 문구가 오해를 준다. 실제 동작에 맞춘 안내로 분기.
const createHelperText = computed(() => (
  isTeamLeader.value
    ? '팀장 권한이므로 저장 시 PO 가 즉시 확정 처리됩니다.'
    : '요청 후 PO는 결재대기 상태로 등록되며, 승인 전까지 확정 처리되지 않습니다.'
))

const managerOptions = computed(() => buildSelectOptionsFromRows(rowsData.value, 'manager'))
const countryOptions = computed(() => buildSelectOptionsFromRows(rowsData.value, 'country'))
const statusOptions = computed(() => buildSelectOptionsFromRows(rowsData.value, 'status'))

const shipmentLockInfoByPoId = computed(() => (
  new Map(
    rowsData.value.map((row) => [
      row.id,
      getPoShipmentLockInfo(
        row.id,
        shipmentOrderDocuments.value,
        shipmentStatusDocuments.value,
      ),
    ]),
  )
))

const salesCollectionDocuments = useSalesCollectionDocuments()
const collectionLockInfoByPoId = computed(() => (
  new Map(
    rowsData.value.map((row) => [
      row.id,
      getPoCollectionLockInfo(row.id, salesCollectionDocuments.value),
    ]),
  )
))

// PO 는 결재 확정(CONFIRMED) PI 만 연결 가능. 초안·결재대기·수정요청 상태의 PI 가
// 드롭다운에 노출되면 결재받지 않은 초안으로 PO 생성이 가능해지므로 프론트에서 먼저 차단.
function isConfirmedPi(row) {
  const status = String(row?.status ?? '').trim().toLowerCase()
  return status === 'confirmed' || status === '확정'
}

const availablePiRows = computed(() => {
  const poData = poRowsData.value
  const result = piRowsSource.value.filter((row) => {
    if (!isConfirmedPi(row)) return false
    const info = getPiPoSelectionInfo(
      row,
      poData,
      shipmentOrderDocuments.value,
      shipmentStatusDocuments.value,
      productionOrderDocuments.value,
      ciDocuments.value,
      plDocuments.value,
      formMode.value === 'edit' ? selectedRow.value?.id || '' : '',
    )
    if (!info.selectable) {
      console.debug(`[PI필터] ${row.id} 제외 — PO ${info.activeLinkedPoRows?.length}건 연결, canceled=${info.canceled}, pending=${info.approvalPending}, locked=${info.shipmentLockInfo?.locked}`)
    }
    return info.selectable
  })
  if (piRowsSource.value.length > 0 && poData.length === 0) {
    console.warn('[PI필터] PO 데이터 0건 — 모든 PI가 선택 가능 상태로 표시됩니다')
  }
  return result
})

const piRows = computed(() => {
  const keyword = piSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return availablePiRows.value
  return availablePiRows.value.filter((row) => (
    [row.id, row.clientName, row.currency, row.deliveryDate]
      .some((value) => String(value ?? '').toLowerCase().includes(keyword))
  ))
})

const clientRows = createClientRows(clientSearchKeyword)

const codeRows = computed(() => {
  const keyword = codeSearchKeyword.value.trim().toLowerCase()
  const rows = rowsData.value.map((row) => ({ id: row.id, issueDate: row.issueDate, clientName: row.clientName }))
  if (!keyword) return rows
  return rows.filter((row) => [row.id, row.issueDate, row.clientName].some((value) => String(value).toLowerCase().includes(keyword)))
})

const productRows = createProductRows(productSearchKeyword)

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
  selectedPi.value = null
  selectedClient.value = null
  pendingCreateFormValue.value = null
  pendingEditRequest.value = null
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  pendingEditRequest.value = null
  if (formMode.value === 'create') {
    pendingCreateFormValue.value = null
  }
}

function openEditForm(row) {
  if (!canMutateDocument(row, authStore.currentUser)) {
    warning('본인 또는 팀장·ADMIN 만 수정할 수 있습니다.')
    return
  }
  const shipmentLockInfo = shipmentLockInfoByPoId.value.get(row.id)
  if (shipmentLockInfo?.locked) {
    warning(formatPoShipmentLockMessage(shipmentLockInfo))
    return
  }
  const collectionLockInfo = collectionLockInfoByPoId.value.get(row.id)
  if (collectionLockInfo?.locked) {
    warning(formatPoCollectionLockMessage(collectionLockInfo))
    return
  }

  selectedPi.value = piRowsSource.value.find((pi) => pi.id === (row.piId || row.linkedPiId || '')) ?? null
  selectedClient.value = clientRowsSource.value.find((client) => client.name === row.clientName) ?? null
  formMode.value = 'edit'
  selectedRow.value = {
    id: row.id,
    piId: row.piId || row.linkedPiId || '',
    clientName: row.clientName,
    currency: row.currency || selectedPi.value?.currency || '',
    deliveryDate: row.deliveryDate,
    sourceDeliveryDate: row.sourceDeliveryDate || selectedPi.value?.deliveryDate || row.deliveryDate,
    deliveryDateOverride: Boolean(row.deliveryDateOverride),
  }
  formOpen.value = true
}

function getTodaySlashDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

function parseAmount(value) {
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '')
  return Number.parseFloat(normalized || '0') || 0
}

function formatAmount(currency, value) {
  // B1 — 승인 검토 모달 품목 라인 통화 기호·소수 자릿수 일관화. 공용 formatCurrencyAmount
  // 로 위임 (Issue #2·#10 공통 픽스 경로).
  return formatCurrencyAmount(value, currency)
}

function createComparableItem(item) {
  const quantity = parseAmount(item.qty ?? item.quantity)
  const unitPrice = parseAmount(item.unitPrice)
  const amount = parseAmount(item.amount) || quantity * unitPrice

  return {
    name: item.name ?? '',
    quantity,
    unit: item.unit ?? '',
    unitPrice,
    amount,
    remark: item.remark ?? '',
  }
}

function createItemDigest(items) {
  if (!items.length) return '없음'

  const firstItem = items[0]
  const quantityLabel = firstItem.qty > 0
    ? ` / ${firstItem.qty.toLocaleString()}${firstItem.unit ? ` ${firstItem.unit}` : ''}`
    : ''
  const tailLabel = items.length > 1 ? ` 외 ${items.length - 1}건` : ''

  return `${firstItem.name || '품목'}${quantityLabel}${tailLabel}`
}

function getLinkedPiById(id) {
  return piRowsSource.value.find((pi) => pi.id === id) ?? null
}

function createComparableSnapshot(source) {
  const linkedPi = getLinkedPiById(source.piId || source.linkedPiId || '')
  const currency = source.currency || linkedPi?.currency || 'USD'
  const items = (source.items?.length ? source.items : linkedPi?.items ?? []).map(createComparableItem)
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const issueDate = source.issueDate || getTodaySlashDate()
  const sourceDeliveryDate = source.sourceDeliveryDate || linkedPi?.deliveryDate || source.deliveryDate || ''
  const deliveryDate = source.deliveryDate || sourceDeliveryDate || ''
  const deliveryMode = source.deliveryDateOverride && deliveryDate !== sourceDeliveryDate
    ? 'PI 기준값에서 별도 조정'
    : 'PI 기준값 사용'

  return {
    piId: source.piId || source.linkedPiId || '',
    clientName: source.clientName || linkedPi?.clientName || '',
    clientAddress: source.clientAddress || linkedPi?.clientAddress || '',
    buyerName: source.buyerName || linkedPi?.buyerName || '',
    currency,
    issueDate,
    deliveryDate,
    sourceDeliveryDate,
    deliveryMode,
    incoterms: source.incoterms || linkedPi?.incoterms || '',
    namedPlace: source.namedPlace || linkedPi?.namedPlace || '',
    items,
    amount: formatAmount(currency, totalAmount),
  }
}

function buildChangeRows(originalSnapshot, revisedSnapshot) {
  return [
    { label: '기준 PI 번호', before: originalSnapshot.piId || '-', after: revisedSnapshot.piId || '-' },
    { label: '거래처', before: originalSnapshot.clientName || '-', after: revisedSnapshot.clientName || '-' },
    { label: '영문주소', before: originalSnapshot.clientAddress || '-', after: revisedSnapshot.clientAddress || '-' },
    { label: '바이어', before: originalSnapshot.buyerName || '-', after: revisedSnapshot.buyerName || '-' },
    { label: '통화', before: originalSnapshot.currency || '-', after: revisedSnapshot.currency || '-' },
    { label: '발행일', before: originalSnapshot.issueDate || '-', after: revisedSnapshot.issueDate || '-' },
    { label: '납기일', before: originalSnapshot.deliveryDate || '-', after: revisedSnapshot.deliveryDate || '-' },
    { label: '납기 처리', before: originalSnapshot.deliveryMode || '-', after: revisedSnapshot.deliveryMode || '-' },
    {
      label: '인코텀즈',
      before: originalSnapshot.incoterms ? `${originalSnapshot.incoterms}${originalSnapshot.namedPlace ? ` ${originalSnapshot.namedPlace}` : ''}` : '-',
      after: revisedSnapshot.incoterms ? `${revisedSnapshot.incoterms}${revisedSnapshot.namedPlace ? ` ${revisedSnapshot.namedPlace}` : ''}` : '-',
    },
    {
      label: '품목 목록',
      before: createItemDigest(originalSnapshot.items),
      after: createItemDigest(revisedSnapshot.items),
    },
    { label: '총액', before: originalSnapshot.amount || '-', after: revisedSnapshot.amount || '-' },
  ].filter((row) => row.before !== row.after)
}

function getLinkedPiItems(linkedPi) {
  return linkedPi?.items ?? []
}

function buildRowPayload(formValue) {
  const matchedClient = clientRowsSource.value.find((client) => client.name === formValue.clientName)
  const linkedPi = piRowsSource.value.find((pi) => pi.id === formValue.linkedPiId)
  const linkedItems = getLinkedPiItems(linkedPi)
  const totalAmount = linkedItems.reduce((sum, item) => sum + parseAmount(item.amount), 0)

  return {
    issueDate: getTodaySlashDate(),
    clientName: formValue.clientName || '거래처 미선택',
    country: linkedPi?.country || matchedClient?.country || selectedClient.value?.country || '-',
    itemName: linkedItems[0]?.name || (linkedPi ? 'PI 연결 품목' : '품목 미입력'),
    amount: formatAmount(linkedPi?.currency || formValue.currency || 'USD', totalAmount),
    currency: linkedPi?.currency || formValue.currency || '',
    clientAddress: linkedPi?.clientAddress || '',
    clientCode: linkedPi?.clientCode || '',
    clientEmail: linkedPi?.clientEmail || '',
    clientTel: linkedPi?.clientTel || '',
    buyerName: linkedPi?.buyerName || '',
    incoterms: linkedPi?.incoterms || '',
    namedPlace: linkedPi?.namedPlace || '',
    deliveryDate: formValue.deliveryDate ? formValue.deliveryDate.replaceAll('-', '/') : '-',
    sourceDeliveryDate: formValue.sourceDeliveryDate ? formValue.sourceDeliveryDate.replaceAll('-', '/') : '',
    deliveryDateOverride: Boolean(formValue.linkedPiId && formValue.deliveryDateOverride),
    items: linkedItems.map((item) => ({ ...item })),
    linkedPiId: formValue.linkedPiId || '',
    piId: formValue.linkedPiId || '',
  }
}

function toIsoDate(value) {
  if (!value) return null
  return String(value).replaceAll('/', '-')
}

function findCurrencyIdByCode(code) {
  if (!code) return null
  const match = currencyCatalog.value.find((c) => (c.currencyCode ?? c.code) === code)
  return match?.currencyId ?? match?.id ?? null
}

function findItemIdByName(name) {
  if (!name) return null
  const match = itemCatalog.value.find((item) => (item.itemName ?? item.name) === name)
  return match?.itemId ?? match?.id ?? null
}

// Issue D — master.items.item_weight(kg) 을 PO 생성 payload 스냅샷에 포함시키기
// 위해 품목명으로 조회. 스냅샷 후 master 가 바뀌어도 PL 총중량은 PO 시점 값 고정.
function findItemWeightByName(name) {
  if (!name) return null
  const match = itemCatalog.value.find((item) => (item.itemName ?? item.name) === name)
  const raw = match?.itemWeight ?? match?.weight ?? null
  return raw == null || raw === '' ? null : Number(raw)
}

/**
 * POFormModal @save payload 를 백엔드 PurchaseOrderCreateRequest DTO 로 매핑.
 * PO 는 연결 PI 가 이미 거래처 통화로 변환·저장해 둔 외화 단가/금액을 그대로 승계한다.
 * 백엔드 purchase_orders.po_total_amount / po_items.po_item_unit_price 는 거래처 통화
 * 기준이며, PI 와 달리 KRW→외화 재변환을 수행하지 않는다. PDF·CI·PL·Collection 도
 * 모두 PO 의 통화 기준 값을 그대로 참조하므로 단일 소스를 유지해야 정합성이 깨지지 않는다.
 */
function buildCreatePayload(formValue) {
  const linkedPi = piRowsSource.value.find((pi) => pi.id === formValue.linkedPiId)
  const matchedClient = clientRowsSource.value.find((client) => (
    client.name === (formValue.clientName || linkedPi?.clientName)
  ))
  const currencyCode = linkedPi?.currency || formValue.currency || matchedClient?.currency || 'USD'
  const currencyId = findCurrencyIdByCode(currencyCode) ?? matchedClient?.currencyId ?? null

  const items = (linkedPi?.items ?? []).map((item) => {
    const quantity = Number(item.qty ?? item.quantity ?? 0) || 0
    const unitPrice = Number(item.unitPrice ?? 0) || 0
    const amount = Number(item.amount ?? 0) || quantity * unitPrice
    return {
      itemId: findItemIdByName(item.name),
      itemName: item.name ?? '',
      quantity,
      unit: item.unit ?? '',
      unitPrice,
      amount,
      remark: item.remark ?? '',
      // Issue D — master.items.item_weight(kg) 스냅샷. PL 자동생성 총중량 계산에 사용.
      itemWeight: findItemWeightByName(item.name),
    }
  })

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const sourceDeliveryDate = toIsoDate(
    formValue.sourceDeliveryDate || linkedPi?.deliveryDate || formValue.deliveryDate,
  )
  const deliveryDate = toIsoDate(formValue.deliveryDate)

  return {
    poId: null,
    piId: formValue.linkedPiId || null,
    issueDate: toIsoDate(getTodaySlashDate()),
    clientId: matchedClient?.clientId ?? null,
    currencyId,
    managerId: authStore.currentUser?.userId ?? null,
    deliveryDate,
    incotermsCode: linkedPi?.incoterms || 'FOB',
    namedPlace: linkedPi?.namedPlace || '',
    sourceDeliveryDate,
    deliveryDateOverride: Boolean(formValue.linkedPiId && formValue.deliveryDateOverride),
    totalAmount,
    clientName: linkedPi?.clientName || formValue.clientName || '',
    clientAddress: linkedPi?.clientAddress || matchedClient?.address || '',
    country: linkedPi?.country || matchedClient?.country || '',
    currencyCode,
    managerName: authStore.currentUser?.userName || authStore.currentUser?.name || '',
    userId: authStore.currentUser?.userId ?? null,
    // 특기사항 (N4): POFormModal 은 폼에 reason 필드가 없어도 미래 대비 pass-through.
    remarks: formValue.reason ?? '',
    // 바이어 이름 (Issue C): 연결 PI 에 저장된 buyerName 을 그대로 승계.
    // PO 저장 시 함께 보관되어 CI.ci_buyer / PL.pl_buyer 로 전이되고, PDF·결재 모달에 노출.
    buyerName: linkedPi?.buyerName || formValue.buyerName || '',
    // Step C — 후속 흐름 분기 + 담당자. 백엔드가 미전달 시 DIRECT 기본.
    productionRoute: formValue.productionRoute ?? 'DIRECT',
    productionAssigneeId: formValue.productionAssigneeId ?? null,
    shippingAssigneeId: formValue.shippingAssigneeId ?? null,
    items,
  }
}

function getCurrentRequesterName() {
  // 백엔드 user 객체는 userName 필드를 사용한다.
  return authStore.currentUser?.userName || authStore.currentUser?.name || '미지정'
}

function getDefaultDeleteApprover(row) {
  return row?.approver || ''
}

// 결재대기 중인 행은 요청자 본인도 임의 수정/삭제 불가(I2 불변식).
const PENDING_APPROVAL_STATUSES = new Set(['결재대기', 'pending_approval', 'APPROVAL_PENDING'])
function isPendingApproval(row) {
  return PENDING_APPROVAL_STATUSES.has(row?.status)
}

function getRequestedAt() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

function buildNextPoId() {
  return `PO26${String(poRowsData.value.length + 1).padStart(3, '0')}`
}

function downloadPdf(row) {
  const opened = openDocumentOutputByType('PO', row, false)
  if (opened) {
    success(`${row.id} PDF 다운로드 창이 열렸습니다.`)
  }
}

function downloadTablePdf() {
  const exportColumns = columns
    .filter((column) => column.key !== 'actions')
    .map((column) => ({
      key: column.key,
      label: column.label,
      align: column.align ?? 'left',
    }))

  openTableOutput({
    title: 'Purchase Order 관리',
    subtitle: `총 ${filteredRows.value.length}건`,
    columns: exportColumns,
    rows: filteredRows.value.map((row) => ({
      id: row.id,
      issueDate: row.issueDate,
      clientName: row.clientName,
      country: row.country,
      itemName: row.itemName,
      amount: row.amount,
      manager: row.manager,
      status: row.status,
      deliveryDate: row.deliveryDate,
    })),
  })
}

const createApprovalRequestRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  return buildApprovalRequestRows({
    approver: pendingCreateFormValue.value.approver,
    requesterName: getCurrentRequesterName(),
    requestedAt: getRequestedAt(),
    documentStatus: REGISTRATION_DOCUMENT_STATUS,
    requestStatus: REGISTRATION_REQUEST_STATUS,
    requestTypeLabel: '등록 요청',
    applyPolicy: '팀장 승인 후 PO가 신규 등록됩니다.',
  })
})

const createApprovalDocumentRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)
  const isDeliveryOverride = Boolean(nextRow.deliveryDateOverride && nextRow.sourceDeliveryDate && nextRow.deliveryDate !== nextRow.sourceDeliveryDate)

  return [
    // 예측 번호와 실제 부여 번호가 달라 QA 리포트로 지적됨. 안내 문구로 대체.
    { label: '예정 PO 번호', value: '저장 후 자동 생성' },
    { label: '발행일', value: nextRow.issueDate },
    { label: '납기일', value: nextRow.deliveryDate },
    { label: '납기 처리', value: isDeliveryOverride ? 'PI 기준값에서 별도 조정' : 'PI 기준값 사용' },
  ]
})

const createApprovalReferenceRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)

  if (!nextRow.piId) {
    return []
  }

  return [
    { label: '기준 PI 번호', value: nextRow.piId },
    { label: '거래처', value: nextRow.clientName },
    { label: '영문주소', value: nextRow.clientAddress || '-', fullWidth: true },
    { label: '바이어', value: nextRow.buyerName || '-' },
    { label: '통화', value: nextRow.currency || '-' },
    { label: '인코텀즈', value: nextRow.incoterms ? `${nextRow.incoterms}${nextRow.namedPlace ? ` ${nextRow.namedPlace}` : ''}` : '-' },
    { label: 'PI 기준 납기일', value: nextRow.sourceDeliveryDate || '-' },
  ]
})

const createApprovalItemRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)

  return (nextRow.items ?? []).map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: parseAmount(item.quantity ?? item.qty) > 0 ? parseAmount(item.quantity ?? item.qty).toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatAmount(nextRow.currency || 'USD', parseAmount(item.unitPrice)),
    amount: formatAmount(nextRow.currency || 'USD', parseAmount(item.amount)),
    remark: item.remark || '-',
  }))
})

const createApprovalItemSummaryRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)

  return [
    { label: '품목 건수', value: `${nextRow.items?.length ?? 0}건` },
    { label: '총액', value: nextRow.amount, emphasis: true },
  ]
})

const editApprovalRequestRows = computed(() => {
  if (!pendingEditRequest.value) return []

  return buildApprovalRequestRows({
    approver: pendingEditRequest.value.approver,
    requesterName: getCurrentRequesterName(),
    requestedAt: getRequestedAt(),
    documentStatus: EDIT_REQUEST_DOCUMENT_STATUS,
    requestStatus: EDIT_REQUEST_STATUS,
    requestTypeLabel: '수정 요청',
    applyPolicy: '팀장 승인 후 PO 수정 내용이 반영됩니다.',
  })
})

const editApprovalDocumentRows = computed(() => {
  if (!pendingEditRequest.value) return []

  const { revisedSnapshot, id } = pendingEditRequest.value

  return [
    { label: '대상 PO 번호', value: id || '-' },
    { label: '발행일', value: revisedSnapshot.issueDate || '-' },
    { label: '납기일', value: revisedSnapshot.deliveryDate || '-' },
    { label: '납기 처리', value: revisedSnapshot.deliveryMode || '-' },
  ]
})

const editApprovalReferenceRows = computed(() => {
  if (!pendingEditRequest.value) return []

  const { revisedSnapshot } = pendingEditRequest.value

  if (!revisedSnapshot.piId) {
    return []
  }

  return [
    { label: '기준 PI 번호', value: revisedSnapshot.piId || '-' },
    { label: '거래처', value: revisedSnapshot.clientName || '-' },
    { label: '영문주소', value: revisedSnapshot.clientAddress || '-', fullWidth: true },
    { label: '바이어', value: revisedSnapshot.buyerName || '-' },
    { label: '통화', value: revisedSnapshot.currency || '-' },
    {
      label: '인코텀즈',
      value: revisedSnapshot.incoterms
        ? `${revisedSnapshot.incoterms}${revisedSnapshot.namedPlace ? ` ${revisedSnapshot.namedPlace}` : ''}`
        : '-',
    },
    { label: 'PI 기준 납기일', value: revisedSnapshot.sourceDeliveryDate || '-' },
  ]
})

const editApprovalItemRows = computed(() => {
  if (!pendingEditRequest.value) return []

  return pendingEditRequest.value.revisedSnapshot.items.map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: (item.quantity ?? item.qty) > 0 ? (item.quantity ?? item.qty).toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatAmount(pendingEditRequest.value.revisedSnapshot.currency, item.unitPrice),
    amount: formatAmount(pendingEditRequest.value.revisedSnapshot.currency, item.amount),
    remark: item.remark || '-',
  }))
})

const editApprovalItemSummaryRows = computed(() => {
  if (!pendingEditRequest.value) return []

  const { revisedSnapshot } = pendingEditRequest.value

  return [
    { label: '품목 건수', value: `${revisedSnapshot.items.length}건` },
    { label: '총액', value: revisedSnapshot.amount, emphasis: true },
  ]
})

const deleteApprovalRequestRows = computed(() => {
  if (!selectedRow.value || !deleteApprovalRequestOpen.value) return []

  return buildApprovalRequestRows({
    approver: getDefaultDeleteApprover(selectedRow.value),
    requesterName: getCurrentRequesterName(),
    requestedAt: getRequestedAt(),
    documentStatus: DELETE_REQUEST_DOCUMENT_STATUS,
    requestStatus: DELETE_REQUEST_STATUS,
    requestTypeLabel: '삭제 요청',
    applyPolicy: '팀장 승인 후 PO가 삭제 처리됩니다.',
  })
})

const deleteApprovalDocumentRows = computed(() => {
  if (!selectedRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(selectedRow.value)

  return [
    { label: '대상 PO 번호', value: selectedRow.value.id || '-' },
    { label: '현재 상태', value: selectedRow.value.status || '-' },
    { label: '발행일', value: snapshot.issueDate || '-' },
    { label: '납기일', value: snapshot.deliveryDate || '-' },
    { label: '납기 처리', value: snapshot.deliveryMode || '-' },
  ]
})

const deleteApprovalReferenceRows = computed(() => {
  if (!selectedRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(selectedRow.value)

  if (!snapshot.piId) {
    return []
  }

  return [
    { label: '기준 PI 번호', value: snapshot.piId || '-' },
    { label: '거래처', value: snapshot.clientName || '-' },
    { label: '영문주소', value: snapshot.clientAddress || '-', fullWidth: true },
    { label: '바이어', value: snapshot.buyerName || '-' },
    { label: '통화', value: snapshot.currency || '-' },
    {
      label: '인코텀즈',
      value: snapshot.incoterms
        ? `${snapshot.incoterms}${snapshot.namedPlace ? ` ${snapshot.namedPlace}` : ''}`
        : '-',
    },
    { label: 'PI 기준 납기일', value: snapshot.sourceDeliveryDate || '-' },
  ]
})

const deleteApprovalItemRows = computed(() => {
  if (!selectedRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(selectedRow.value)

  return snapshot.items.map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: (item.quantity ?? item.qty) > 0 ? (item.quantity ?? item.qty).toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatAmount(snapshot.currency, item.unitPrice),
    amount: formatAmount(snapshot.currency, item.amount),
    remark: item.remark || '-',
  }))
})

const deleteApprovalItemSummaryRows = computed(() => {
  if (!selectedRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(selectedRow.value)

  return [
    { label: '품목 건수', value: `${snapshot.items.length}건` },
    { label: '총액', value: snapshot.amount, emphasis: true },
  ]
})

async function confirmCreateApprovalRequest() {
  if (!pendingCreateFormValue.value || createSaving.value) return

  createSaving.value = true
  try {
    const userId = authStore.currentUser?.userId
    const approverId = pendingCreateFormValue.value.approverId ?? null

    // Idempotency: 직전 시도에서 DRAFT 는 만들어졌지만 requestPoRegistration 이
    // 실패했을 경우 pendingDraftPoId 가 살아있다. 이번엔 create 를 스킵하고
    // requestPoRegistration 만 재시도.
    let poId = pendingDraftPoId.value
    if (!poId) {
      const payload = buildCreatePayload(pendingCreateFormValue.value)
      const created = await createPurchaseOrder(payload)
      poId = created.poId
      pendingDraftPoId.value = poId
    }
    await requestPoRegistration({ poId, userId, approverId })
    await loadPoDocuments()

    createApprovalRequestOpen.value = false
    pendingCreateFormValue.value = null
    pendingDraftPoId.value = null
    formOpen.value = false
    selectedPi.value = null
    selectedClient.value = null
    success('PO 등록 결재 요청이 전송되었습니다.')
  } catch (e) {
    error(e.response?.data?.message || 'PO 등록 결재 요청 중 오류가 발생했습니다.')
    // DRAFT 는 남겨둠 (pendingDraftPoId 유지). 모달이 열려 있으면 재시도 시 위
    // if(!poId) 분기가 create 를 스킵하고 request-registration 만 재시도한다.
  } finally {
    createSaving.value = false
  }
}

function cancelCreateApprovalRequest() {
  createApprovalRequestOpen.value = false
}

async function confirmEditApprovalRequest() {
  if (!pendingEditRequest.value) return

  try {
    const userId = authStore.currentUser?.userId
    await requestPoModification({ poId: pendingEditRequest.value.id, userId })
    await loadPoDocuments()

    editApprovalRequestOpen.value = false
    pendingEditRequest.value = null
    formOpen.value = false
    selectedPi.value = null
    selectedClient.value = null
    success('PO 수정 결재 요청이 전송되었습니다.')
  } catch (e) {
    error(e.response?.data?.message || 'PO 수정 결재 요청 중 오류가 발생했습니다.')
  }
}

function cancelEditApprovalRequest() {
  editApprovalRequestOpen.value = false
}

async function handleSave(formValue) {
  if (formMode.value === 'edit') {
    const shipmentLockInfo = shipmentLockInfoByPoId.value.get(selectedRow.value?.id)
    if (shipmentLockInfo?.locked) {
      warning(formatPoShipmentLockMessage(shipmentLockInfo))
      formOpen.value = false
      return
    }
  }

  if (formMode.value === 'create') {
    if (isTeamLeader.value) {
      // 팀장 셀프 등록: 백엔드 MANAGER 권한 기준 즉시 확정.
      try {
        const payload = buildCreatePayload(formValue)
        const { poId } = await createPurchaseOrder(payload)
        const userId = authStore.currentUser?.userId
        await requestPoRegistration({ poId, userId })
        await loadPoDocuments()
        formOpen.value = false
        selectedPi.value = null
        selectedClient.value = null
        success('PO가 등록되었습니다.')
      } catch (e) {
        error(e.response?.data?.message || 'PO 등록 중 오류가 발생했습니다.')
      }
      return
    }

    pendingCreateFormValue.value = { ...formValue }
    createApprovalRequestOpen.value = true
    return
  }

  const nextRow = {
    ...buildRowPayload(formValue),
    issueDate: selectedRow.value?.issueDate || getTodaySlashDate(),
  }
  const originalSnapshot = createComparableSnapshot(selectedRow.value ?? {})
  const revisedSnapshot = createComparableSnapshot({
    id: selectedRow.value?.id,
    ...selectedRow.value,
    ...nextRow,
  })
  const changeRows = buildChangeRows(originalSnapshot, revisedSnapshot)

  if (!changeRows.length) {
    warning('변경된 내용이 없습니다.')
    return
  }

  if (isTeamLeader.value) {
    // 팀장 셀프 수정: 백엔드에 수정 결재 요청을 보내고 즉시 반영을 기대한다.
    try {
      const userId = authStore.currentUser?.userId
      await requestPoModification({ poId: selectedRow.value?.id, userId })
      await loadPoDocuments()
      formOpen.value = false
      selectedPi.value = null
      selectedClient.value = null
      success('PO가 수정되었습니다.')
    } catch (e) {
      error(e.response?.data?.message || 'PO 수정 중 오류가 발생했습니다.')
    }
    return
  }

  pendingEditRequest.value = {
    id: selectedRow.value?.id,
    approver: formValue.approver || '',
    nextRow,
    revisedSnapshot,
    changeRows,
  }
  editApprovalRequestOpen.value = true
}

async function openDeleteApprovalRequest(row) {
  if (!canMutateDocument(row, authStore.currentUser)) {
    warning('본인 또는 팀장·ADMIN 만 삭제할 수 있습니다.')
    return
  }
  const shipmentLockInfo = shipmentLockInfoByPoId.value.get(row.id)
  if (shipmentLockInfo?.locked) {
    warning(formatPoShipmentLockMessage(shipmentLockInfo))
    return
  }
  const collectionLockInfo = collectionLockInfoByPoId.value.get(row.id)
  if (collectionLockInfo?.locked) {
    warning(formatPoCollectionLockMessage(collectionLockInfo))
    return
  }

  try {
    await validatePoDeletable(row.id)
  } catch (e) {
    error(e.response?.data?.message || e.response?.data || '후속 문서가 존재하여 삭제할 수 없습니다.')
    return
  }

  if (isTeamLeader.value) {
    try {
      const userId = authStore.currentUser?.userId
      await requestPoDeletion({ poId: row.id, userId })
      await loadPoDocuments()
      success(`${row.id} PO가 삭제되었습니다.`)
    } catch (e) {
      error(e.response?.data?.message || '삭제 처리 중 오류가 발생했습니다.')
    }
    return
  }

  selectedRow.value = row
  deleteApprovalRequestOpen.value = true
}

async function confirmDeleteApprovalRequest() {
  if (!selectedRow.value) return

  const shipmentLockInfo = shipmentLockInfoByPoId.value.get(selectedRow.value.id)
  if (shipmentLockInfo?.locked) {
    warning(formatPoShipmentLockMessage(shipmentLockInfo))
    deleteApprovalRequestOpen.value = false
    selectedRow.value = null
    return
  }

  try {
    const userId = authStore.currentUser?.userId
    await requestPoDeletion({ poId: selectedRow.value.id, userId })
    await loadPoDocuments()
    success(`${selectedRow.value?.id} 삭제 결재 요청이 전송되었습니다.`)
  } catch (e) {
    error(e.response?.data?.message || '삭제 결재 요청 중 오류가 발생했습니다.')
  }

  deleteApprovalRequestOpen.value = false
  selectedRow.value = null
}

function cancelDeleteApprovalRequest() {
  deleteApprovalRequestOpen.value = false
}

function goToDetail(id) {
  if (!id) return
  router.push({ name: 'po-detail', params: { id } })
}

function handleRowClick(row) {
  goToDetail(row?.id)
}

function handlePiSelect(pi) {
  const selectionInfo = getPiPoSelectionInfo(
    pi,
    poRowsData.value,
    shipmentOrderDocuments.value,
    shipmentStatusDocuments.value,
    productionOrderDocuments.value,
    ciDocuments.value,
    plDocuments.value,
    formMode.value === 'edit' ? selectedRow.value?.id || '' : '',
  )

  if (!selectionInfo.selectable) {
    warning(formatPiPoSelectionMessage(selectionInfo, pi?.id))
    return
  }

  selectedPi.value = pi
  piSearchOpen.value = false
  piSearchKeyword.value = ''
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
    <PageHeader title="Purchase Order 관리" icon-class="fas fa-file-contract">
      <template #actions>
        <BaseButton variant="secondary" @click="downloadTablePdf">
          <template #leading>
            <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
          </template>
          PDF 다운로드
        </BaseButton>
        <BaseButton @click="openCreateForm">
          <template #leading>
            <i class="fas fa-plus text-xs" aria-hidden="true"></i>
          </template>
          PO 작성
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

        <FormField label="영업담당자">
          <SearchableCombobox
            v-model="filters.manager"
            :options="managerOptions"
            placeholder="영업담당자 검색..."
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
            <DateField v-model="filters.deliveryFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filters.deliveryTo" />
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
      :rows="paginatedRows"
      row-key="id"
      clickable-rows
      empty-text="데이터가 없습니다."
      :footer-text="`총 ${filteredRows.length}건`"
      @row-click="handleRowClick"
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
        <TableActions
          :show-edit="!shipmentLockInfoByPoId.get(row.id)?.locked && !collectionLockInfoByPoId.get(row.id)?.locked && canMutateDocument(row, authStore.currentUser) && !isPendingApproval(row)"
          :show-delete="!shipmentLockInfoByPoId.get(row.id)?.locked && !collectionLockInfoByPoId.get(row.id)?.locked && canMutateDocument(row, authStore.currentUser) && !isPendingApproval(row)"
          @edit="openEditForm(row)"
          @delete="openDeleteApprovalRequest(row)"
        />
      </template>
    </BaseTable>

    <BasePagination
      v-model:current-page="currentPage"
      :total-pages="totalPages"
    />

    <POFormModal
      :open="formOpen"
      :mode="formMode"
      :document="selectedRow"
      :selected-pi="selectedPi"
      :selected-client="selectedClient"
      @open-pi-search="piSearchOpen = true"
      @open-client-search="openClientSearch('form')"
      @close="closeForm"
      @save="handleSave"
    />

    <ApprovalRequestModal
      :open="createApprovalRequestOpen"
      title="PO 등록 결재 요청"
      message="선택한 결재자에게 PO 등록 결재 요청을 전송하시겠습니까?"
      :request-rows="createApprovalRequestRows"
      request-section-title="팀장 결재 정보"
      :document-rows="createApprovalDocumentRows"
      :item-columns="approvalItemColumns"
      :item-rows="createApprovalItemRows"
      :item-summary-rows="createApprovalItemSummaryRows"
      :reference-rows="createApprovalReferenceRows"
      document-section-title="PO 문서 정보"
      item-section-title="연결 PI 기준 품목"
      reference-section-title="연결 PI 정보"
      :helper-text="createHelperText"
      width="max-w-6xl"
      confirm-label="결재 요청"
      @confirm="confirmCreateApprovalRequest"
      @cancel="cancelCreateApprovalRequest"
    />

    <ApprovalRequestModal
      :open="editApprovalRequestOpen"
      title="PO 수정 결재 요청"
      message="변경 사항을 확인한 뒤 선택한 결재자에게 PO 수정 결재 요청을 전송하시겠습니까?"
      :request-rows="editApprovalRequestRows"
      request-section-title="팀장 결재 정보"
      :document-rows="editApprovalDocumentRows"
      :change-columns="approvalChangeColumns"
      :change-rows="pendingEditRequest?.changeRows ?? []"
      :item-columns="approvalItemColumns"
      :item-rows="editApprovalItemRows"
      :item-summary-rows="editApprovalItemSummaryRows"
      :reference-rows="editApprovalReferenceRows"
      document-section-title="수정 대상 PO 정보"
      change-section-title="변경 사항 비교"
      item-section-title="변경 후 PO 품목 정보"
      reference-section-title="연결 PI 정보"
      helper-text="요청 후 PO는 결재대기 상태가 되며, 승인 전까지 수정 내용이 확정되지 않습니다."
      width="max-w-6xl"
      confirm-label="수정 요청"
      @confirm="confirmEditApprovalRequest"
      @cancel="cancelEditApprovalRequest"
    />

    <ApprovalRequestModal
      :open="deleteApprovalRequestOpen"
      title="PO 삭제 결재 요청"
      message="선택한 PO 문서의 삭제 결재 요청을 전송하시겠습니까?"
      :request-rows="deleteApprovalRequestRows"
      request-section-title="팀장 결재 정보"
      :document-rows="deleteApprovalDocumentRows"
      :item-columns="approvalItemColumns"
      :item-rows="deleteApprovalItemRows"
      :item-summary-rows="deleteApprovalItemSummaryRows"
      :reference-rows="deleteApprovalReferenceRows"
      document-section-title="삭제 대상 PO 정보"
      item-section-title="삭제 대상 PO 품목 정보"
      reference-section-title="연결 PI 정보"
      helper-text="요청 후 PO는 결재대기 상태가 되며, 승인 전까지 실제 삭제되지 않습니다."
      width="max-w-6xl"
      confirm-label="삭제 요청"
      @confirm="confirmDeleteApprovalRequest"
      @cancel="cancelDeleteApprovalRequest"
    />

    <SearchModal
      :open="piSearchOpen"
      title="PI 검색"
      :columns="[
        { key: 'id', label: 'PI번호' },
        { key: 'clientName', label: '거래처명' },
        { key: 'currency', label: '통화' },
        { key: 'deliveryDate', label: '납기일' },
      ]"
      :rows="piRows"
      :search-keyword="piSearchKeyword"
      @update:search-keyword="piSearchKeyword = $event"
      @close="piSearchOpen = false"
      @select="handlePiSelect"
    />

    <SearchModal
      :open="clientSearchOpen"
      title="거래처 검색"
      :columns="clientSearchColumns"
      :rows="clientRows"
      :search-keyword="clientSearchKeyword"
      @update:search-keyword="clientSearchKeyword = $event"
      @close="clientSearchOpen = false"
      @select="handleClientSelect"
    />

    <SearchModal
      :open="codeSearchOpen"
      title="PO번호 검색"
      :columns="[
        { key: 'id', label: 'PO번호' },
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
      :columns="productSearchColumns"
      :rows="productRows"
      :search-keyword="productSearchKeyword"
      @update:search-keyword="productSearchKeyword = $event"
      @close="productSearchOpen = false"
      @select="handleProductSelect"
    />
  </div>
</template>
