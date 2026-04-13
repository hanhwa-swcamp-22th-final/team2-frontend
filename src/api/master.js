import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

// Clients
export const fetchClients = () =>
  api.get('/clients').then((r) => unwrapCollection(r.data, 'clientResponseList'))
export const fetchClient = (id) => api.get(`/clients/${id}`).then((r) => r.data)
export const createClient = (client) => api.post('/clients', client).then((r) => r.data)
export const updateClient = (id, client) => api.put(`/clients/${id}`, client).then((r) => r.data)
export async function changeClientStatus(id, status) {
  const { data } = await api.patch(`/clients/${id}/status`, { status })
  return data
}

// Items (ItemQueryController 는 PagedResponse 형식 유지)
export const fetchItems = () =>
  api.get('/items').then((r) => unwrapCollection(r.data, 'itemResponseList'))
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
