import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

// Clients
// 서버가 PagedModel(default size 10) 를 반환하므로, 목록 화면은 클라이언트 페이지네이션을 쓰는
// 상황에선 충분히 큰 size 로 한 번에 로드해서 전체를 확보한다.
export const fetchClients = (params = { size: 1000 }) =>
  api.get('/clients', { params }).then((r) => unwrapCollection(r.data, 'clientResponseList'))
export const fetchClient = (id) => api.get(`/clients/${id}`).then((r) => r.data)
export const createClient = (client) => api.post('/clients', client).then((r) => r.data)
export const updateClient = (id, client) => api.put(`/clients/${id}`, client).then((r) => r.data)
export async function changeClientStatus(id, status) {
  const { data } = await api.patch(`/clients/${id}/status`, { status })
  return data
}

// Items (ItemQueryController 는 PagedResponse 형식 유지)
export const fetchItems = (params = { size: 1000 }) =>
  api.get('/items', { params }).then((r) => unwrapCollection(r.data, 'itemResponseList'))
export const fetchItem = (id) => api.get(`/items/${id}`).then((r) => r.data)
export const createItem = (item) => api.post('/items', item).then((r) => r.data)
export const updateItem = (id, item) => api.put(`/items/${id}`, item).then((r) => r.data)
export async function changeItemStatus(id, status) {
  const { data } = await api.patch(`/items/${id}/status`, { status })
  return data
}

// Buyers
export const fetchBuyers = () =>
  api.get('/buyers').then((r) => unwrapCollection(r.data, 'buyerResponseList'))
export const fetchBuyersByClient = (clientId) =>
  api
    .get(`/clients/${clientId}/buyers`)
    .then((r) => unwrapCollection(r.data, 'buyerResponseList'))

// Reference data
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
