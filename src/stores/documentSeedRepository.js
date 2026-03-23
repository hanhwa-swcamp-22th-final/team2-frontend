import masterData from '../../db.json'

import { resolveExchangeRateValue } from '@/utils/exchangeRate'
import { resolveIncotermState } from '@/utils/incoterms'
import { resolveMasterCurrency, resolvePaymentTermLabel, resolvePortLabel } from '@/utils/ciplMaster'

const clientsByName = new Map((masterData.clients ?? []).map((client) => [client.name, client]))
const countriesById = new Map((masterData.countries ?? []).map((country) => [String(country.id), country]))
const currenciesById = new Map((masterData.currencies ?? []).map((currency) => [String(currency.id), currency]))
const itemsByName = new Map((masterData.items ?? []).map((item) => [item.name, item]))
const portsById = new Map((masterData.ports ?? []).map((port) => [String(port.id), port]))
const usersByName = new Map((masterData.users ?? []).map((user) => [user.name, user]))
const departmentsById = new Map((masterData.departments ?? []).map((department) => [String(department.id), department]))
const buyersByClientId = new Map()

;(masterData.buyers ?? []).forEach((buyer) => {
  const key = String(buyer.clientId)
  const current = buyersByClientId.get(key) ?? []
  current.push(buyer)
  buyersByClientId.set(key, current)
})

function cloneSeed(data) {
  return JSON.parse(JSON.stringify(data))
}

function normalizeReferenceId(value = '') {
  return String(value).replace(/[^A-Za-z0-9]/g, '')
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  })
}

function getCurrencyMetaByCode(code) {
  return (masterData.currencies ?? []).find((currency) => currency.code === code) ?? null
}

function formatCurrencyAmount(amount, currencyCode) {
  const currency = getCurrencyMetaByCode(currencyCode)
  const symbol = currency?.symbol ?? ''
  return `${symbol}${formatNumber(amount, 0)}`
}

function resolveClient(documentRow) {
  return clientsByName.get(documentRow.clientName) ?? null
}

function resolveCountryLabel(client, fallback = '-') {
  if (!client?.countryId) return fallback
  const country = countriesById.get(String(client.countryId))
  return country?.nameKr ?? country?.name ?? fallback
}

function resolveCurrencyCode(documentRow, client) {
  if (documentRow.currency) {
    return resolveMasterCurrency(documentRow.currency, documentRow.currency)
  }

  if (!client?.currencyId) {
    return 'USD'
  }

  const currency = currenciesById.get(String(client.currencyId))
  return currency?.code ?? 'USD'
}

function resolveBuyerLabel(client) {
  if (!client?.id) return '-'
  const buyer = (buyersByClientId.get(String(client.id)) ?? [])[0]
  if (!buyer) return '-'
  return [buyer.name, buyer.position ? `(${buyer.position})` : ''].filter(Boolean).join(' ')
}

function resolveNamedPlace(client) {
  if (!client?.portId) return ''
  const port = portsById.get(String(client.portId))
  return port?.name?.toUpperCase() ?? ''
}

function resolveDepartmentName(managerName) {
  const user = usersByName.get(managerName)
  if (!user?.departmentId) return '-'
  return departmentsById.get(String(user.departmentId))?.name ?? '-'
}

function deriveItemPricing(item, currencyCode, issueDate, totalAmount) {
  if (!item) {
    return {
      quantity: 1,
      unitPrice: totalAmount,
      amount: totalAmount,
    }
  }

  const rate = resolveExchangeRateValue(currencyCode, issueDate?.replaceAll('/', '-'))
  const quoteAmount = currencyCode === 'JPY' ? 100 : 1
  const baseUnitPrice = currencyCode === 'KRW' || !rate
    ? item.unitPrice
    : Math.max(1, Math.round((item.unitPrice / rate) * quoteAmount))
  const quantity = Math.max(1, Math.round(totalAmount / baseUnitPrice))
  const unitPrice = Math.max(1, Math.round(totalAmount / quantity))

  return {
    quantity,
    unitPrice,
    amount: unitPrice * quantity,
  }
}

