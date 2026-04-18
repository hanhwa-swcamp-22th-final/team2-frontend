import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchPurchaseOrdersPaged } from '@/api/documents'

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
}

function formatCurrencyAmount(amount, currencyCode) {
  const symbols = { USD: '$', EUR: '€', JPY: '¥', GBP: '£', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CNY: '¥', MYR: 'RM', THB: '฿', VND: '₫', IDR: 'Rp', INR: '₹', SAR: '﷼', BRL: 'R$', SEK: 'kr', CHF: 'CHF', KRW: '₩' }
  const symbol = symbols[currencyCode] ?? ''
  return `${symbol}${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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
  }))

  return {
    id: row.poId,
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
    const { content, page: pageInfo } = await fetchPurchaseOrdersPaged({ page, size })
    poDocuments.value = (Array.isArray(content) ? content : []).map(mapPoResponse)
    poPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load PO documents:', e)
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
