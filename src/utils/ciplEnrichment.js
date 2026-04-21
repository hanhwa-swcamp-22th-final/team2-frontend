export const DEFAULT_PAYMENT_TERMS = 'T/T REMITTANCE'
export const DEFAULT_PORT_OF_DISCHARGE = 'T.B.A.'
export const DEFAULT_CARRIER = 'T.B.A.'

function pickValue(...values) {
  return values.find((value) => {
    const normalized = String(value ?? '').trim()
    return normalized && normalized !== '-'
  })
}

export function buildClientLookup(clients = []) {
  return new Map(clients.map((client) => [String(client.clientId ?? client.id), client]))
}

export function resolvePaymentTerms(row, client) {
  return pickValue(
    row.paymentTerms,
    client?.paymentTermName,
    client?.paymentTermsName,
    client?.paymentTermCode,
    client?.paymentTermsCode,
  ) ?? DEFAULT_PAYMENT_TERMS
}

export function resolvePortOfDischarge(row, client) {
  return pickValue(row.portOfDischarge, client?.portName, client?.port) ?? DEFAULT_PORT_OF_DISCHARGE
}

export function resolveCarrier(row) {
  return pickValue(row.carrier) ?? DEFAULT_CARRIER
}
