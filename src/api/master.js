import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'
import { unwrapPaged } from '@/utils/pagedResponse'

/**
 * 기준정보 API.
 *
 * 거래처(clients) / 바이어(buyers) 서브리소스는 PagedModel HATEOAS 형식이다.
 * 각 리소스는 두 가지 형태를 제공:
 *   - `fetchXxxPaged({ page, size })` → `{ content, page }` (서버사이드 페이지네이션용)
 *   - `fetchXxx()` → 배열 (클라이언트사이드 필터/검색 레거시 호환. size=1000).
 */

// ── Clients ─────────────────────────────────────────────────
export async function fetchClientsPaged({ page = 0, size = 20, ...rest } = {}) {
  const { data } = await api.get('/clients', { params: { page, size, ...rest } })
  return unwrapPaged(data, { page, size, hintKey: 'clientResponseList' })
}
export const fetchClients = async (params = { size: 1000 }) => {
  const { data } = await api.get('/clients', { params })
  return unwrapCollection(data, 'clientResponseList')
}
export const fetchClient = (id) => api.get(`/clients/${id}`).then((r) => r.data)
export const createClient = (client) => api.post('/clients', client).then((r) => r.data)
export const updateClient = (id, client) => api.put(`/clients/${id}`, client).then((r) => r.data)
export async function changeClientStatus(id, status) {
  const { data } = await api.patch(`/clients/${id}/status`, { status })
  return data
}

export async function fetchClientsByTeamPaged(teamId, { page = 0, size = 20 } = {}) {
  const { data } = await api.get(`/clients/team/${teamId}`, { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'clientResponseList' })
}
export async function fetchClientsByDepartmentPaged(departmentId, { page = 0, size = 20 } = {}) {
  const { data } = await api.get(`/clients/department/${departmentId}`, { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'clientResponseList' })
}

// ── Items (ItemQueryController 는 레거시 PagedResponse 유지) ──
export const fetchItems = (params = { size: 1000 }) =>
  api.get('/items', { params }).then((r) => unwrapCollection(r.data, 'itemResponseList'))
export const fetchItem = (id) => api.get(`/items/${id}`).then((r) => r.data)
export const createItem = (item) => api.post('/items', item).then((r) => r.data)
export const updateItem = (id, item) => api.put(`/items/${id}`, item).then((r) => r.data)
export async function changeItemStatus(id, status) {
  const { data } = await api.patch(`/items/${id}/status`, { status })
  return data
}

// ── Buyers ──────────────────────────────────────────────────
export async function fetchBuyersPaged({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/buyers', { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'buyerResponseList' })
}
export const fetchBuyers = async () => {
  const { data } = await api.get('/buyers', { params: { size: 1000 } })
  return unwrapCollection(data, 'buyerResponseList')
}
export async function fetchBuyersByClientPaged(clientId, { page = 0, size = 20 } = {}) {
  const { data } = await api.get(`/clients/${clientId}/buyers`, { params: { page, size } })
  return unwrapPaged(data, { page, size, hintKey: 'buyerResponseList' })
}
export const fetchBuyersByClient = async (clientId) => {
  const { data } = await api.get(`/clients/${clientId}/buyers`, { params: { size: 1000 } })
  return unwrapCollection(data, 'buyerResponseList')
}

// ── Reference data (pagination 없음) ─────────────────────────
export const fetchCountries = () =>
  api.get('/countries').then((r) => unwrapCollection(r.data, 'countryList'))
export const fetchPorts = () =>
  api.get('/ports').then((r) => unwrapCollection(r.data, 'portResponseList'))
export const fetchCurrencies = () =>
  api.get('/currencies').then((r) => unwrapCollection(r.data, 'currencyList'))
export const fetchIncoterms = () =>
  api.get('/incoterms').then((r) => unwrapCollection(r.data, 'incotermList'))
export const fetchPaymentTerms = () =>
  api.get('/payment-terms').then((r) => unwrapCollection(r.data, 'paymentTermList'))
