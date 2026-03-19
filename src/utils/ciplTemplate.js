const consigneeAddressByClient = {
  'COOLSAY SDN BHD': 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
  'TechBridge GmbH': 'Am Sandtorkai 35, 20457 Hamburg, Germany',
  'Pacific Trading Inc.': '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
  'Viet Steel JSC': '12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City, Vietnam',
  'Siam Industrial Co., Ltd.': '88 Bangna-Trad Road, Bang Phli, Samut Prakan 10540, Thailand',
  'Meridian Engineering Pte Ltd': '21 Jurong Port Road, Singapore 619095',
  'Tata Steel Traders Pvt Ltd': '3rd Floor, Commerce House, Nariman Point, Mumbai 400021, India',
  'OzSteel Supplies Pty Ltd': '42 Harbour Street, Sydney NSW 2000, Australia',
}

const consigneeAddressByCountry = {
  말레이시아: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
  독일: 'Am Sandtorkai 35, 20457 Hamburg, Germany',
  미국: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
  베트남: '12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City, Vietnam',
  태국: '88 Bangna-Trad Road, Bang Phli, Samut Prakan 10540, Thailand',
  싱가포르: '21 Jurong Port Road, Singapore 619095',
  인도: '3rd Floor, Commerce House, Nariman Point, Mumbai 400021, India',
  호주: '42 Harbour Street, Sydney NSW 2000, Australia',
}

function sanitizeText(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function sanitizeFieldValue(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized && normalized !== '-' ? normalized : fallback
}

function parseNumber(value) {
  const normalized = String(value ?? '').replaceAll(',', '').trim()
  const numeric = Number.parseFloat(normalized)
  return Number.isFinite(numeric) ? numeric : null
}

function formatAmount(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function hasRenderableItem(item, fields) {
  if (!item || typeof item !== 'object') {
    return false
  }

  return fields.some((field) => sanitizeText(item[field]) !== '')
}

export function resolveConsigneeAddress(doc) {
  const explicitAddress = sanitizeText(doc?.consigneeAddress)
  if (explicitAddress) return explicitAddress

  const clientAddress = sanitizeText(doc?.clientAddress)
  if (clientAddress) return clientAddress

  return consigneeAddressByClient[doc?.clientName]
    || consigneeAddressByCountry[doc?.country]
    || 'Address to be confirmed'
}

export function resolveConsigneeAttention(doc) {
  const buyer = sanitizeText(doc?.buyer)
  return buyer ? `Attn: ${buyer}` : ''
}

export function normalizeCIItems(items) {
  const source = Array.isArray(items) ? items : []

  return source
    .filter((item) => hasRenderableItem(item, ['name', 'hsCode', 'quantity', 'unitPrice', 'amount']))
    .map((item) => {
      const quantity = sanitizeFieldValue(item.quantity, '120')
      const unitPrice = sanitizeFieldValue(item.unitPrice, '350.00')
      const resolvedAmount = sanitizeFieldValue(item.amount)
      const derivedAmount = parseNumber(quantity) !== null && parseNumber(unitPrice) !== null
        ? formatAmount(parseNumber(quantity) * parseNumber(unitPrice))
        : '42,000.00'

      return {
        name: sanitizeText(item.name, '-'),
        hsCode: sanitizeText(item.hsCode),
        quantity,
        unitPrice,
        amount: resolvedAmount || derivedAmount,
      }
    })
}

export function normalizePLItems(items) {
  const source = Array.isArray(items) ? items : []

  return source
    .filter((item) => hasRenderableItem(item, ['name', 'quantity', 'netWeight', 'grossWeight', 'measurement', 'volume']))
    .map((item) => ({
      name: sanitizeText(item.name, '-'),
      quantity: sanitizeFieldValue(item.quantity, '120'),
      netWeight: sanitizeFieldValue(item.netWeight, '-'),
      grossWeight: sanitizeFieldValue(item.grossWeight, '-'),
      measurement: sanitizeFieldValue(item.measurement || item.volume, '-'),
    }))
}

export function resolveShipperName(doc) {
  return sanitizeText(doc?.shipperName, 'SalesBoost Inc.')
}

export function resolveShipperAddress(doc) {
  return sanitizeText(doc?.shipperAddress, 'Seoul, Republic of Korea')
}

export function resolvePortOfDischarge(doc) {
  return sanitizeText(doc?.portOfDischarge, 'KLANG, MALAYSIA')
}

export function resolveCiNotice(doc) {
  return sanitizeText(doc?.detailNotice, '--DETAILS ARE PER ATTACHED SHEET(S)--')
}

export function resolveCiTerm(doc) {
  return sanitizeText(doc?.incoterms?.split(' ')[0], 'FOB')
}
