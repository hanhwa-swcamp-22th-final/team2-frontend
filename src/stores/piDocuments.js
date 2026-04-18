import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchProformaInvoicesPaged } from '@/api/documents'

function tryParseJson(value, fallback = null) {
  if (typeof value !== 'string') return value ?? fallback
  try { return JSON.parse(value) } catch { return fallback }
}

function formatTimestamp(value) {
  if (!value) return null
  const str = String(value)
  if (str.includes('T')) {
    const [date, time] = str.split('T')
    return `${date.replace(/-/g, '/')} ${time.substring(0, 5)}`
  }
  return str
}

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
}

function formatCurrencyAmount(amount, currencyCode) {
  const symbols = { USD: '$', EUR: '€', JPY: '¥', GBP: '£', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CNY: '¥', MYR: 'RM', THB: '฿', VND: '₫', IDR: 'Rp', INR: '₹', SAR: '﷼', BRL: 'R$', SEK: 'kr', CHF: 'CHF', KRW: '₩' }
  const symbol = symbols[currencyCode] ?? ''
  return `${symbol}${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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
    const { content, page: pageInfo } = await fetchProformaInvoicesPaged({ page, size })
    piDocuments.value = (Array.isArray(content) ? content : []).map(mapPiResponse)
    piPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load PI documents:', e)
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
