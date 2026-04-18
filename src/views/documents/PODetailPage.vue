<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ApprovalRequestModal from '@/components/common/ApprovalRequestModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { formatRevisionEntry } from '@/utils/revisionFormat'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import PODocumentTemplate from '@/components/domain/document/PODocumentTemplate.vue'
import POFormModal from '@/components/domain/document/POFormModal.vue'
import ProductionOrderIssueModal from '@/components/domain/document/ProductionOrderIssueModal.vue'
import {
  requestPoModification,
  validatePoDeletable,
  requestPoDeletion,
  deletePurchaseOrderDraft,
  cancelPurchaseOrderApproval,
  generateProductionOrder,
} from '@/api/documents'
import { useSearchModalLookups } from '@/composables/useSearchModalLookups'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useCiDocuments } from '@/stores/ciDocuments'
import { usePiDocuments } from '@/stores/piDocuments'
import { usePlDocuments } from '@/stores/plDocuments'
import { loadPoDocuments, usePoDocuments } from '@/stores/poDocuments'
import { loadProductionOrderDocuments, useProductionOrderDocuments } from '@/stores/productionOrderDocuments'
import { useShipmentOrderDocuments } from '@/stores/shipmentOrderDocuments'
import { useShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'
import {
  buildApprovalInfoRows,
  buildApprovalRequestRows,
  DELETE_REQUEST_DOCUMENT_STATUS,
  DELETE_REQUEST_STATUS,
  EDIT_REQUEST_DOCUMENT_STATUS,
  EDIT_REQUEST_STATUS,
} from '@/utils/documentApproval'
import { recordDocumentEmailActivities } from '@/utils/documentActivityEmail'
import { openDocumentOutputByType } from '@/utils/documentOutput'
import {
  formatPiPoSelectionMessage,
  formatPoShipmentLockMessage,
  getPiPoSelectionInfo,
  getPoShipmentLockInfo,
  resolvePoShipmentDocumentStatus,
} from '@/utils/documentShipmentLock'
import { formatReferenceDocumentStatus } from '@/utils/referenceDocumentStatus'
import { clientSearchColumns } from '@/utils/searchModalColumns'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { info, success, warning, error } = useToast()

const previewOpen = ref(false)
const formOpen = ref(false)
const editConfirmOpen = ref(false)
const editApprovalRequestOpen = ref(false)
const deleteApprovalRequestOpen = ref(false)
const productionIssueConfirmOpen = ref(false)
const piSearchOpen = ref(false)
const piSearchKeyword = ref('')
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedPi = ref(null)
const selectedClient = ref(null)
const pendingEditRequest = ref(null)
const ciDocuments = useCiDocuments()
const piDocuments = usePiDocuments()
const plDocuments = usePlDocuments()
const poDocuments = usePoDocuments()
const productionOrderDocuments = useProductionOrderDocuments()
const shipmentOrderDocuments = useShipmentOrderDocuments()
const shipmentStatusDocuments = useShipmentStatusDocuments()

const { createClientRows } = useSearchModalLookups()

const isTeamLeader = computed(() => Number(authStore.currentUser?.positionId) === 1)

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

// PO 는 결재 확정(CONFIRMED) PI 만 연결 가능. 초안·결재대기·수정요청 상태의 PI 가
// 드롭다운에 노출되면 결재받지 않은 초안으로 PO 수정이 가능해지므로 프론트에서 먼저 차단.
function isConfirmedPi(row) {
  const status = String(row?.status ?? '').trim().toLowerCase()
  return status === 'confirmed' || status === '확정'
}

const availablePiRows = computed(() => (
  piDocuments.value.filter((row) => (
    isConfirmedPi(row)
    && getPiPoSelectionInfo(
      row,
      poDocuments.value,
      shipmentOrderDocuments.value,
      shipmentStatusDocuments.value,
      productionOrderDocuments.value,
      ciDocuments.value,
      plDocuments.value,
      String(route.params.id ?? ''),
    ).selectable
  ))
))

const piRows = computed(() => {
  const keyword = piSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return availablePiRows.value
  return availablePiRows.value.filter((row) => (
    [row.id, row.clientName, row.currency, row.deliveryDate]
      .some((value) => String(value ?? '').toLowerCase().includes(keyword))
  ))
})

const clientRows = createClientRows(clientSearchKeyword)

function parseNumericValue(value) {
  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatCurrencyValue(currency, value) {
  const symbolMap = { KRW: '₩', USD: '$', EUR: '€', JPY: '¥' }
  const symbol = symbolMap[currency] ?? `${currency} `
  return `${symbol}${Math.round(value).toLocaleString('en-US')}`
}

const totalItemQuantity = computed(() => (
  detail.value?.items.reduce((sum, item) => sum + parseNumericValue(item.quantity ?? item.qty), 0) ?? 0
))

const quantityUnitLabel = computed(() => detail.value?.items?.[0]?.unit || '')
const itemAmountSummary = computed(() => detail.value?.totalAmount || '-')

function buildLinkedDocuments(row) {
  const currentLinks = [...(row.linkedDocuments ?? [])]
  const linkedPi = piDocuments.value.find((pi) => pi.id === (row.piId || row.linkedPiId))
  const linkedProductionOrder = productionOrderDocuments.value.find((production) => production.poId === row.id)

  // 스냅샷 status 는 PO 생성 시점 기준이라 PI 가 이후 확정돼도 stale 유지.
  // live store 에서 찾은 문서가 이미 링크에 있으면 최신 status 로 덮어쓴다.
  if (linkedPi) {
    const idx = currentLinks.findIndex((document) => document.id === linkedPi.id)
    if (idx === -1) currentLinks.unshift({ id: linkedPi.id, status: linkedPi.status })
    else currentLinks[idx] = { ...currentLinks[idx], status: linkedPi.status }
  }

  if (linkedProductionOrder) {
    const idx = currentLinks.findIndex((document) => document.id === linkedProductionOrder.id)
    if (idx === -1) currentLinks.push({ id: linkedProductionOrder.id, status: linkedProductionOrder.status })
    else currentLinks[idx] = { ...currentLinks[idx], status: linkedProductionOrder.status }
  }

  return currentLinks
}

function getCurrentRequesterName() {
  // 백엔드 user 객체는 userName 필드를 사용한다.
  return authStore.currentUser?.userName || authStore.currentUser?.name || '미지정'
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

function getDefaultDeleteApprover(row) {
  return row?.approver || ''
}

function createComparableItem(item) {
  const quantity = parseNumericValue(item.qty ?? item.quantity)
  const unitPrice = parseNumericValue(item.unitPrice)
  const amount = parseNumericValue(item.amount) || quantity * unitPrice

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

function createComparableSnapshot(source) {
  const linkedPi = piDocuments.value.find((row) => row.id === (source.piId || source.linkedPiId))
  const currency = source.currency || linkedPi?.currency || 'USD'
  const items = (source.items?.length ? source.items : linkedPi?.items ?? []).map(createComparableItem)
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const issueDate = source.issueDate || '-'
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
    amount: formatCurrencyValue(currency, totalAmount),
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

function normalizeDetail(row) {
  if (!row) return null

  const currency = row.currency || 'USD'
  const items = (row.items ?? []).map((item) => ({
    name: item.name ?? '',
    quantity: String(item.qty ?? item.quantity ?? ''),
    unit: item.unit ?? 'EA',
    unitPrice: formatCurrencyValue(currency, parseNumericValue(item.unitPrice)),
    amount: formatCurrencyValue(currency, parseNumericValue(item.amount)),
    remark: item.remark ?? '',
  }))

  const totalAmountValue = items.reduce((sum, item) => sum + parseNumericValue(item.amount), 0)

  return {
    ...row,
    status: resolvePoShipmentDocumentStatus(
      row.id,
      row.status,
      shipmentOrderDocuments.value,
      shipmentStatusDocuments.value,
    ),
    buyer: row.buyerName || row.buyer || '-',
    incoterms: row.incoterms ? `${row.incoterms}${row.namedPlace ? ` ${row.namedPlace}` : ''}` : '-',
    linkedDocuments: buildLinkedDocuments(row),
    items,
    totalAmount: row.totalAmount || row.amount || formatCurrencyValue(currency, totalAmountValue),
    revisionHistory: row.revisionHistory ?? [],
  }
}

const sourceRow = computed(() => (
  poDocuments.value.find((row) => row.id === route.params.id) ?? null
))

const detail = computed(() => normalizeDetail(sourceRow.value))

// 백엔드 PO 응답의 shipmentStatus 필드 (LEFT JOIN shipments aggregate)
// null=출하전 / preparing=출하준비 / completed=출하완료
const shipmentStatusLabel = computed(() => {
  const raw = sourceRow.value?.shipmentStatus
  if (raw === 'completed') return '출하완료'
  if (raw === 'preparing') return '출하준비'
  return '출하 전'
})

const approvalInfoRows = computed(() => buildApprovalInfoRows(detail.value))
const shipmentLockInfo = computed(() => (
  getPoShipmentLockInfo(
    detail.value?.id,
    shipmentOrderDocuments.value,
    shipmentStatusDocuments.value,
  )
))
const shipmentLockMessage = computed(() => formatPoShipmentLockMessage(shipmentLockInfo.value))
const linkedPiDocument = computed(() => piDocuments.value.find((row) => row.id === (detail.value?.piId || detail.value?.linkedPiId)))
const linkedProductionOrder = computed(() => productionOrderDocuments.value.find((row) => row.poId === detail.value?.id) ?? null)
const canIssueProductionOrder = computed(() => Boolean(detail.value && !linkedProductionOrder.value && !shipmentLockInfo.value.locked))
const productionIssueConfirmRows = computed(() => {
  if (!detail.value) return []

  return [
    { label: '대상 PO 번호', value: detail.value.id },
    { label: '거래처', value: detail.value.clientName || '-' },
    { label: '영업담당자', value: detail.value.manager || '-' },
    { label: '납기일', value: detail.value.deliveryDate || '-' },
    { label: '품목 건수', value: `${detail.value.items?.length ?? 0}건` },
    { label: '총액', value: detail.value.totalAmount || '-' },
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

  if (!revisedSnapshot.piId) return []

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
    unitPrice: formatCurrencyValue(pendingEditRequest.value.revisedSnapshot.currency, item.unitPrice),
    amount: formatCurrencyValue(pendingEditRequest.value.revisedSnapshot.currency, item.amount),
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
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  return buildApprovalRequestRows({
    approver: getDefaultDeleteApprover(sourceRow.value),
    requesterName: getCurrentRequesterName(),
    requestedAt: getRequestedAt(),
    documentStatus: DELETE_REQUEST_DOCUMENT_STATUS,
    requestStatus: DELETE_REQUEST_STATUS,
    requestTypeLabel: '삭제 요청',
    applyPolicy: '팀장 승인 후 PO가 삭제 처리됩니다.',
  })
})

const deleteApprovalDocumentRows = computed(() => {
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(sourceRow.value)

  return [
    { label: '대상 PO 번호', value: sourceRow.value.id || '-' },
    { label: '현재 상태', value: sourceRow.value.status || '-' },
    { label: '발행일', value: snapshot.issueDate || '-' },
    { label: '납기일', value: snapshot.deliveryDate || '-' },
    { label: '납기 처리', value: snapshot.deliveryMode || '-' },
  ]
})

const deleteApprovalReferenceRows = computed(() => {
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(sourceRow.value)

  if (!snapshot.piId) return []

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
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(sourceRow.value)

  return snapshot.items.map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: item.qty > 0 ? item.qty.toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatCurrencyValue(snapshot.currency, item.unitPrice),
    amount: formatCurrencyValue(snapshot.currency, item.amount),
    remark: item.remark || '-',
  }))
})

const deleteApprovalItemSummaryRows = computed(() => {
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(sourceRow.value)

  return [
    { label: '품목 건수', value: `${snapshot.items.length}건` },
    { label: '총액', value: snapshot.amount, emphasis: true },
  ]
})

const previewFields = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '통화', value: detail.value.currency },
    { label: '인코텀즈', value: detail.value.incoterms },
    { label: '납기일', value: detail.value.deliveryDate },
    { label: '발행일', value: detail.value.issueDate },
  ]
})

