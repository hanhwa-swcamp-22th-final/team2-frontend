import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchPurchaseOrdersPaged } from '@/api/documents'
import { loadApprovalRequests, pickLatestRequestFor } from './approvalRequests'
import { formatCurrencyAmount } from '@/utils/currencyFormat'
import { formatKstDateTime, formatKstSlashDate } from '@/utils/dateTime'

function formatDate(value) {
  return formatKstSlashDate(value)
}

function formatTimestamp(value) {
  return value ? formatKstDateTime(value) : null
}

function parseJsonSafe(value, fallback = null) {
  if (typeof value !== 'string') return value ?? fallback
  try { return JSON.parse(value) } catch { return fallback }
}

function parseLinkedDocuments(value) {
  if (!value) return []
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return [] }
  }
  return Array.isArray(value) ? value : []
}

function mapPoResponse(row) {
  const items = (row.items ?? []).map((item) => ({
    code: item.itemCode ?? '',
    name: item.itemName,
    qty: String(item.quantity ?? 1),
    quantity: String(item.quantity ?? 1),
    unit: item.unit ?? 'EA',
    unitPrice: String(item.unitPrice ?? 0),
    amount: String(item.amount ?? 0),
    remark: item.remark ?? '',
    // Issue D — 수정 모달 재제출 시 kg 값 유지. 백엔드 응답에 itemWeight 필드가 포함되면 그대로 pass-through.
    itemWeight: item.itemWeight ?? null,
  }))

  return {
    id: row.poId,
    purchaseOrderId: row.purchaseOrderId ?? null,
    managerId: row.managerId ?? null,
    piId: row.piId ?? '',
    linkedPiId: row.piId ?? '',
    issueDate: formatDate(row.issueDate),
    clientName: row.clientName ?? '-',
    clientAddress: row.clientAddress ?? '-',
    buyerName: row.buyerName ?? '-',
    currency: row.currencyCode ?? 'USD',
    country: row.country ?? '-',
    itemName: items[0]?.name ?? row.itemName ?? '-',
    amount: formatCurrencyAmount(row.totalAmount, row.currencyCode),
    totalAmount: formatCurrencyAmount(row.totalAmount, row.currencyCode),
    incoterms: row.incotermsCode ?? 'FOB',
    namedPlace: row.namedPlace ?? '',
    manager: row.managerName ?? '-',
    status: row.status ?? '확정',
    deliveryDate: formatDate(row.deliveryDate),
    sourceDeliveryDate: formatDate(row.sourceDeliveryDate ?? row.deliveryDate),
    deliveryDateOverride: row.deliveryDateOverride ?? false,
    remarks: row.remarks ?? '-',
    approvalStatus: row.approvalStatus ?? null,
    requestStatus: row.requestStatus ?? null,
    approvalAction: row.approvalAction ?? null,
    approvalRequestedBy: row.approvalRequestedBy ?? null,
    approvalRequestedAt: formatTimestamp(row.approvalRequestedAt),
    approvalReview: row.approvalReview ? parseJsonSafe(row.approvalReview) : null,
    itemsSnapshot: row.itemsSnapshot ? parseJsonSafe(row.itemsSnapshot) : null,
    linkedDocuments: parseLinkedDocuments(row.linkedDocuments),
    revisionHistory: row.revisionHistory ? parseJsonSafe(row.revisionHistory, []) : [],
    // 백엔드 PO 응답 enrich (LEFT JOIN shipments aggregate). null=출하전 / preparing / completed.
    // sales 가 출하 모듈 직접 권한 없이도 본인 PO 의 출하 진행을 PO 화면에서 확인 가능.
    shipmentStatus: row.shipmentStatus ?? null,
    items,
  }
}

const poDocuments = ref([])
const poPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
let loading = null

export async function loadPoDocuments({ page = 0, size = 1000 } = {}) {
  try {
    const [{ content, page: pageInfo }] = await Promise.all([
      fetchPurchaseOrdersPaged({ page, size }),
      loadApprovalRequests(),
    ])
    const mapped = (Array.isArray(content) ? content : []).map(mapPoResponse)
    poDocuments.value = mapped.map((row) => attachApprovalInfo(row))
    poPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load PO documents:', e)
  }
}

function attachApprovalInfo(row) {
  const req = pickLatestRequestFor('PO', row.id)
  if (!req) return row
  const statusLower = String(req.status ?? '').toLowerCase()
  return {
    ...row,
    approvalRequestId: req.approvalRequestId ?? row.approvalRequestId ?? null,
    requestStatus: row.requestStatus ?? req.requestType ?? null,
    requestType: req.requestType ?? row.requestType ?? null,
    approvalStatus: row.approvalStatus ?? req.status ?? null,
    approverId: req.approverId ?? row.approverId ?? null,
    approverName: req.approverName ?? row.approverName ?? null,
    approvalRequestedAt: row.approvalRequestedAt ?? req.requestedAt ?? null,
    approvalReview: req.approvalReview ?? req.reviewSnapshot ?? row.approvalReview ?? null,
    approvalRejectReason:
      statusLower === 'rejected' ? (req.reason ?? row.approvalRejectReason ?? null) : (row.approvalRejectReason ?? null),
  }
}

export function usePoDocuments() {
  if (!loading && useAuthStore().isLoggedIn) {
    loading = loadPoDocuments()
  }
  return poDocuments
}

export function usePoPageInfo() {
  return poPageInfo
}

export function clearPoDocuments() {
  poDocuments.value = []
  poPageInfo.value = { size: 1000, number: 0, totalElements: 0, totalPages: 0 }
  loading = null
}
