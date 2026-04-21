import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchProformaInvoicesPaged } from '@/api/documents'
import { loadApprovalRequests, pickLatestRequestFor } from './approvalRequests'
import { formatCurrencyAmount } from '@/utils/currencyFormat'
import { formatKstDateTime, formatKstSlashDate } from '@/utils/dateTime'

function tryParseJson(value, fallback = null) {
  if (typeof value !== 'string') return value ?? fallback
  try { return JSON.parse(value) } catch { return fallback }
}

function formatTimestamp(value) {
  return value ? formatKstDateTime(value) : null
}

function formatDate(value) {
  return formatKstSlashDate(value)
}

function mapPiResponse(row) {
  const items = (row.items ?? []).map((item) => ({
    code: item.itemCode ?? '',
    name: item.itemName,
    qty: String(item.quantity ?? 1),
    quantity: String(item.quantity ?? 1),
    unit: item.unit ?? 'EA',
    unitPrice: String(item.unitPrice ?? 0),
    amount: String(item.amount ?? 0),
    remark: item.remark ?? '',
  }))

  return {
    id: row.piId,
    managerId: row.managerId ?? null,
    issueDate: formatDate(row.issueDate),
    clientName: row.clientName ?? '-',
    clientAddress: row.clientAddress ?? '-',
    buyerName: row.buyerName ?? '-',
    currency: row.currencyCode ?? 'USD',
    country: row.country ?? '-',
    itemName: items[0]?.name ?? row.itemName ?? '-',
    amount: formatCurrencyAmount(row.totalAmount, row.currencyCode),
    incoterms: row.incotermsCode ?? 'FOB',
    namedPlace: row.namedPlace ?? '',
    manager: row.managerName ?? '-',
    status: row.status ?? '확정',
    deliveryDate: formatDate(row.deliveryDate),
    remarks: row.remarks ?? '-',
    approvalStatus: row.approvalStatus ?? null,
    requestStatus: row.requestStatus ?? null,
    approvalAction: row.approvalAction ?? null,
    approvalRequestedBy: row.approvalRequestedBy ?? null,
    approvalRequestedAt: formatTimestamp(row.approvalRequestedAt),
    approvalReview: row.approvalReview ? (typeof row.approvalReview === 'string' ? tryParseJson(row.approvalReview) : row.approvalReview) : null,
    itemsSnapshot: row.itemsSnapshot ? (typeof row.itemsSnapshot === 'string' ? tryParseJson(row.itemsSnapshot) : row.itemsSnapshot) : null,
    linkedDocuments: row.linkedDocuments ? (typeof row.linkedDocuments === 'string' ? tryParseJson(row.linkedDocuments, []) : row.linkedDocuments) : [],
    revisionHistory: row.revisionHistory ? (typeof row.revisionHistory === 'string' ? tryParseJson(row.revisionHistory, []) : row.revisionHistory) : [],
    items,
  }
}

const piDocuments = ref([])
const piPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
let loading = null

/**
 * PI 목록 로드. 현재 목록 화면은 클라이언트 사이드 키워드 검색/필터를 사용하므로
 * 기본 size=1000 으로 한 번에 로드한다. 서버사이드 페이지네이션이 필요한 호출자는
 * `{ page, size }` 를 명시적으로 넘기면 된다.
 */
export async function loadPiDocuments({ page = 0, size = 1000 } = {}) {
  try {
    // PI 목록과 결재 요청 리스트를 동시에 가져와, 각 PI 에 결재자/반려사유를 병합한다.
    // 백엔드 proforma_invoices 뷰에는 approverId/reason 이 없어서 approval-requests 를
    // 별도 조회해 documentId 로 매칭시킨다.
    const [{ content, page: pageInfo }] = await Promise.all([
      fetchProformaInvoicesPaged({ page, size }),
      loadApprovalRequests(),
    ])
    const mapped = (Array.isArray(content) ? content : []).map(mapPiResponse)
    piDocuments.value = mapped.map((row) => attachApprovalInfo(row))
    piPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load PI documents:', e)
  }
}

function attachApprovalInfo(row) {
  const req = pickLatestRequestFor('PI', row.id)
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

export function usePiDocuments() {
  if (!loading && useAuthStore().isLoggedIn) {
    loading = loadPiDocuments()
  }
  return piDocuments
}

export function usePiPageInfo() {
  return piPageInfo
}

/** 로그아웃 시 호출 — loading 플래그와 캐시를 초기화하여 재로그인 시 이전 세션 데이터 노출 방지. */
export function clearPiDocuments() {
  piDocuments.value = []
  piPageInfo.value = { size: 1000, number: 0, totalElements: 0, totalPages: 0 }
  loading = null
}
