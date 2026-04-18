import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchShipmentsPaged } from '@/api/documents'

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
}

function mapShipmentResponse(row) {
  return {
    id: String(row.shipmentId ?? row.id ?? ''),
    status: row.shipmentStatus ?? row.status ?? '출하준비',
    clientName: row.clientName ?? '-',
    country: row.country ?? '-',
    poId: row.poId ?? '',
    shipmentOrderId: row.shipmentOrderId ?? '',
    requestDate: formatDate(row.requestDate),
    dueDate: formatDate(row.dueDate),
    updatedAt: row.updatedAt ?? '',
    manager: row.managerName ?? row.manager ?? '-',
    remarks: row.remarks ?? '-',
    items: row.items ?? [],
    linkedDocuments: row.linkedDocuments ?? [],
  }
}

const shipmentStatusDocuments = ref([])
const shipmentStatusPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
let loading = null

export async function loadShipmentStatusDocuments({ page = 0, size = 1000 } = {}) {
  try {
    const { content, page: pageInfo } = await fetchShipmentsPaged({ page, size })
    shipmentStatusDocuments.value = (Array.isArray(content) ? content : []).map(mapShipmentResponse)
    shipmentStatusPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load shipment status documents:', e)
  }
}

export function useShipmentStatusPageInfo() {
  return shipmentStatusPageInfo
}

export function clearShipmentStatusDocuments() {
  shipmentStatusDocuments.value = []
  shipmentStatusPageInfo.value = { size: 1000, number: 0, totalElements: 0, totalPages: 0 }
  loading = null
}

export function useShipmentStatusDocuments() {
  const auth = useAuthStore()
  const role = auth.currentUser?.role
  // 출하현황은 admin/sales/shipping 만 조회 권한. production 에서 401/403 유발 방지.
  const allowed = ['admin', 'sales', 'shipping'].includes(role)
  if (!loading && auth.isLoggedIn && allowed) {
    loading = loadShipmentStatusDocuments()
  }
  return shipmentStatusDocuments
}
