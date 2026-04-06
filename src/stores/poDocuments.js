import { ref } from 'vue'
import { fetchPurchaseOrders } from '@/api/documents'

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
}

function formatCurrencyAmount(amount, currencyCode) {
  const symbols = { USD: '$', EUR: '€', JPY: '¥', GBP: '£', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CNY: '¥', MYR: 'RM', THB: '฿', VND: '₫', IDR: 'Rp', INR: '₹', SAR: '﷼', BRL: 'R$', SEK: 'kr', CHF: 'CHF', KRW: '₩' }
  const symbol = symbols[currencyCode] ?? ''
  return `${symbol}${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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
    approvalRequestedAt: row.approvalRequestedAt ?? null,
    approvalReview: row.approvalReview ?? null,
    itemsSnapshot: row.itemsSnapshot ?? null,
    linkedDocuments: parseLinkedDocuments(row.linkedDocuments),
    revisionHistory: row.revisionHistory ? (typeof row.revisionHistory === 'string' ? JSON.parse(row.revisionHistory) : row.revisionHistory) : [],
    items,
  }
}

const poDocuments = ref([])
let loading = null

export async function loadPoDocuments() {
  try {
    const data = await fetchPurchaseOrders()
    poDocuments.value = (Array.isArray(data) ? data : []).map(mapPoResponse)
  } catch (e) {
    console.error('Failed to load PO documents:', e)
  }
}

export function usePoDocuments() {
  if (!loading) {
    loading = loadPoDocuments()
  }
  return poDocuments
}