const summaryRows = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '영업담당자', value: detail.value.manager || '-' },
    { label: '통화 / 총액', value: `${detail.value.currency} / ${detail.value.totalAmount}` },
    { label: '납기일', value: detail.value.deliveryDate || '-' },
  ]
})

const documentNote = computed(() => detail.value?.remarks || '-')

function goBack() {
  router.push({ name: 'po' })
}

function openPreview() {
  previewOpen.value = true
}

function handleEdit() {
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    return
  }

  selectedPi.value = null
  selectedClient.value = null
  formOpen.value = true
}

async function handleDelete() {
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    return
  }

  try {
    await validatePoDeletable(sourceRow.value?.id)
  } catch (e) {
    error(e.response?.data?.message || e.response?.data || '후속 문서가 존재하여 삭제할 수 없습니다.')
    return
  }

  // DRAFT 는 결재 없이 바로 삭제 (백엔드 DELETE /purchase-orders/{id}).
  const statusKey = String(sourceRow.value?.status ?? '').trim().toLowerCase()
  const isDraft = statusKey === 'draft' || statusKey === '초안'
  if (isDraft) {
    try {
      await deletePurchaseOrderDraft(sourceRow.value.id)
      await loadPoDocuments()
      success(`${sourceRow.value.id} 초안 PO가 삭제되었습니다.`)
      router.back()
    } catch (e) {
      error(e.response?.data?.message || '초안 삭제 중 오류가 발생했습니다.')
    }
    return
  }

  if (isTeamLeader.value) {
    try {
      const userId = authStore.currentUser?.userId
      await requestPoDeletion({ poId: sourceRow.value.id, userId })
      await loadPoDocuments()
      success(`${sourceRow.value.id} PO가 삭제되었습니다.`)
    } catch (e) {
      error(e.response?.data?.message || '삭제 처리 중 오류가 발생했습니다.')
    }
    return
  }

  deleteApprovalRequestOpen.value = true
}

