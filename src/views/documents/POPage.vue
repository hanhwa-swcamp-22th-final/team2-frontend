<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import ApprovalRequestModal from '@/components/common/ApprovalRequestModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
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
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { useAuthStore } from '@/stores/auth'
import { usePiDocuments } from '@/stores/piDocuments'
import { useToast } from '@/composables/useToast'
import {
  createDeleteApprovalMeta,
  createEditApprovalMeta,
  createRegistrationApprovalMeta,
  DELETE_REQUEST_DOCUMENT_STATUS,
  DELETE_REQUEST_STATUS,
  EDIT_REQUEST_DOCUMENT_STATUS,
  EDIT_REQUEST_STATUS,
  REGISTRATION_DOCUMENT_STATUS,
  REGISTRATION_REQUEST_STATUS,
} from '@/utils/documentApproval'

const router = useRouter()
const authStore = useAuthStore()
const { success, warning } = useToast()

const isAdvancedOpen = ref(false)
const formOpen = ref(false)
const formMode = ref('create')
const selectedRow = ref(null)
const deleteOpen = ref(false)
const approvalRequestOpen = ref(false)
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
const pendingEditRequest = ref(null)

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
const piRowsSource = usePiDocuments()
const clientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아' },
  { id: 'CL002', name: 'TechBridge GmbH', country: '독일' },
  { id: 'CL003', name: 'Pacific Trading Inc.', country: '미국' },
]

const columns = [
  { key: 'id', label: 'PO번호', align: 'center', width: '140px' },
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

const initialRows = [
  {
    id: 'PO26001',
    piId: 'PI26001',
    issueDate: '2026/02/05',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$42,400',
    currency: 'USD',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/04/20',
    sourceDeliveryDate: '2026/04/15',
    deliveryDateOverride: true,
  },
  {
    id: 'PO26002',
    issueDate: '2026/02/20',
    clientName: 'TechBridge GmbH',
    country: '독일',
    itemName: 'H-Beam 482x300x11x15',
    amount: '€68,400',
    manager: '김영업',
    status: '발송',
    deliveryDate: '2026/05/25',
  },
  {
    id: 'PO26003',
    issueDate: '2026/03/03',
    clientName: 'Pacific Trading Inc.',
    country: '미국',
    itemName: 'Lubricant Oil SAE 10W-40',
    amount: '$15,600',
    manager: '정영업',
    status: '초안',
    deliveryDate: '2026/06/05',
  },
]

const rowsData = ref([...initialRows])
const { filters, filteredRows, resetFilters, applyFilters } = useDocumentFilter(rowsData, {
  keywordFields: ['id', 'clientName', 'country', 'itemName', 'amount', 'manager', 'status', 'issueDate', 'deliveryDate'],
  issueDateField: 'issueDate',
  deliveryDateField: 'deliveryDate',
})

const piRows = computed(() => {
  const keyword = piSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return piRowsSource.value
  return piRowsSource.value.filter((row) => [row.id, row.clientName, row.currency, row.deliveryDate].some((value) => value.toLowerCase().includes(keyword)))
})

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource
  return clientRowsSource.filter((row) => [row.id, row.name, row.country].some((value) => value.toLowerCase().includes(keyword)))
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
  selectedPi.value = piRowsSource.value.find((pi) => pi.id === (row.piId || row.linkedPiId || '')) ?? null
  selectedClient.value = clientRowsSource.find((client) => client.name === row.clientName) ?? null
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
  const symbolMap = { USD: '$', EUR: '€', JPY: '¥', KRW: '₩' }
  const symbol = symbolMap[currency] ?? ''
  return `${symbol}${Number(value || 0).toLocaleString()}`
}

function createComparableItem(item) {
  const quantity = parseAmount(item.qty ?? item.quantity)
  const unitPrice = parseAmount(item.unitPrice)
  const amount = parseAmount(item.amount) || quantity * unitPrice

  return {
    name: item.name ?? '',
    qty: quantity,
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
  const matchedClient = clientRowsSource.find((client) => client.name === formValue.clientName)
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

function getCurrentRequesterName() {
  return authStore.currentUser?.name || '김영업'
}

function getDefaultDeleteApprover(row) {
  return row?.approver || '박리드 (영업지원 · 팀장)'
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
  return `PO26${String(rowsData.value.length + 1).padStart(3, '0')}`
}

const createApprovalRequestRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  return [
    { label: '요청 유형', value: '등록 요청' },
    { label: '결재자', value: pendingCreateFormValue.value.approver || '-' },
    { label: '요청자', value: getCurrentRequesterName() },
    { label: '문서 상태', value: REGISTRATION_DOCUMENT_STATUS },
    { label: '요청 상태', value: REGISTRATION_REQUEST_STATUS },
    { label: '요청 시각', value: getRequestedAt() },
  ]
})

const createApprovalDocumentRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)
  const isDeliveryOverride = Boolean(nextRow.deliveryDateOverride && nextRow.sourceDeliveryDate && nextRow.deliveryDate !== nextRow.sourceDeliveryDate)

  return [
    { label: '예정 PO 번호', value: buildNextPoId() },
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
    qty: parseAmount(item.qty) > 0 ? parseAmount(item.qty).toLocaleString() : '-',
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

  return [
    { label: '요청 유형', value: '수정 요청' },
    { label: '결재자', value: pendingEditRequest.value.approver || '-' },
    { label: '요청자', value: getCurrentRequesterName() },
    { label: '문서 상태', value: EDIT_REQUEST_DOCUMENT_STATUS },
    { label: '요청 상태', value: EDIT_REQUEST_STATUS },
    { label: '요청 시각', value: getRequestedAt() },
  ]
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
    qty: item.qty > 0 ? item.qty.toLocaleString() : '-',
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
  if (!selectedRow.value || !deleteOpen.value) return []

  return [
    { label: '요청 유형', value: '삭제 요청' },
    { label: '결재자', value: getDefaultDeleteApprover(selectedRow.value) },
    { label: '요청자', value: getCurrentRequesterName() },
    { label: '문서 상태', value: DELETE_REQUEST_DOCUMENT_STATUS },
    { label: '요청 상태', value: DELETE_REQUEST_STATUS },
    { label: '요청 시각', value: getRequestedAt() },
  ]
})

