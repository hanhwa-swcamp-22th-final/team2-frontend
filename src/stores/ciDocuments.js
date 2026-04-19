import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchCommercialInvoicesPaged } from '@/api/documents'

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  })
}

function formatCurrencyAmount(amount, currencyCode) {
  const symbols = { USD: '$', EUR: '€', JPY: '¥', GBP: '£', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CNY: '¥', MYR: 'RM', THB: '฿', VND: '₫', IDR: 'Rp', INR: '₹', SAR: '﷼', BRL: 'R$', SEK: 'kr', CHF: 'CHF', KRW: '₩' }
  const symbol = symbols[currencyCode] ?? ''
  return `${symbol}${formatNumber(amount, 0)}`
}

function parseJsonSafe(value, fallback = []) {
  if (!value) return fallback
  if (typeof value !== 'string') return Array.isArray(value) ? value : fallback
  try { return JSON.parse(value) } catch { return fallback }
}

const DOC_STATUS_LABEL = {
  pending: '발행대기',
  issued: '발행완료',
  sent: '발송완료',
  draft: '초안',
  cancelled: '취소',
  canceled: '취소',
  deleted: '삭제',
  '발행대기': '발행대기',
  '발행완료': '발행완료',
  '발송완료': '발송완료',
  '초안': '초안',
  '취소': '취소',
}

function normalizeDocStatus(raw, fallback = '발행대기') {
  if (raw == null || raw === '') return fallback
  return DOC_STATUS_LABEL[String(raw).toLowerCase()] ?? DOC_STATUS_LABEL[raw] ?? String(raw)
}

function mapCiResponse(row) {
  const rawItems = row.items?.length ? row.items : parseJsonSafe(row.itemsSnapshot)
  const items = rawItems.map((item) => ({
    name: item.itemName ?? item.name ?? '-',
    hsCode: item.hsCode ?? '-',
    quantity: String(item.quantity ?? 1),
    unitPrice: formatNumber(Number(item.unitPrice ?? 0), 2),
    amount: formatNumber(Number(item.amount ?? 0), 2),
    remark: item.remark ?? '',
  }))

  return {
    id: row.ciId,
    status: normalizeDocStatus(row.status),
    issueDate: formatDate(row.invoiceDate ?? row.issueDate),
    clientId: row.clientId ?? row.client_id ?? null,
    clientName: row.clientName ?? '-',
    clientEmail: row.clientEmail ?? row.client_email ?? '',
    clientAddress: row.clientAddress ?? '-',
    buyer: row.buyerName ?? '-',
    country: row.country ?? '-',
    currencyCode: row.currencyCode ?? 'USD',
    currency: row.currencyCode ?? 'USD',
    itemName: items[0]?.name
      ?? row.itemName
      ?? row.firstItemName
      ?? row.representativeItemName
      ?? row.ciItemName
      ?? '-',
    amount: formatCurrencyAmount(row.totalAmount, row.currencyCode),
    totalAmount: formatNumber(Number(row.totalAmount ?? 0), 2),
    incotermCode: row.incotermsCode ?? '',
    incoterms: row.incotermsCode ? `${row.incotermsCode}${row.namedPlace ? ` ${row.namedPlace}` : ''}` : '-',
    namedPlace: row.namedPlace ?? '',
    paymentTermsId: row.paymentTermsId ?? null,
    paymentTerms: row.paymentTerms ?? '-',
    deliveryDate: formatDate(row.deliveryDate),
    portOfDischargeCode: row.portOfDischargeCode ?? '',
    portOfDischargeFallback: row.portOfDischarge ?? '-',
    portOfDischarge: row.portOfDischarge ?? '-',
    carrier: row.carrier ?? '-',
    poId: row.poId ?? '',
    shipmentOrderId: row.shipmentOrderId ?? '',
    remarks: row.remarks ?? '-',
    manager: row.managerName ?? '-',
    linkedDocuments: parseJsonSafe(row.linkedDocuments),
    items,
  }
}

const ciDocuments = ref([])
const ciPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
let loading = null

export async function loadCiDocuments({ page = 0, size = 1000 } = {}) {
  try {
    const { content, page: pageInfo } = await fetchCommercialInvoicesPaged({ page, size })
    ciDocuments.value = (Array.isArray(content) ? content : []).map(mapCiResponse)
    ciPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load CI documents:', e)
  }
}

export function useCiDocuments() {
  if (!loading && useAuthStore().isLoggedIn) {
    loading = loadCiDocuments()
  }
  return ciDocuments
}

export function useCiPageInfo() {
  return ciPageInfo
}

export function clearCiDocuments() {
  ciDocuments.value = []
  ciPageInfo.value = { size: 1000, number: 0, totalElements: 0, totalPages: 0 }
  loading = null
}
