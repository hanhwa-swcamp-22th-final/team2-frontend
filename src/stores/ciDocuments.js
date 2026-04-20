import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchCommercialInvoicesPaged } from '@/api/documents'
import { formatCurrencyAmount, getCurrencyDecimals } from '@/utils/currencyFormat'

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  })
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
  // F4 — 품목 라인 셀의 소수 자릿수를 통화별로 결정. KRW/JPY=0, 그 외=2.
  // 이전엔 2자리 고정이라 CI260011(KRW) 도 "12,000.00" 처럼 찍혀 이상했음.
  const itemDecimals = getCurrencyDecimals(row.currencyCode)
  const items = rawItems.map((item) => ({
    name: item.itemName ?? item.name ?? '-',
    hsCode: item.hsCode ?? '-',
    quantity: String(item.quantity ?? 1),
    unitPrice: formatNumber(Number(item.unitPrice ?? 0), itemDecimals),
    amount: formatNumber(Number(item.amount ?? 0), itemDecimals),
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
    // 백엔드 CommercialInvoiceResponse.buyer 필드명이므로 row.buyer 로 읽는다.
    // 이전 row.buyerName 은 undefined → 항상 '-' 로 떨어져 CI 상세 "바이어" 비어보였음 (F1).
    buyer: row.buyer ?? row.buyerName ?? '-',
    country: row.country ?? '-',
    // row.currencyCode 가 빈 문자열 ("") 이어도 fallback 이 동작하도록 || 사용.
    // 기존 ?? 는 "" 를 그대로 사용해 통화 기호가 누락됐음 (Issue #10).
    currencyCode: row.currencyCode || 'USD',
    currency: row.currencyCode || 'USD',
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