function handlePrint() {
  if (!detail.value) return
  openDocumentOutputByType('PO', detail.value, true)
}

function handlePdfDownload() {
  if (!detail.value) return
  const opened = openDocumentOutputByType('PO', detail.value, false)
  if (opened) {
    info('브라우저 인쇄 창에서 "PDF로 저장"을 선택하세요.', 'PDF')
  }
}

function handlePreviewPrint() {
  previewOpen.value = false
  handlePrint()
}

function formatSlashDate(value) {
  return value ? value.replaceAll('-', '/') : '-'
}

function handleSave(formValue) {
  if (!sourceRow.value) return
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    formOpen.value = false
    return
  }

  const linkedPi = piDocuments.value.find((row) => row.id === formValue.linkedPiId)
  const currency = linkedPi?.currency || formValue.currency || sourceRow.value.currency || 'USD'
  const items = (linkedPi?.items ?? sourceRow.value.items ?? []).map((item) => ({
    name: item.name ?? '',
    qty: String(item.qty ?? item.quantity ?? ''),
    unit: item.unit ?? 'EA',
    unitPrice: String(parseNumericValue(item.unitPrice)),
    amount: String(parseNumericValue(item.amount)),
    remark: item.remark ?? '',
  }))
  const totalAmount = items.reduce((sum, item) => sum + parseNumericValue(item.amount), 0)
  const nextRow = {
    piId: formValue.linkedPiId || '',
    linkedPiId: formValue.linkedPiId || '',
    clientName: linkedPi?.clientName || formValue.clientName || sourceRow.value.clientName,
    clientAddress: linkedPi?.clientAddress || sourceRow.value.clientAddress || '',
    buyerName: linkedPi?.buyerName || sourceRow.value.buyerName || '',
    currency,
    country: linkedPi?.country || sourceRow.value.country || '-',
    itemName: items[0]?.name || sourceRow.value.itemName,
    amount: formatCurrencyValue(currency, totalAmount),
    totalAmount: formatCurrencyValue(currency, totalAmount),
    incoterms: linkedPi?.incoterms || sourceRow.value.incoterms || '',
    namedPlace: linkedPi?.namedPlace || sourceRow.value.namedPlace || '',
    deliveryDate: formatSlashDate(formValue.deliveryDate),
    sourceDeliveryDate: formatSlashDate(formValue.sourceDeliveryDate),
    deliveryDateOverride: Boolean(formValue.linkedPiId && formValue.deliveryDateOverride),
    approver: formValue.approver || sourceRow.value.approver || '',
    items,
  }

  const originalSnapshot = createComparableSnapshot(sourceRow.value)
  const revisedSnapshot = createComparableSnapshot({
    id: sourceRow.value.id,
    ...sourceRow.value,
    ...nextRow,
  })
  const changeRows = buildChangeRows(originalSnapshot, revisedSnapshot)

  if (!changeRows.length) {
    warning('변경된 내용이 없습니다.')
    return
  }

  pendingEditRequest.value = {
    id: sourceRow.value.id,
    approver: formValue.approver || sourceRow.value.approver || '',
    nextRow,
    revisedSnapshot,
    changeRows,
  }
  editConfirmOpen.value = true
}

