import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchPackingListsPaged } from '@/api/documents'

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

function mapPlResponse(row) {
  const rawItems = row.items?.length ? row.items : parseJsonSafe(row.itemsSnapshot)
  // Issue D 후속 — 라인 Gross Weight = 개당 item_weight(kg) × 수량. po_items_snapshot
  // JSON 은 itemWeight 키로 개당 중량 담음 (PurchaseOrderCreationService.serializeItemsSnapshot).
  // netWeight 는 master 에 별도 필드가 없어 동일값 폴백.
  const items = rawItems.map((item) => {
    const qty = Number(item.quantity ?? 1) || 0
    const perItemWeight = Number(item.itemWeight ?? 0) || 0
    const lineWeight = qty * perItemWeight
    return {
      name: item.itemName ?? item.name ?? '-',
      quantity: String(item.quantity ?? 1),
      itemWeight: perItemWeight,
      netWeight: formatNumber(Number(item.netWeight ?? lineWeight), 2),
      grossWeight: formatNumber(Number(item.grossWeight ?? lineWeight), 2),
      measurement: formatNumber(Number(item.measurement ?? 0), 2),
    }
  })

  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity), 0)
  const totalNetWeight = items.reduce((sum, item) => sum + Number(String(item.netWeight).replace(/,/g, '')), 0)
  const computedGrossFromItems = items.reduce((sum, item) => sum + Number(String(item.grossWeight).replace(/,/g, '')), 0)
  // DB 의 pl_gross_weight 는 createFromPurchaseOrder SQL 이 SUM(qty×weight) 로 이미
  // 채움 (Issue D). 우선순위: row.grossWeight(DB) > items 합계. 상세 페이지 0kg 회귀(저녁
  // QA) 는 여기서 item 합계만 쓰고 DB 값을 무시해 발생. 이제 DB 우선.
  const totalGrossWeight = Number(row.grossWeight ?? 0) > 0
    ? Number(row.grossWeight)
    : computedGrossFromItems
  const totalMeasurement = items.reduce((sum, item) => sum + Number(String(item.measurement).replace(/,/g, '')), 0)

  return {
    id: row.plId,
    status: normalizeDocStatus(row.status),
    issueDate: formatDate(row.invoiceDate ?? row.issueDate),
    clientId: row.clientId ?? row.client_id ?? null,
    clientName: row.clientName ?? '-',
    clientEmail: row.clientEmail ?? row.client_email ?? '',
    clientAddress: row.clientAddress ?? '-',
    // 백엔드 PackingListResponse.buyer 필드명 기준. F1 (CI 와 동일 패턴).
    buyer: row.buyer ?? row.buyerName ?? '-',
    country: row.country ?? '-',
    itemName: items[0]?.name
      ?? row.itemName
      ?? row.firstItemName
      ?? row.representativeItemName
      ?? row.plItemName
      ?? '-',
    grossWeight: formatNumber(Number(row.grossWeight ?? totalGrossWeight), 2),
    bookingNo: row.bookingNo ?? '-',
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
    totalQuantity,
    totalNetWeight: formatNumber(totalNetWeight, 2),
    totalGrossWeight: formatNumber(totalGrossWeight, 2),
    totalMeasurement: formatNumber(totalMeasurement, 2),
    manager: row.managerName ?? '-',
    linkedDocuments: parseJsonSafe(row.linkedDocuments),
    items,
  }
}

const plDocuments = ref([])
const plPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
let loading = null

export async function loadPlDocuments({ page = 0, size = 1000 } = {}) {
  try {
    const { content, page: pageInfo } = await fetchPackingListsPaged({ page, size })
    plDocuments.value = (Array.isArray(content) ? content : []).map(mapPlResponse)
    plPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load PL documents:', e)
  }
}

export function usePlDocuments() {
  if (!loading && useAuthStore().isLoggedIn) {
    loading = loadPlDocuments()
  }
  return plDocuments
}

export function usePlPageInfo() {
  return plPageInfo
}

export function clearPlDocuments() {
  plDocuments.value = []
  plPageInfo.value = { size: 1000, number: 0, totalElements: 0, totalPages: 0 }
  loading = null
}
