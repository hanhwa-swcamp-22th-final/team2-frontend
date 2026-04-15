import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchProductionOrders } from '@/api/documents'

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

function mapProductionOrderResponse(row) {
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
    id: row.productionOrderId,
    status: row.status ?? '진행중',
    issueDate: formatDate(row.orderDate ?? row.issueDate),
    poId: row.poId ?? '',
    country: row.country ?? '-',
    clientName: row.clientName ?? '-',
    clientAddress: row.clientAddress ?? '-',
    itemName: row.itemName ?? items[0]?.name ?? '-',
    manager: row.managerName ?? '-',
    dueDate: formatDate(row.dueDate),
    department: row.department ?? '-',
    productionSite: row.productionSite ?? '-',
    requestedBy: row.managerName ?? '-',
    completionTarget: formatDate(row.dueDate),
    remarks: row.remarks ?? '-',
    linkedDocuments: parseLinkedDocuments(row.linkedDocuments),
    items,
  }
}

const productionOrderDocuments = ref([])
let loading = null

export async function loadProductionOrderDocuments() {
  try {
    const data = await fetchProductionOrders()
    productionOrderDocuments.value = (Array.isArray(data) ? data : []).map(mapProductionOrderResponse)
  } catch (e) {
    console.error('Failed to load production order documents:', e)
  }
}

export function useProductionOrderDocuments() {
  const auth = useAuthStore()
  const role = auth.currentUser?.role
  // 생산지시서는 gateway 정책상 admin/production 만 허용. sales/shipping 에서 403 유발 방지.
  const allowed = ['admin', 'production'].includes(role)
  if (!loading && auth.isLoggedIn && allowed) {
    loading = loadProductionOrderDocuments()
  }
  return productionOrderDocuments
}
