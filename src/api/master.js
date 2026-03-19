import { api } from '@/lib/api'

// Clients
export const fetchClients = () => api.get('/clients').then((r) => r.data)
export const fetchClient = (id) => api.get(`/clients/${id}`).then((r) => r.data)
export const createClient = (client) => api.post('/clients', client).then((r) => r.data)
export const updateClient = (id, client) => api.put(`/clients/${id}`, client).then((r) => r.data)
export const deleteClient = (id) => api.delete(`/clients/${id}`).then((r) => r.data)

// Items
export const fetchItems = () => api.get('/items').then((r) => r.data)
export const fetchItem = (id) => api.get(`/items/${id}`).then((r) => r.data)
export const createItem = (item) => api.post('/items', item).then((r) => r.data)
export const updateItem = (id, item) => api.put(`/items/${id}`, item).then((r) => r.data)
export const deleteItem = (id) => api.delete(`/items/${id}`).then((r) => r.data)

// Reference data
export const fetchCountries = () => api.get('/countries').then((r) => r.data)
export const fetchPorts = () => api.get('/ports').then((r) => r.data)
export const fetchCurrencies = () => api.get('/currencies').then((r) => r.data)
export const fetchPaymentTerms = () => api.get('/paymentTerms').then((r) => r.data)