const deleteApprovalDocumentRows = computed(() => {
  if (!selectedRow.value || !deleteOpen.value) return []

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
  if (!selectedRow.value || !deleteOpen.value) return []

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
  if (!selectedRow.value || !deleteOpen.value) return []

  const snapshot = createComparableSnapshot(selectedRow.value)

  return snapshot.items.map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: item.qty > 0 ? item.qty.toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatAmount(snapshot.currency, item.unitPrice),
    amount: formatAmount(snapshot.currency, item.amount),
    remark: item.remark || '-',
  }))
})

const deleteApprovalItemSummaryRows = computed(() => {
  if (!selectedRow.value || !deleteOpen.value) return []

  const snapshot = createComparableSnapshot(selectedRow.value)

  return [
    { label: '품목 건수', value: `${snapshot.items.length}건` },
    { label: '총액', value: snapshot.amount, emphasis: true },
  ]
})

function confirmCreateApprovalRequest() {
  if (!pendingCreateFormValue.value) return

  const nextRow = buildRowPayload(pendingCreateFormValue.value)
  const requesterName = getCurrentRequesterName()
  const requestedAt = getRequestedAt()

  rowsData.value = [
    {
      id: buildNextPoId(),
      ...nextRow,
      manager: requesterName,
      ...createRegistrationApprovalMeta({
        approver: pendingCreateFormValue.value.approver,
        requesterName,
        requestedAt,
      }),
    },
    ...rowsData.value,
  ]

  approvalRequestOpen.value = false
  pendingCreateFormValue.value = null
  formOpen.value = false
  selectedPi.value = null
  selectedClient.value = null
  success('PO 등록 결재 요청이 전송되었습니다.')
}

function cancelCreateApprovalRequest() {
  approvalRequestOpen.value = false
}

function confirmEditApprovalRequest() {
  if (!pendingEditRequest.value) return

  const requesterName = getCurrentRequesterName()
  const requestedAt = getRequestedAt()

  rowsData.value = rowsData.value.map((row) => (
    row.id === pendingEditRequest.value.id
      ? {
        ...row,
        ...pendingEditRequest.value.nextRow,
        ...createEditApprovalMeta({
          approver: pendingEditRequest.value.approver || row.approver || '',
          requesterName,
          requestedAt,
        }),
      }
      : row
  ))

  editApprovalRequestOpen.value = false
  pendingEditRequest.value = null
  formOpen.value = false
  selectedPi.value = null
  selectedClient.value = null
  success('PO 수정 결재 요청이 전송되었습니다.')
}

function cancelEditApprovalRequest() {
  editApprovalRequestOpen.value = false
}

function handleSave(formValue) {
  if (formMode.value === 'create') {
    pendingCreateFormValue.value = { ...formValue }
    approvalRequestOpen.value = true
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

  pendingEditRequest.value = {
    id: selectedRow.value?.id,
    approver: formValue.approver || '',
    nextRow,
    revisedSnapshot,
    changeRows,
  }
  editApprovalRequestOpen.value = true
}

function openDeleteModal(row) {
  selectedRow.value = row
  deleteOpen.value = true
}

function confirmDelete() {
  if (!selectedRow.value) return

  const requesterName = getCurrentRequesterName()
  const requestedAt = getRequestedAt()

  rowsData.value = rowsData.value.map((row) => (
    row.id === selectedRow.value?.id
      ? {
        ...row,
        ...createDeleteApprovalMeta({
          approver: getDefaultDeleteApprover(selectedRow.value),
          requesterName,
          requestedAt,
        }),
      }
      : row
  ))

  success(`${selectedRow.value?.id} 삭제 결재 요청이 전송되었습니다.`)
  deleteOpen.value = false
  selectedRow.value = null
}

function goToDetail(id) {
  router.push({ name: 'po-detail', params: { id } })
}

function handlePiSelect(pi) {
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
    <PageHeader title="PO 관리" icon-class="fas fa-file-contract">
      <template #actions>
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
      :open="approvalRequestOpen"
      title="PO 등록 결재 요청"
      message="선택한 결재자에게 PO 등록 결재 요청을 전송하시겠습니까?"
      :request-rows="createApprovalRequestRows"
      :document-rows="createApprovalDocumentRows"
      :item-columns="approvalItemColumns"
      :item-rows="createApprovalItemRows"
      :item-summary-rows="createApprovalItemSummaryRows"
      :reference-rows="createApprovalReferenceRows"
      document-section-title="PO 문서 정보"
      item-section-title="연결 PI 기준 품목"
      reference-section-title="연결 PI 정보"
      helper-text="요청 후 PO는 결재대기 상태로 등록되며, 승인 전까지 확정 처리되지 않습니다."
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
      :open="deleteOpen"
      title="PO 삭제 결재 요청"
      message="선택한 PO 문서의 삭제 결재 요청을 전송하시겠습니까?"
      :request-rows="deleteApprovalRequestRows"
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
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
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
