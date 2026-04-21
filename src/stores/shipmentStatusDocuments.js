import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchShipmentsPaged } from '@/api/documents'
import { formatKstSlashDate } from '@/utils/dateTime'

function formatDate(value) {
  return formatKstSlashDate(value)
}

const SHIPMENT_STATUS_LABEL = {
  preparing: '출하준비',
  completed: '출하완료',
  '출하준비': '출하준비',
  '출하완료': '출하완료',
}

function normalizeShipmentStatus(raw) {
  if (raw == null || raw === '') return '출하준비'
  return SHIPMENT_STATUS_LABEL[String(raw).toLowerCase()] ?? SHIPMENT_STATUS_LABEL[raw] ?? '출하준비'
}

function parseItemsSnapshot(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return [] }
  }
  return []
}

function mapShipmentResponse(row) {
  // Step E — PO.po_items_snapshot 을 JOIN 으로 가져온 row.itemsSnapshot(JSON) 을 우선.
  // 레거시 레코드(snapshot NULL) 는 row.items fallback.
  const snapshotItems = parseItemsSnapshot(row.itemsSnapshot)
  const sourceItems = snapshotItems.length > 0 ? snapshotItems : (row.items ?? [])
  const items = sourceItems.map((item) => ({
    code: item.itemCode ?? item.code ?? '',
    name: item.itemName ?? item.name ?? '-',
    quantity: String(item.quantity ?? item.qty ?? 1),
    unit: item.unit ?? 'EA',
    remark: item.remark ?? '',
  }))

  return {
    id: String(row.shipmentId ?? row.id ?? ''),
    status: normalizeShipmentStatus(row.shipmentStatus ?? row.status),
    clientName: row.clientName ?? '-',
    country: row.country ?? '-',
    poId: row.poId ?? '',
    shipmentOrderId: row.shipmentOrderId ?? '',
    requestDate: formatDate(row.requestDate),
    dueDate: formatDate(row.dueDate),
    updatedAt: row.updatedAt ?? '',
    manager: row.managerName ?? row.manager ?? '-',
    remarks: row.remarks ?? '-',
    items,
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