function openPiSearch() {
  piSearchOpen.value = true
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function handlePiSelect(pi) {
  const selectionInfo = getPiPoSelectionInfo(
    pi,
    poDocuments.value,
    shipmentOrderDocuments.value,
    shipmentStatusDocuments.value,
    productionOrderDocuments.value,
    ciDocuments.value,
    plDocuments.value,
    String(route.params.id ?? ''),
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
  selectedClient.value = client
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function goToLinkedDocument(documentId) {
  if (documentId?.startsWith('PI')) {
    router.push({ name: 'pi-detail', params: { id: documentId } })
    return
  }

  if (documentId?.startsWith('MO')) {
    router.push({ name: 'production-detail', params: { id: documentId } })
    return
  }

  if (documentId?.startsWith('SO')) {
    router.push({ name: 'shipment-order-detail', params: { id: documentId } })
  }
}

function openProductionIssueConfirm() {
  if (!canIssueProductionOrder.value) return
  productionIssueConfirmOpen.value = true
}

function closeProductionIssueConfirm() {
  productionIssueConfirmOpen.value = false
}

function formatTodaySlashDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

function createNextProductionOrderId() {
  const maxNumber = productionOrderDocuments.value.reduce((max, row) => {
    const numeric = Number.parseInt(String(row.id).replace(/[^0-9]/g, ''), 10)
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max
  }, 2026000)

  return `MO${String(maxNumber + 1)}`
}

// 발행 모달 확인 시 호출 — payload: { assigneeUserId, assigneeName } | null.
// 백엔드가 실제 DB 레코드를 생성하므로 저장 후 store refetch.
const productionIssueSaving = ref(false)
async function confirmIssueProductionOrder(payload) {
  if (!sourceRow.value || !canIssueProductionOrder.value) return
  if (productionIssueSaving.value) return

  const poId = sourceRow.value.id
  productionIssueSaving.value = true
  try {
    await generateProductionOrder(poId, payload ?? null)
  } catch (e) {
    productionIssueSaving.value = false
    error(e.response?.data?.message || '생산지시서 발행 중 오류가 발생했습니다.')
    return
  }

  await loadProductionOrderDocuments()
  productionIssueSaving.value = false
  productionIssueConfirmOpen.value = false

  // 메일 이력은 best-effort (백엔드가 자동 발송하지만 활동 로그는 이 경로 유지).
  try {
    await recordDocumentEmailActivities({
      clientName: sourceRow.value.clientName,
      poId,
      sender: authStore.currentUser?.userName || authStore.currentUser?.name || '-',
      title: `[SalesBoost] ${poId} 생산지시서 발송`,
      types: ['생산지시서'],
      attachments: [],
    })
  } catch (emailError) {
    console.error('생산지시서 메일 발송 이력 기록 실패', emailError)
  }

  // 방금 발행된 지시서 상세로 이동 (poId 매칭 + 생성일 최신).
  const latest = productionOrderDocuments.value
      .filter((p) => p.poId === poId)
      .sort((a, b) => String(b.id).localeCompare(String(a.id)))[0]
  success(`${latest?.id ?? ''} 생산지시서가 발행되었습니다.`.trim())
  if (latest?.id) {
    await nextTick()
    router.push({ name: 'production-detail', params: { id: latest.id } })
  }
}

function confirmEditRequestIntent() {
  editConfirmOpen.value = false
  editApprovalRequestOpen.value = true
}

function cancelEditRequestIntent() {
  editConfirmOpen.value = false
  pendingEditRequest.value = null
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
    success(`${sourceRow.value?.id ?? ''} 수정 결재 요청이 전송되었습니다.`)
  } catch (e) {
    error(e.response?.data?.message || 'PO 수정 결재 요청 중 오류가 발생했습니다.')
  }
}

function cancelEditApprovalRequest() {
  editApprovalRequestOpen.value = false
}

async function confirmDeleteApprovalRequest() {
  if (!sourceRow.value) return
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    deleteApprovalRequestOpen.value = false
    return
  }

  try {
    const userId = authStore.currentUser?.userId
    await requestPoDeletion({ poId: sourceRow.value.id, userId })
    await loadPoDocuments()
    success(`${sourceRow.value.id} 삭제 결재 요청이 전송되었습니다.`)
  } catch (e) {
    error(e.response?.data?.message || '삭제 결재 요청 중 오류가 발생했습니다.')
  }

  deleteApprovalRequestOpen.value = false
}

function cancelDeleteApprovalRequest() {
  deleteApprovalRequestOpen.value = false
}

// APPROVAL_PENDING 상태에서 요청자 본인이 결재 요청을 취소.
async function handleCancelApproval() {
  if (!sourceRow.value) return
  try {
    await cancelPurchaseOrderApproval(sourceRow.value.id)
    await loadPoDocuments()
    success(`${sourceRow.value.id} 결재 요청이 취소되었습니다.`)
  } catch (e) {
    error(e.response?.data?.message || '결재 요청 취소 중 오류가 발생했습니다.')
  }
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6">
      <DetailPageHeader :title="detail.id" :status="detail.status" @back="goBack">
        <template #actions>
          <BaseButton
            v-if="canIssueProductionOrder && !['결재대기','pending_approval','APPROVAL_PENDING'].includes(detail.status)"
            variant="secondary"
            size="sm"
            @click="openProductionIssueConfirm"
          >
            <template #leading>
              <i class="fas fa-industry text-xs" aria-hidden="true"></i>
            </template>
            생산지시서 발행
          </BaseButton>
          <BaseButton v-if="!shipmentLockInfo.locked && !['결재대기','pending_approval','APPROVAL_PENDING'].includes(detail.status)" size="sm" @click="handleEdit">
            <template #leading>
              <i class="fas fa-edit text-xs" aria-hidden="true"></i>
            </template>
            {{ ['확정','confirmed','CONFIRMED'].includes(detail.status) ? '수정요청' : '수정' }}
          </BaseButton>
          <BaseButton v-if="!shipmentLockInfo.locked && !['결재대기','pending_approval','APPROVAL_PENDING'].includes(detail.status)" variant="secondary" size="sm" @click="handleDelete">
            <template #leading>
              <i class="fas fa-trash text-xs" aria-hidden="true"></i>
            </template>
            {{ ['확정','confirmed','CONFIRMED'].includes(detail.status) ? '삭제요청' : '삭제' }}
          </BaseButton>
          <BaseButton
            v-if="['결재대기','pending_approval','APPROVAL_PENDING'].includes(detail.status)"
            variant="secondary"
            size="sm"
            @click="handleCancelApproval"
          >
            <template #leading>
              <i class="fas fa-undo text-xs" aria-hidden="true"></i>
            </template>
            결재 요청 취소
          </BaseButton>
          <BaseButton variant="secondary" size="sm" @click="openPreview">
            <template #leading>
              <i class="fas fa-eye text-xs text-brand-500" aria-hidden="true"></i>
            </template>
            미리보기
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

    <div class="mb-6 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-4">
      <div
        v-for="row in summaryRows"
        :key="row.label"
        class="border-b border-slate-200 px-5 py-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
      >
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ row.label }}</div>
        <div class="mt-1 text-sm font-semibold text-slate-900">{{ row.value }}</div>
      </div>
    </div>

    <div
      v-if="shipmentLockInfo.locked"
      class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
    >
      <div class="font-semibold">출하완료 문서가 연결되어 있어 수정 및 삭제가 제한됩니다.</div>
      <div class="mt-1">{{ shipmentLockMessage }}</div>
      <div class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="reference in shipmentLockInfo.references"
          :key="`${reference.type}-${reference.id}`"
          class="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
        >
          {{ reference.type }} {{ reference.id }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">문서 기본정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span class="text-slate-500">거래처</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.clientName }}</div>
            </div>
            <div>
              <span class="text-slate-500">영문주소</span>
              <div class="mt-0.5 break-words">{{ detail.clientAddress || '-' }}</div>
            </div>
            <div>
              <span class="text-slate-500">국가</span>
              <div class="mt-0.5">{{ detail.country || '-' }}</div>
            </div>
            <div>
              <span class="text-slate-500">발행일</span>
              <div class="mt-0.5">{{ detail.issueDate }}</div>
            </div>
            <div>
              <span class="text-slate-500">PO 번호</span>
              <div class="mt-0.5 font-medium">{{ detail.id }}</div>
            </div>
            <div>
              <span class="text-slate-500">출하 진행</span>
              <div class="mt-0.5 font-medium">{{ shipmentStatusLabel }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">거래 조건 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span class="text-slate-500">통화</span>
              <div class="mt-0.5">{{ detail.currency }}</div>
            </div>
            <div>
              <span class="text-slate-500">총액</span>
              <div class="mt-0.5 font-semibold text-slate-900">{{ detail.totalAmount }}</div>
            </div>
            <div>
              <span class="text-slate-500">인코텀즈</span>
              <div class="mt-0.5">{{ detail.incoterms }}</div>
            </div>
            <div>
              <span class="text-slate-500">납기일</span>
              <div class="mt-0.5">{{ detail.deliveryDate }}</div>
            </div>
            <div>
              <span class="text-slate-500">PI 기준 납기일</span>
              <div class="mt-0.5">{{ detail.sourceDeliveryDate || linkedPiDocument?.deliveryDate || '-' }}</div>
            </div>
            <div>
              <span class="text-slate-500">납기 처리</span>
              <div class="mt-0.5">{{ detail.deliveryDateOverride ? 'PO 별도 조정' : 'PI 기준값 사용' }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">품목 내역</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="p-3 text-left">품목</th>
                  <th class="p-3 text-center">단위</th>
                  <th class="p-3 text-right">수량</th>
                  <th class="p-3 text-right">단가</th>
                  <th class="p-3 text-right">금액</th>
                  <th class="p-3 text-left">비고</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in detail.items" :key="`${detail.id}-${item.name}`">
                  <td class="p-3">{{ item.name }}</td>
                  <td class="p-3 text-center">{{ item.unit || '-' }}</td>
                  <td class="p-3 text-right">{{ item.quantity }}</td>
                  <td class="p-3 text-right">{{ item.unitPrice }}</td>
                  <td class="p-3 text-right font-semibold">{{ item.amount }}</td>
                  <td class="p-3 text-slate-600">{{ item.remark || '-' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-slate-200 bg-slate-50">
                  <td class="p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">합계</td>
                  <td></td>
                  <td class="p-3 text-right font-semibold text-slate-900">
                    {{ totalItemQuantity.toLocaleString('ko-KR') }}{{ quantityUnitLabel ? ` ${quantityUnitLabel}` : '' }}
                  </td>
                  <td></td>
                  <td class="p-3 text-right text-base font-extrabold text-slate-900">{{ itemAmountSummary }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">비고</h3>
          <p class="text-sm leading-6 text-slate-700">{{ documentNote }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">결재 정보</h3>
          <div v-if="approvalInfoRows.length" class="space-y-3 text-sm">
            <div
              v-for="row in approvalInfoRows"
              :key="row.label"
              class="flex items-start justify-between gap-3"
            >
              <span class="text-slate-500">{{ row.label }}</span>
              <div class="text-right">
                <StatusBadge
                  v-if="row.label === '상태'"
                  :value="row.value"
                />
                <span v-else class="break-words font-medium text-slate-700">{{ row.value }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-slate-400">결재 요청 이력 없음</div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">참조 문서</h3>
          <div class="space-y-2 text-sm">
            <button
              v-for="document in detail.linkedDocuments"
              :key="document.id"
              type="button"
              class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50"
              @click="goToLinkedDocument(document.id)"
            >
              <i
                :class="document.id.startsWith('PI') ? 'fas fa-file-invoice' : 'fas fa-file-export'"
                aria-hidden="true"
              ></i>
              {{ document.id }}
              <StatusBadge :value="document.status" :variant="document.status">
                {{ formatReferenceDocumentStatus(document.id, document.status) }}
              </StatusBadge>
            </button>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">변경 이력</h3>
          </div>
          <div class="space-y-1 text-xs text-slate-400">
            <template v-if="Array.isArray(detail.revisionHistory) && detail.revisionHistory.length">
              <div v-for="(rev, i) in detail.revisionHistory" :key="i" class="rounded border border-slate-100 bg-slate-50 px-2 py-1">
                {{ formatRevisionEntry(rev) }}
              </div>
            </template>
            <span v-else>변경 이력 없음</span>
          </div>
        </div>
      </div>
    </div>

    <DocumentPreviewModal
      :open="previewOpen"
      title="PO 미리보기"
      :document-title="detail.id"
      :fields="previewFields"
      @close="previewOpen = false"
      @download="handlePdfDownload"
    >
      <PODocumentTemplate :document="detail" />
    </DocumentPreviewModal>

    <POFormModal
      :open="formOpen"
      mode="edit"
      :document="{
        id: sourceRow?.id,
        piId: sourceRow?.piId || sourceRow?.linkedPiId || '',
        clientName: sourceRow?.clientName,
        currency: sourceRow?.currency,
        deliveryDate: sourceRow?.deliveryDate,
        sourceDeliveryDate: sourceRow?.sourceDeliveryDate,
        deliveryDateOverride: sourceRow?.deliveryDateOverride,
        approver: sourceRow?.approver,
      }"
      :selected-pi="selectedPi"
      :selected-client="selectedClient"
      @open-pi-search="openPiSearch"
      @open-client-search="openClientSearch"
      @close="formOpen = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="editConfirmOpen"
      title="PO 수정 요청"
      message="해당 PO의 수정 결재 요청을 진행하시겠습니까?"
      :detail="sourceRow?.id || ''"
      confirm-label="수정 요청"
      @confirm="confirmEditRequestIntent"
      @cancel="cancelEditRequestIntent"
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

    <ProductionOrderIssueModal
      :open="productionIssueConfirmOpen"
      :po="sourceRow"
      :saving="productionIssueSaving"
      @confirm="confirmIssueProductionOrder"
      @cancel="closeProductionIssueConfirm"
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
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    PO 문서를 찾을 수 없습니다.
  </div>
</template>
