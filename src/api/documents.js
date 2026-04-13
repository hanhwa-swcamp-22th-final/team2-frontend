import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

// Proforma Invoices
export const fetchProformaInvoices = () =>
  api.get('/proforma-invoices').then((r) => unwrapCollection(r.data))
export const fetchProformaInvoice = (piId) =>
  api.get(`/proforma-invoices/${piId}`).then((r) => r.data)
export const createProformaInvoice = (payload) =>
  api.post('/proforma-invoices', payload).then((r) => r.data)
export const requestPiRegistration = (payload) =>
  api.post('/proforma-invoices/request-registration', payload).then((r) => r.data)

// Purchase Orders
export const fetchPurchaseOrders = () =>
  api.get('/purchase-orders').then((r) => unwrapCollection(r.data))
export const fetchPurchaseOrder = (poId) =>
  api.get(`/purchase-orders/${poId}`).then((r) => r.data)
export const createPurchaseOrder = (payload) =>
  api.post('/purchase-orders', payload).then((r) => r.data)

// Commercial Invoices
export const fetchCommercialInvoices = () =>
  api.get('/commercial-invoices').then((r) => unwrapCollection(r.data))
export const fetchCommercialInvoice = (ciId) =>
  api.get(`/commercial-invoices/${ciId}`).then((r) => r.data)

// Packing Lists
export const fetchPackingLists = () =>
  api.get('/packing-lists').then((r) => unwrapCollection(r.data))
export const fetchPackingList = (plId) =>
  api.get(`/packing-lists/${plId}`).then((r) => r.data)

// Production Orders
export const fetchProductionOrders = () =>
  api.get('/production-orders').then((r) => unwrapCollection(r.data))
export const fetchProductionOrder = (id) =>
  api.get(`/production-orders/${id}`).then((r) => r.data)

// Shipment Orders
export const fetchShipmentOrders = () =>
  api.get('/shipment-orders').then((r) => unwrapCollection(r.data))
export const fetchShipmentOrder = (id) =>
  api.get(`/shipment-orders/${id}`).then((r) => r.data)

// Shipments (출하현황)
export const fetchShipments = () =>
  api.get('/shipments').then((r) => unwrapCollection(r.data))
export const fetchShipment = (id) =>
  api.get(`/shipments/${id}`).then((r) => r.data)
export const updateShipment = (id, payload) =>
  api.put(`/shipments/${id}`, payload).then((r) => r.data)

// Collections (수금현황)
export const fetchCollections = () =>
  api.get('/collections').then((r) => unwrapCollection(r.data))
export const fetchCollection = (id) =>
  api.get(`/collections/${id}`).then((r) => r.data)
export const updateCollection = (id, payload) =>
  api.put(`/collections/${id}`, payload).then((r) => r.data)

// Approval Requests
export const fetchApprovalRequests = () =>
  api.get('/approval-requests').then((r) => unwrapCollection(r.data))
