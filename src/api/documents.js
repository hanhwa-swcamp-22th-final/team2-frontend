import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'
import { unwrapPaged } from '@/utils/pagedResponse'

/**
 * 문서 목록 조회 API.
 *
 * 백엔드(documents 서비스)가 HATEOAS PagedModel 로 응답한다:
 *   { _embedded: { <xxxResponseList>: [...] }, _links, page: { size, number, totalElements, totalPages } }
 *
 * 두 가지 형태의 함수를 제공:
 *  1. `fetchXxxPaged({ page, size })` → `{ content, page }` 형태 (서버사이드 페이지네이션 활용)
 *  2. `fetchXxx()` → 배열 반환 (클라이언트사이드 필터/검색 사용하는 레거시 호출자 호환용.
 *     내부적으로 size=1000 으로 paged 호출).
 */

// ── Proforma Invoices ────────────────────────────────────────
export async function fetchProformaInvoicesPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/proforma-invoices', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'proformaInvoiceResponseList' })
}
export const fetchProformaInvoices = async () =>
  (await fetchProformaInvoicesPaged({ page: 0, size: 1000 })).content
export const fetchProformaInvoice = (piId) =>
  api.get(`/proforma-invoices/${piId}`).then((r) => r.data)
export const createProformaInvoice = (payload) =>
  api.post('/proforma-invoices', payload).then((r) => r.data)
export const requestPiRegistration = (payload) =>
  api.post('/proforma-invoices/request-registration', payload).then((r) => r.data)

// ── Purchase Orders ──────────────────────────────────────────
export async function fetchPurchaseOrdersPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/purchase-orders', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'purchaseOrderResponseList' })
}
export const fetchPurchaseOrders = async () =>
  (await fetchPurchaseOrdersPaged({ page: 0, size: 1000 })).content
export const fetchPurchaseOrder = (poId) =>
  api.get(`/purchase-orders/${poId}`).then((r) => r.data)
export const createPurchaseOrder = (payload) =>
  api.post('/purchase-orders', payload).then((r) => r.data)

// ── Commercial Invoices ──────────────────────────────────────
export async function fetchCommercialInvoicesPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/commercial-invoices', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'commercialInvoiceResponseList' })
}
export const fetchCommercialInvoices = async () =>
  (await fetchCommercialInvoicesPaged({ page: 0, size: 1000 })).content
export const fetchCommercialInvoice = (ciId) =>
  api.get(`/commercial-invoices/${ciId}`).then((r) => r.data)

// ── Packing Lists ────────────────────────────────────────────
export async function fetchPackingListsPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/packing-lists', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'packingListResponseList' })
}
export const fetchPackingLists = async () =>
  (await fetchPackingListsPaged({ page: 0, size: 1000 })).content
export const fetchPackingList = (plId) =>
  api.get(`/packing-lists/${plId}`).then((r) => r.data)

// ── Production Orders ────────────────────────────────────────
export async function fetchProductionOrdersPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/production-orders', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'productionOrderResponseList' })
}
export const fetchProductionOrders = async () =>
  (await fetchProductionOrdersPaged({ page: 0, size: 1000 })).content
export const fetchProductionOrder = (id) =>
  api.get(`/production-orders/${id}`).then((r) => r.data)
export const completeProductionOrder = (productionOrderId) =>
  api.put(`/production-orders/${productionOrderId}/complete`).then((r) => r.data)

// ── Shipment Orders ──────────────────────────────────────────
export async function fetchShipmentOrdersPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/shipment-orders', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'shipmentOrderResponseList' })
}
export const fetchShipmentOrders = async () =>
  (await fetchShipmentOrdersPaged({ page: 0, size: 1000 })).content
export const fetchShipmentOrder = (id) =>
  api.get(`/shipment-orders/${id}`).then((r) => r.data)

// ── Shipments (출하현황) ──────────────────────────────────────
export async function fetchShipmentsPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/shipments', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'shipmentResponseList' })
}
export const fetchShipments = async () =>
  (await fetchShipmentsPaged({ page: 0, size: 1000 })).content
export const fetchShipment = (id) =>
  api.get(`/shipments/${id}`).then((r) => r.data)
export const updateShipment = (id, payload) =>
  api.put(`/shipments/${id}`, payload).then((r) => r.data)

// ── Collections (수금현황) ────────────────────────────────────
export async function fetchCollectionsPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/collections', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'collectionResponseList' })
}
export const fetchCollections = async () =>
  (await fetchCollectionsPaged({ page: 0, size: 1000 })).content
export const fetchCollection = (id) =>
  api.get(`/collections/${id}`).then((r) => r.data)
export const updateCollection = (id, payload) =>
  api.put(`/collections/${id}`, payload).then((r) => r.data)

// ── Approval Requests ────────────────────────────────────────
export async function fetchApprovalRequestsPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/approval-requests', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'approvalRequestResponseList' })
}
export const fetchApprovalRequests = async () =>
  (await fetchApprovalRequestsPaged({ page: 0, size: 1000 })).content

/**
 * 결재자 후보 조회 (팀장 + ADMIN).
 * @param {number|null} teamId — 현재 사용자의 팀 ID. null 이면 전 팀의 팀장 반환.
 */
export const fetchApprovers = (teamId = null) =>
  api
    .get('/approval-requests/approvers', { params: teamId != null ? { teamId } : {} })
    .then((r) => (Array.isArray(r.data) ? r.data : unwrapCollection(r.data)))
