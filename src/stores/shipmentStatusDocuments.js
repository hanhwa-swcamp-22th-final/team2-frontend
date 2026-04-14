import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchShipments } from '@/api/documents'

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
let loading = null

export async function loadShipmentStatusDocuments() {
  try {
    const data = await fetchShipments()
    shipmentStatusDocuments.value = (Array.isArray(data) ? data : []).map(mapShipmentResponse)
  } catch (e) {
    console.error('Failed to load shipment status documents:', e)
  }
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
