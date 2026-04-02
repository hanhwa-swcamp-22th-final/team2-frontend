import { fetchBuyersByClient, fetchClients, fetchCurrencies, fetchItems, fetchPorts } from '@/api/master'
import { api } from '@/lib/api'
import { resolveMasterCurrency, resolvePaymentTermLabel, resolvePortLabel } from '@/utils/ciplMaster'
import { resolveIncotermState } from '@/utils/incoterms'

const clientsByName = new Map()
const currenciesById = new Map()
const portsById = new Map()
const itemsByName = new Map()
const buyersByClientId = new Map()
let cacheLoaded = false
let cachePromise = null

export async function loadActivityEmailCache() {
  if (cacheLoaded) return
  if (cachePromise) return cachePromise

  cachePromise = (async () => {
    try {
      const [clients, currencies, ports, items] = await Promise.all([
        fetchClients(),
        fetchCurrencies(),
        fetchPorts(),
        fetchItems(),
      ])
      clients.forEach((c) => clientsByName.set(c.clientName, c))
      currencies.forEach((c) => currenciesById.set(String(c.currencyId), c))
      ports.forEach((p) => portsById.set(String(p.id), p))
      items.forEach((i) => itemsByName.set(i.itemName, i))
      cacheLoaded = true
    } catch {
      // Cache load failed — functions will degrade gracefully.
    } finally {
      cachePromise = null
    }
  })()

  return cachePromise
}

// Eagerly start cache loading when this module is first imported.
loadActivityEmailCache()

function parseNumericValue(value) {
  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatDateSlash(value = new Date()) {
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  return String(value ?? '').replace(/-/g, '/')
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  })
}

function formatCurrencyAmount(amount, currencyCode) {
  const symbolMap = { KRW: '₩', USD: '$', EUR: '€', JPY: '¥' }
  const symbol = symbolMap[currencyCode] ?? ''
  return `${symbol}${formatNumber(amount, 0)}`
}

function getClientByName(clientName) {
  return clientsByName.get(clientName) ?? null
}

function getNamedPlace(client) {
  if (!client?.portId) return ''
  return portsById.get(String(client.portId))?.portName?.toUpperCase() ?? ''
}

function getPrimaryBuyer(client) {
  if (!client?.clientId) return null
  return (buyersByClientId.get(String(client.clientId)) ?? [])[0] ?? null
}

function getCurrencyCode(poRow, client) {
  if (poRow.currency || poRow.currencyCode) {
    return resolveMasterCurrency(poRow.currency || poRow.currencyCode, 'USD')
  }

  if (client?.currencyId) {
    return currenciesById.get(String(client.currencyId))?.currencyCode ?? 'USD'
  }

  return 'USD'
}

function buildNextId(prefix, rows, minimum = 2025000) {
  const maxNumber = rows.reduce((max, row) => {
    const numeric = Number.parseInt(String(row.id ?? '').replace(/[^0-9]/g, ''), 10)
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max
  }, minimum)

  return `${prefix}${String(maxNumber + 1)}`
}

function buildCiItems(poRow) {
  return (poRow.items ?? []).map((item) => {
    const masterItem = itemsByName.get(item.name)
    return {
      name: item.name ?? '-',
      hsCode: masterItem?.itemHsCode ?? '-',
      quantity: String(item.qty ?? item.quantity ?? '0'),
      unitPrice: formatNumber(parseNumericValue(item.unitPrice), 2),
      amount: formatNumber(parseNumericValue(item.amount), 2),
      remark: item.remark ?? '-',
    }
  })
}

function buildPlItems(poRow) {
  return (poRow.items ?? []).map((item) => {
    const masterItem = itemsByName.get(item.name)
    const quantity = parseNumericValue(item.qty ?? item.quantity)
    const netWeight = Number(((masterItem?.itemWeight ?? 0) * quantity).toFixed(2))
    const grossWeight = Number((netWeight * 1.05).toFixed(2))
    const measurement = Number((grossWeight * 0.08).toFixed(2))

    return {
      name: item.name ?? '-',
      quantity: String(quantity),
      netWeight: formatNumber(netWeight, 2),
      grossWeight: formatNumber(grossWeight, 2),
      measurement: formatNumber(measurement, 2),
    }
  })
}