function createCommercialLineItems(documentRow, currencyCode, issueDate) {
  const item = itemsByName.get(documentRow.itemName) ?? null
  const totalAmount = parseNumber(documentRow.amount)
  const pricing = deriveItemPricing(item, currencyCode, issueDate, totalAmount)

  return [
    {
      code: item?.code ?? '',
      name: documentRow.itemName,
      qty: String(pricing.quantity),
      quantity: String(pricing.quantity),
      unit: item?.unit ?? 'EA',
      unitPrice: String(pricing.unitPrice),
      amount: String(totalAmount || pricing.amount),
      remark: '',
    },
  ]
}

function createExecutionLineItems(sourceItems) {
  return sourceItems.map((item) => ({
    code: item.code ?? '',
    name: item.name,
    quantity: item.qty ?? item.quantity ?? '1',
    unit: item.unit ?? 'EA',
    remark: item.remark ?? '',
  }))
}

function createShipmentStatusLineItems(sourceItems) {
  return sourceItems.map((item) => ({
    code: item.code ?? '',
    name: item.name,
    quantity: `${item.qty ?? item.quantity ?? '1'} ${item.unit ?? 'EA'}`,
  }))
}

function createCiItems(sourceItems) {
  return sourceItems.map((item) => {
    const masterItem = itemsByName.get(item.name)
    return {
      name: item.name,
      hsCode: masterItem?.hsCode ?? '-',
      quantity: item.qty ?? item.quantity ?? '1',
      unitPrice: `${formatNumber(parseNumber(item.unitPrice), 2)}`,
      amount: `${formatNumber(parseNumber(item.amount), 2)}`,
      remark: item.remark ?? '',
    }
  })
}

function createPlItems(sourceItems) {
  return sourceItems.map((item) => {
    const masterItem = itemsByName.get(item.name)
    const quantity = parseNumber(item.qty ?? item.quantity)
    const netWeight = Number(((masterItem?.weight ?? 0) * quantity).toFixed(2))
    const grossWeight = Number((netWeight * 1.05).toFixed(2))
    const measurement = Number((grossWeight * 0.08).toFixed(2))

    return {
      name: item.name,
      quantity: `${quantity}`,
      netWeight: formatNumber(netWeight, 2),
      grossWeight: formatNumber(grossWeight, 2),
      measurement: formatNumber(measurement, 2),
    }
  })
}

function sumField(items, key) {
  return items.reduce((sum, item) => sum + parseNumber(item[key]), 0)
}

