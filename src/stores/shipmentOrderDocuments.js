import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchShipmentOrdersPaged } from '@/api/documents'
import { formatKstSlashDate } from '@/utils/dateTime'

const SHIPMENT_STATUS_LABEL = {
  preparing: '출하준비',
  completed: '출하완료',
  '출하준비': '출하준비',
  '출하완료': '출하완료',
}

function formatDate(value) {
  return formatKstSlashDate(value)
}

function normalizeStatus(raw) {
  if (raw == null || raw === '') return '출하준비'
  const key = String(raw).trim()
  return SHIPMENT_STATUS_LABEL[key.toLowerCase()] ?? SHIPMENT_STATUS_LABEL[key] ?? key
}

function parseLinkedDocuments(value) {
  if (!value) return []
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return [] }
  }
  return Array.isArray(value) ? value : []
}

function mapShipmentOrderResponse(row) {
  const items = (row.items ?? []).map((item) => {
    if (typeof item === 'string') {
      return { code: '', name: item, quantity: '1', unit: 'EA', remark: '' }
    }
    return {
      code: item.itemCode ?? item.code ?? '',
      name: item.itemName ?? item.name ?? '-',
      quantity: String(item.quantity ?? 1),
      unit: item.unit ?? 'EA',
      remark: item.remark ?? '',
    }
  })

  return {
    id: row.shipmentOrderId,
    status: normalizeStatus(row.status),
    issueDate: formatDate(row.issueDate),
    poId: row.poId ?? '',
    clientName: row.clientName ?? '-',
    country: row.country ?? '-',
    clientAddress: row.clientAddress ?? '-',
    itemName: row.itemName ?? items[0]?.name ?? '-',
    manager: row.managerName ?? '-',
    dueDate: formatDate(row.dueDate),
    requestedBy: row.managerName ?? '-',
    plannedShipDate: formatDate(row.dueDate),
    remarks: row.remarks ?? '-',
    linkedDocuments: parseLinkedDocuments(row.linkedDocuments),
    items,
  }
}

const shipmentOrderDocuments = ref([])
const shipmentOrderPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
let loading = null

export async function loadShipmentOrderDocuments({ page = 0, size = 1000 } = {}) {
  try {
    const { content, page: pageInfo } = await fetchShipmentOrdersPaged({ page, size })
    shipmentOrderDocuments.value = (Array.isArray(content) ? content : []).map(mapShipmentOrderResponse)
    shipmentOrderPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load shipment order documents:', e)
  }
}

export function useShipmentOrderDocuments() {
  if (!loading && useAuthStore().isLoggedIn) {
    loading = loadShipmentOrderDocuments()
  }
  return shipmentOrderDocuments
}

export function clearShipmentOrderDocuments() {
  shipmentOrderDocuments.value = []
  shipmentOrderPageInfo.value = { size: 1000, number: 0, totalElements: 0, totalPages: 0 }
  loading = null
}

export function useShipmentOrderPageInfo() {
  return shipmentOrderPageInfo
}