function getPortLabel(client) {
  if (!client?.portId) return '-'
  const portCode = portsById.get(String(client.portId))?.portCode ?? ''
  return resolvePortLabel(portCode, '-')
}

function getPaymentTermsLabel(client) {
  return resolvePaymentTermLabel(client?.paymentTermId ?? null, '-')
}

export function ensureCommercialDocumentsForPo(poRow, ciRows, plRows) {
  const existingCi = ciRows.find((row) => row.poId === poRow.id) ?? null
  const existingPl = plRows.find((row) => row.poId === poRow.id) ?? null
  const client = getClientByName(poRow.clientName)
  const buyer = getPrimaryBuyer(client)
  const currency = getCurrencyCode(poRow, client)
  const namedPlace = poRow.namedPlace || getNamedPlace(client)
  const incotermState = resolveIncotermState(poRow.incoterms ?? '', namedPlace)
  const ciItems = buildCiItems(poRow)
  const plItems = buildPlItems(poRow)
  const totalAmountValue = (poRow.items ?? []).reduce((sum, item) => sum + parseNumericValue(item.amount), 0)
  const totalQuantity = plItems.reduce((sum, item) => sum + parseNumericValue(item.quantity), 0)
  const totalGrossWeight = plItems.reduce((sum, item) => sum + parseNumericValue(item.grossWeight), 0)

  const ciDocument = existingCi ?? {
    id: buildNextId('CI', ciRows),
    status: '발행대기',
    issueDate: formatDateSlash(poRow.issueDate || new Date()),
    clientName: poRow.clientName,
    clientAddress: poRow.clientAddress || client?.clientAddress || '-',
    buyer: poRow.buyerName || buyer?.buyerName || '-',
    country: poRow.country || '-',
    currencyCode: currency,
    currency,
    itemName: poRow.itemName || ciItems[0]?.name || '-',
    amount: formatCurrencyAmount(totalAmountValue, currency),
    totalAmount: formatNumber(totalAmountValue, 2),
    incotermCode: incotermState.code,
    incoterms: [incotermState.code, incotermState.namedPlace].filter(Boolean).join(' ') || '-',
    namedPlace: incotermState.namedPlace,
    paymentTermsId: client?.paymentTermId ?? null,
    paymentTerms: getPaymentTermsLabel(client),
    deliveryDate: poRow.deliveryDate || '-',
    portOfDischarge: getPortLabel(client),
    carrier: '-',
    poId: poRow.id,
    shipmentOrderId: '',
    remarks: poRow.remarks || getPaymentTermsLabel(client),
    manager: poRow.manager || '-',
    items: ciItems,
  }

  const plDocument = existingPl ?? {
    id: buildNextId('PL', plRows),
    status: '발행대기',
    issueDate: formatDateSlash(poRow.issueDate || new Date()),
    clientName: poRow.clientName,
    clientAddress: poRow.clientAddress || client?.clientAddress || '-',
    buyer: poRow.buyerName || buyer?.buyerName || '-',
    country: poRow.country || '-',
    itemName: poRow.itemName || plItems[0]?.name || '-',
    grossWeight: formatNumber(totalGrossWeight, 2),
    totalQuantity: formatNumber(totalQuantity, 0),
    totalGrossWeight: formatNumber(totalGrossWeight, 2),
    bookingNo: 'T.B.A.',
    carrier: '-',
    incoterms: [incotermState.code, incotermState.namedPlace].filter(Boolean).join(' ') || '-',
    paymentTermsId: client?.paymentTermId ?? null,
    paymentTerms: getPaymentTermsLabel(client),
    deliveryDate: poRow.deliveryDate || '-',
    portOfDischarge: getPortLabel(client),
    poId: poRow.id,
    shipmentOrderId: '',
    remarks: poRow.remarks || '-',
    manager: poRow.manager || '-',
    items: plItems,
  }

  return {
    ciDocument,
    plDocument,
    ciCreated: !existingCi,
    plCreated: !existingPl,
  }
}

