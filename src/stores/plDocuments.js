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

function mapPlResponse(row) {
  const rawItems = row.items?.length ? row.items : parseJsonSafe(row.itemsSnapshot)
  const items = rawItems.map((item) => ({
    name: item.itemName ?? item.name ?? '-',
    quantity: String(item.quantity ?? 1),
    netWeight: formatNumber(Number(item.netWeight ?? 0), 2),
    grossWeight: formatNumber(Number(item.grossWeight ?? 0), 2),
    measurement: formatNumber(Number(item.measurement ?? 0), 2),
  }))

  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity), 0)
  const totalNetWeight = items.reduce((sum, item) => sum + Number(String(item.netWeight).replace(/,/g, '')), 0)
  const totalGrossWeight = items.reduce((sum, item) => sum + Number(String(item.grossWeight).replace(/,/g, '')), 0)
  const totalMeasurement = items.reduce((sum, item) => sum + Number(String(item.measurement).replace(/,/g, '')), 0)

  return {
    id: row.plId,
    status: row.status ?? '발행대기',
    issueDate: formatDate(row.invoiceDate ?? row.issueDate),
    clientId: row.clientId ?? row.client_id ?? null,
    clientName: row.clientName ?? '-',
    clientEmail: row.clientEmail ?? row.client_email ?? '',
    clientAddress: row.clientAddress ?? '-',
    buyer: row.buyerName ?? '-',
    country: row.country ?? '-',
    itemName: items[0]?.name ?? row.itemName ?? '-',
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