function buildAllDocuments() {
  const piDocuments = (masterData.pi ?? []).map((row) => {
    const client = resolveClient(row)
    const currency = resolveCurrencyCode(row, client)
    const issueDate = formatDate(row.issueDate)
    const namedPlace = resolveNamedPlace(client)
    const incotermState = resolveIncotermState('', namedPlace)
    const items = createCommercialLineItems(row, currency, issueDate)

    return {
      id: normalizeReferenceId(row.id),
      issueDate,
      clientName: row.clientName,
      clientAddress: client?.address ?? '-',
      buyerName: resolveBuyerLabel(client),
      currency,
      country: resolveCountryLabel(client, row.country),
      itemName: row.itemName,
      amount: formatCurrencyAmount(parseNumber(row.amount), currency),
      incoterms: incotermState.code,
      namedPlace: incotermState.namedPlace,
      manager: row.manager || '-',
      status: row.status || '확정',
      deliveryDate: formatDate(row.deliveryDate),
      remarks: row.remarks || '-',
      items,
    }
  })

  const piById = new Map(piDocuments.map((row) => [row.id, row]))

  const poDocuments = (masterData.po ?? []).map((row) => {
    const client = resolveClient(row)
    const linkedPiId = normalizeReferenceId(row.piId)
    const linkedPi = piById.get(linkedPiId) ?? null
    const currency = resolveCurrencyCode(row, client)
    const issueDate = formatDate(row.issueDate)
    const namedPlace = linkedPi?.namedPlace || resolveNamedPlace(client)
    const incotermState = resolveIncotermState(linkedPi?.incoterms ?? '', namedPlace)
    const items = linkedPi?.items?.length ? cloneSeed(linkedPi.items) : createCommercialLineItems(row, currency, issueDate)

    return {
      id: normalizeReferenceId(row.id),
      piId: linkedPiId,
      linkedPiId,
      issueDate,
      clientName: row.clientName,
      clientAddress: linkedPi?.clientAddress || client?.address || '-',
      buyerName: linkedPi?.buyerName || resolveBuyerLabel(client),
      currency,
      country: resolveCountryLabel(client, row.country),
      itemName: row.itemName,
      amount: formatCurrencyAmount(parseNumber(row.amount), currency),
      totalAmount: formatCurrencyAmount(parseNumber(row.amount), currency),
      incoterms: incotermState.code,
      namedPlace: incotermState.namedPlace,
      manager: row.manager || linkedPi?.manager || '-',
      status: row.status || '확정',
      deliveryDate: formatDate(row.deliveryDate),
      sourceDeliveryDate: linkedPi?.deliveryDate || formatDate(row.deliveryDate),
      deliveryDateOverride: formatDate(row.deliveryDate) !== (linkedPi?.deliveryDate || formatDate(row.deliveryDate)),
      remarks: row.remarks || '-',
      items,
      linkedDocuments: linkedPi ? [{ id: linkedPi.id, status: linkedPi.status }] : [],
      revisionHistory: [],
    }
  })

  const poById = new Map(poDocuments.map((row) => [row.id, row]))

  const productionDocuments = (masterData.productionOrders ?? []).map((row) => {
    const poId = normalizeReferenceId(row.poId)
    const linkedPo = poById.get(poId) ?? null
    const client = resolveClient(linkedPo ?? row)
    const manager = row.manager || linkedPo?.manager || '-'

    return {
      id: normalizeReferenceId(row.id),
      status: String(row.status).includes('완료') ? '생산완료' : '진행중',
      issueDate: formatDate(row.issueDate),
      poId,
      country: linkedPo?.country || resolveCountryLabel(client, row.country),
      clientName: linkedPo?.clientName || row.clientName,
      clientAddress: linkedPo?.clientAddress || client?.address || '-',
      itemName: linkedPo?.itemName || row.itemName,
      manager,
      dueDate: formatDate(row.dueDate),
      department: resolveDepartmentName(manager),
      productionSite: '-',
      requestedBy: manager,
      completionTarget: formatDate(row.dueDate),
      remarks: row.remarks || '-',
      linkedDocuments: linkedPo ? [{ id: linkedPo.id, status: linkedPo.status }] : [],
      items: createExecutionLineItems(linkedPo?.items ?? createCommercialLineItems(linkedPo ?? row, linkedPo?.currency ?? resolveCurrencyCode(row, client), formatDate(row.issueDate))),
    }
  })

  const productionByPoId = new Map(productionDocuments.map((row) => [row.poId, row]))

  const shipmentOrderDocuments = (masterData.shipmentOrders ?? []).map((row) => {
    const poId = normalizeReferenceId(row.poId)
    const linkedPo = poById.get(poId) ?? null
    const client = resolveClient(linkedPo ?? row)
    const manager = row.manager || linkedPo?.manager || '-'

    return {
      id: normalizeReferenceId(row.id),
      status: String(row.status).includes('완료') ? '출하완료' : '출하준비',
      issueDate: formatDate(row.issueDate),
      poId,
      clientName: linkedPo?.clientName || row.clientName,
      country: linkedPo?.country || resolveCountryLabel(client, row.country),
      clientAddress: linkedPo?.clientAddress || client?.address || '-',
      itemName: linkedPo?.itemName || row.itemName,
      manager,
      dueDate: formatDate(row.dueDate),
      requestedBy: manager,
      plannedShipDate: formatDate(row.dueDate),
      remarks: row.remarks || '-',
      items: createExecutionLineItems(linkedPo?.items ?? createCommercialLineItems(linkedPo ?? row, linkedPo?.currency ?? resolveCurrencyCode(row, client), formatDate(row.issueDate))),
    }
  })

  const shipmentOrderByPoId = new Map(shipmentOrderDocuments.map((row) => [row.poId, row]))
  const shipmentOrderById = new Map(shipmentOrderDocuments.map((row) => [row.id, row]))

  const shipmentStatusDocuments = (masterData.shipments ?? []).map((row) => {
    const poId = normalizeReferenceId(row.poId)
    const linkedPo = poById.get(poId) ?? null
    const linkedShipmentOrder = shipmentOrderByPoId.get(poId) ?? null

    return {
      id: normalizeReferenceId(row.id),
      status: String(row.status).includes('완료') ? '출하완료' : '출하준비',
      clientName: row.clientName,
      country: linkedShipmentOrder?.country || linkedPo?.country || row.country || '-',
      poId,
      shipmentOrderId: linkedShipmentOrder?.id || '',
      requestDate: formatDate(row.requestDate),
      dueDate: formatDate(row.dueDate),
      updatedAt: `${formatDate(row.requestDate)} 09:00`,
      manager: linkedShipmentOrder?.manager || linkedPo?.manager || '-',
      remarks: row.remarks || '-',
      items: createShipmentStatusLineItems(linkedShipmentOrder?.items ?? createExecutionLineItems(linkedPo?.items ?? [])),
      linkedDocuments: [
        ...(linkedPo ? [{ id: linkedPo.id, status: linkedPo.status }] : []),
        ...(linkedShipmentOrder ? [{ id: linkedShipmentOrder.id, status: linkedShipmentOrder.status }] : []),
      ],
    }
  })

  const shipmentStatusByPoId = new Map(shipmentStatusDocuments.map((row) => [row.poId, row]))

  poDocuments.forEach((row) => {
    const production = productionByPoId.get(row.id)
    const shipmentOrder = shipmentOrderByPoId.get(row.id)
    const shipmentStatus = shipmentStatusByPoId.get(row.id)

    if (production) {
      row.linkedDocuments.push({ id: production.id, status: production.status })
    }
    if (shipmentOrder) {
      row.linkedDocuments.push({ id: shipmentOrder.id, status: shipmentOrder.status })
    }
    if (shipmentStatus?.status === '출하완료' || shipmentOrder?.status === '출하완료') {
      row.status = '출하완료'
    }
  })

  const ciDocuments = (masterData.ci ?? []).map((row) => {
    const poId = normalizeReferenceId(row.poId)
    const linkedPo = poById.get(poId) ?? null
    const linkedShipmentOrder = shipmentOrderByPoId.get(poId) ?? null
    const client = resolveClient(linkedPo ?? row)
    const currency = resolveCurrencyCode(linkedPo ?? row, client)
    const items = createCiItems(linkedPo?.items ?? createCommercialLineItems(linkedPo ?? row, currency, formatDate(row.invoiceDate)))
    const paymentTermsId = client?.paymentTermsId ?? null
    const namedPlace = linkedPo?.namedPlace || resolveNamedPlace(client)
    const incotermState = resolveIncotermState(linkedPo?.incoterms ?? '', namedPlace)

    return {
      id: normalizeReferenceId(row.id),
      status: linkedShipmentOrder?.status === '출하완료' ? '발행완료' : '발행대기',
      issueDate: formatDate(row.invoiceDate),
      clientName: row.clientName,
      clientAddress: linkedPo?.clientAddress || client?.address || '-',
      buyer: linkedPo?.buyerName || resolveBuyerLabel(client),
      country: linkedPo?.country || resolveCountryLabel(client, row.country),
      currencyCode: currency,
      currency,
      itemName: row.itemName,
      amount: formatCurrencyAmount(parseNumber(row.amount), currency),
      totalAmount: formatNumber(parseNumber(row.amount), 2),
      incotermCode: incotermState.code,
      incoterms: `${incotermState.code}${incotermState.namedPlace ? ` ${incotermState.namedPlace}` : ''}`,
      namedPlace: incotermState.namedPlace,
      paymentTermsId,
      paymentTerms: resolvePaymentTermLabel(paymentTermsId, '-'),
      deliveryDate: linkedPo?.deliveryDate || '-',
      portOfDischargeCode: client?.portId ? portsById.get(String(client.portId))?.code ?? '' : '',
      portOfDischargeFallback: resolvePortLabel(client?.portId ? portsById.get(String(client.portId))?.code ?? '' : '', '-'),
      portOfDischarge: resolvePortLabel(client?.portId ? portsById.get(String(client.portId))?.code ?? '' : '', '-'),
      carrier: '-',
      poId,
      shipmentOrderId: linkedShipmentOrder?.id || '',
      remarks: resolvePaymentTermLabel(paymentTermsId, '-'),
      manager: linkedPo?.manager || '-',
      items,
    }
  })

  const plDocuments = (masterData.pl ?? []).map((row) => {
    const poId = normalizeReferenceId(row.poId)
    const linkedPo = poById.get(poId) ?? null
    const linkedShipmentOrder = shipmentOrderByPoId.get(poId) ?? null
    const client = resolveClient(linkedPo ?? row)
    const paymentTermsId = client?.paymentTermsId ?? null
    const namedPlace = linkedPo?.namedPlace || resolveNamedPlace(client)
    const incotermState = resolveIncotermState(linkedPo?.incoterms ?? '', namedPlace)
    const items = createPlItems(linkedPo?.items ?? createCommercialLineItems(linkedPo ?? row, linkedPo?.currency ?? resolveCurrencyCode(row, client), formatDate(row.invoiceDate)))

    return {
      id: normalizeReferenceId(row.id),
      status: linkedShipmentOrder?.status === '출하완료' ? '발행완료' : '발행대기',
      issueDate: formatDate(row.invoiceDate),
      clientName: row.clientName,
      clientAddress: linkedPo?.clientAddress || client?.address || '-',
      buyer: linkedPo?.buyerName || resolveBuyerLabel(client),
      country: linkedPo?.country || resolveCountryLabel(client, row.country),
      itemName: row.itemName,
      grossWeight: formatNumber(parseNumber(row.grossWeight), 2),
      bookingNo: '-',
      incotermCode: incotermState.code,
      incoterms: `${incotermState.code}${incotermState.namedPlace ? ` ${incotermState.namedPlace}` : ''}`,
      namedPlace: incotermState.namedPlace,
      paymentTermsId,
      paymentTerms: resolvePaymentTermLabel(paymentTermsId, '-'),
      deliveryDate: linkedPo?.deliveryDate || '-',
      portOfDischargeCode: client?.portId ? portsById.get(String(client.portId))?.code ?? '' : '',
      portOfDischargeFallback: resolvePortLabel(client?.portId ? portsById.get(String(client.portId))?.code ?? '' : '', '-'),
      portOfDischarge: resolvePortLabel(client?.portId ? portsById.get(String(client.portId))?.code ?? '' : '', '-'),
      carrier: '-',
      poId,
      shipmentOrderId: linkedShipmentOrder?.id || '',
      remarks: '-',
      totalQuantity: `${sumField(items, 'quantity')} EA`,
      totalNetWeight: formatNumber(sumField(items, 'netWeight'), 2),
      totalGrossWeight: formatNumber(sumField(items, 'grossWeight'), 2),
      totalMeasurement: formatNumber(sumField(items, 'measurement'), 2),
      manager: linkedPo?.manager || '-',
      items,
    }
  })

  return {
    piDocuments,
    poDocuments,
    productionDocuments,
    shipmentOrderDocuments,
    shipmentStatusDocuments,
    ciDocuments,
    plDocuments,
  }
}

const initialSeeds = buildAllDocuments()

export function createPiDocumentSeeds() {
  return cloneSeed(initialSeeds.piDocuments)
}

export function createPoDocumentSeeds() {
  return cloneSeed(initialSeeds.poDocuments)
}

export function createProductionOrderSeeds() {
  return cloneSeed(initialSeeds.productionDocuments)
}

export function createShipmentOrderSeeds() {
  return cloneSeed(initialSeeds.shipmentOrderDocuments)
}

export function createShipmentStatusSeeds() {
  return cloneSeed(initialSeeds.shipmentStatusDocuments)
}

export function createCiDocumentSeeds() {
  return cloneSeed(initialSeeds.ciDocuments)
}

export function createPlDocumentSeeds() {
  return cloneSeed(initialSeeds.plDocuments)
}
