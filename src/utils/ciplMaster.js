import masterData from '../../db.json'
import { formatIncotermsLabel, getIncotermMeta } from '@/utils/incoterms'

const countriesById = new Map(
  (masterData.countries ?? []).map((country) => [String(country.id), country]),
)

const currenciesByCode = new Map(
  (masterData.currencies ?? []).map((currency) => [String(currency.code).toUpperCase(), currency]),
)

const paymentTermsById = new Map(
  (masterData.paymentTerms ?? []).map((term) => [String(term.id), term]),
)

const portsByCode = new Map(
  (masterData.ports ?? []).map((port) => [String(port.code).toUpperCase(), port]),
)

function resolveCountryLabel(countryId) {
  const country = countriesById.get(String(countryId))
  return country?.nameKr ?? country?.name ?? ''
}

export function resolveMasterCurrency(code, fallback = 'USD') {
  const currency = currenciesByCode.get(String(code ?? '').trim().toUpperCase())
  return currency?.code ?? fallback
}

export function resolvePaymentTermLabel(paymentTermsId, fallback = 'T/T REMITTANCE') {
  const term = paymentTermsById.get(String(paymentTermsId))

  if (!term) {
    return fallback
  }

  if (term.code === 'T/T') {
    return 'T/T REMITTANCE'
  }

  return term.code ?? fallback
}

export function resolvePortLabel(portCode, fallback = '-') {
  const port = portsByCode.get(String(portCode ?? '').trim().toUpperCase())

  if (!port) {
    return fallback
  }

  const countryLabel = resolveCountryLabel(port.countryId)
  return [String(port.name ?? '').toUpperCase(), countryLabel ? String(countryLabel).toUpperCase() : '']
    .filter(Boolean)
    .join(', ')
}

export function resolveIncotermsLabel(code, namedPlace = '') {
  const meta = getIncotermMeta(code)
  return formatIncotermsLabel(code || meta.code, namedPlace || meta.defaultNamedPlace)
}