export function createShipmentOrderFromPo(poRow, existingRows, requesterName, linkedDocuments = []) {
  return {
    id: buildNextId('SO', existingRows),
    status: '출하준비',
    issueDate: formatDateSlash(new Date()),
    poId: poRow.id,
    clientName: poRow.clientName,
    country: poRow.country || '-',
    clientAddress: poRow.clientAddress || '-',
    itemName: poRow.itemName || poRow.items?.[0]?.name || '-',
    manager: poRow.manager || requesterName || '-',
    dueDate: poRow.deliveryDate || '-',
    requestedBy: requesterName || poRow.manager || '-',
    plannedShipDate: poRow.deliveryDate || '-',
    remarks: 'PO 기준으로 출하지시서가 발행되었습니다.',
    linkedDocuments,
    items: (poRow.items ?? []).map((item) => ({
      code: item.code ?? '',
      name: item.name ?? '-',
      quantity: String(item.qty ?? item.quantity ?? ''),
      unit: item.unit ?? 'EA',
      remark: item.remark ?? '',
    })),
  }
}

export function createShipmentStatusFromOrder(shipmentOrder, existingRows, poStatus = '확정') {
  const today = formatDateSlash(new Date())
  return {
    id: buildNextId('SH', existingRows),
    status: '출하준비',
    clientName: shipmentOrder.clientName,
    country: shipmentOrder.country || '-',
    poId: shipmentOrder.poId,
    shipmentOrderId: shipmentOrder.id,
    requestDate: shipmentOrder.issueDate || today,
    dueDate: shipmentOrder.dueDate || '-',
    updatedAt: `${today} 09:00`,
    manager: shipmentOrder.manager || '-',
    remarks: shipmentOrder.remarks || '-',
    items: (shipmentOrder.items ?? []).map((item) => ({
      code: item.code ?? '',
      name: item.name ?? '-',
      quantity: `${item.quantity || '0'} ${item.unit || 'EA'}`,
    })),
    linkedDocuments: [
      { id: shipmentOrder.poId, status: poStatus },
      { id: shipmentOrder.id, status: shipmentOrder.status },
    ],
  }
}

export function applyShipmentOrderToCommercialDocuments(rows, poId, shipmentOrderId) {
  return rows.map((row) => (
    row.poId === poId
      ? { ...row, shipmentOrderId }
      : row
  ))
}

async function loadRecipients(clientName) {
  const client = getClientByName(clientName)

  if (!client?.clientId) {
    return client?.clientEmail ? [{ name: client.clientManager || clientName, email: client.clientEmail }] : []
  }

  try {
    const buyers = await fetchBuyersByClient(client.clientId)
    const rows = (buyers ?? [])
      .filter((buyer) => buyer.buyerEmail)
      .map((buyer) => ({ name: buyer.buyerName, email: buyer.buyerEmail }))

    if (rows.length) return rows
  } catch {
    // Fallback to cached data below.
  }

  const fallbackBuyers = (buyersByClientId.get(String(client.clientId)) ?? [])
    .filter((buyer) => buyer.buyerEmail)
    .map((buyer) => ({ name: buyer.buyerName, email: buyer.buyerEmail }))

  if (fallbackBuyers.length) return fallbackBuyers

  return client.clientEmail ? [{ name: client.clientManager || client.clientName, email: client.clientEmail }] : []
}

export async function recordDocumentEmailActivities({
  clientName,
  poId = '',
  sender = '',
  title,
  types,
  attachments,
}) {
  const recipients = await loadRecipients(clientName)

  if (!recipients.length) {
    return 0
  }

  const sentAt = formatDateSlash(new Date())

  await Promise.all(recipients.map((recipient) => api.post('/activityEmails', {
    client: clientName,
    title,
    recipient: recipient.name,
    email: recipient.email,
    types,
    attachments,
    poId: poId || null,
    status: '발송',
    sentAt,
    sender: sender || '-',
  })))

  return recipients.length
}
