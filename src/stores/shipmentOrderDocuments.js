import { ref } from 'vue'
import { fetchShipmentOrders } from '@/api/documents'

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
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
    status: row.status ?? '출하준비',
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
let loading = null

export async function loadShipmentOrderDocuments() {
  try {
    const data = await fetchShipmentOrders()
    shipmentOrderDocuments.value = (Array.isArray(data) ? data : []).map(mapShipmentOrderResponse)
  } catch (e) {
    console.error('Failed to load shipment order documents:', e)
  }
}

export function useShipmentOrderDocuments() {
  if (!loading) {
    loading = loadShipmentOrderDocuments()
  }
  return shipmentOrderDocuments
}
