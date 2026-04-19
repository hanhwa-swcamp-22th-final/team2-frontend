import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchProductionOrdersPaged } from '@/api/documents'

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
    managerId: row.managerId ?? null,
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
const productionOrderPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
const productionOrdersLoaded = ref(false)
let loading = null

export async function loadProductionOrderDocuments({ page = 0, size = 1000 } = {}) {
  try {
    const { content, page: pageInfo } = await fetchProductionOrdersPaged({ page, size })
    productionOrderDocuments.value = (Array.isArray(content) ? content : []).map(mapProductionOrderResponse)
    productionOrderPageInfo.value = pageInfo
    productionOrdersLoaded.value = true
  } catch (e) {
    console.error('Failed to load production order documents:', e)
    // 실패여도 gate 가 무한 blocked 로 남지 않도록 loaded=true 처리 (race 방지용도로는 충분)
    productionOrdersLoaded.value = true
  }
}

export function useProductionOrderPageInfo() {
  return productionOrderPageInfo
}

export function useProductionOrdersLoaded() {
  return productionOrdersLoaded
}

export function clearProductionOrderDocuments() {
  productionOrderDocuments.value = []
  productionOrderPageInfo.value = { size: 1000, number: 0, totalElements: 0, totalPages: 0 }
  productionOrdersLoaded.value = false
  loading = null
}

export function useProductionOrderDocuments() {
  const auth = useAuthStore()
  const role = auth.currentUser?.role
  // 생산지시서 조회는 모든 인증 사용자 허용 (DocumentQueryController class-level @PreAuthorize=isAuthenticated).
  // 출하팀도 "MO 완료 여부" 를 확인해 출하완료 처리 전 gate 로 활용.
  const allowed = ['admin', 'sales', 'production', 'shipping'].includes(role)
  if (!loading && auth.isLoggedIn && allowed) {
    loading = loadProductionOrderDocuments()
  }
  return productionOrderDocuments
}
