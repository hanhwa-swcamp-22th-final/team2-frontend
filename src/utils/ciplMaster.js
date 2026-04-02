import { formatIncotermsLabel, getIncotermMeta } from '@/utils/incoterms'
import { fetchCountries, fetchCurrencies, fetchPaymentTerms, fetchPorts } from '@/api/master'

const countriesById = new Map()
const currenciesByCode = new Map()
const paymentTermsById = new Map()
const portsByCode = new Map()
let cacheLoaded = false
let cachePromise = null

export async function loadCiplMasterCache() {
  if (cacheLoaded) return
  if (cachePromise) return cachePromise

  cachePromise = (async () => {
    try {
      const [countries, currencies, paymentTerms, ports] = await Promise.all([
        fetchCountries(),
        fetchCurrencies(),
        fetchPaymentTerms(),
        fetchPorts(),
      ])
      countries.forEach((c) => countriesById.set(String(c.countryId), c))
      currencies.forEach((c) => currenciesByCode.set(String(c.currencyCode).toUpperCase(), c))
      paymentTerms.forEach((t) => paymentTermsById.set(String(t.paymentTermId), t))
      ports.forEach((p) => portsByCode.set(String(p.portCode).toUpperCase(), p))
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
loadCiplMasterCache()

function resolveCountryLabel(countryId) {
  const country = countriesById.get(String(countryId))
  return country?.countryNameKr ?? country?.countryName ?? ''
}

export function resolveMasterCurrency(code, fallback = 'USD') {
  const currency = currenciesByCode.get(String(code ?? '').trim().toUpperCase())
  return currency?.currencyCode ?? fallback
}

export function resolvePaymentTermLabel(paymentTermsId, fallback = 'T/T REMITTANCE') {
  const term = paymentTermsById.get(String(paymentTermsId))

  if (!term) {
    return fallback
  }

  if (term.paymentTermCode === 'T/T') {
    return 'T/T REMITTANCE'
  }

  return term.paymentTermCode ?? fallback
}

export function resolvePortLabel(portCode, fallback = '-') {
  const port = portsByCode.get(String(portCode ?? '').trim().toUpperCase())

  if (!port) {
    return fallback
  }

  const countryLabel = resolveCountryLabel(port.countryId)
  return [String(port.portName ?? '').toUpperCase(), countryLabel ? String(countryLabel).toUpperCase() : '']
    .filter(Boolean)
    .join(', ')
}

export function resolveIncotermsLabel(code, namedPlace = '') {
  const meta = getIncotermMeta(code)
  return formatIncotermsLabel(code || meta.code, namedPlace || meta.defaultNamedPlace)
}
