import { ref } from 'vue'
import { fetchCountries, fetchCurrencies, fetchPaymentTerms, fetchPorts } from '@/api/master'

export function useMasterLookup() {
  const countries = ref([])
  const ports = ref([])
  const currencies = ref([])
  const paymentTerms = ref([])

  async function loadReferenceData() {
    const [countriesData, portsData, currenciesData, paymentTermsData] = await Promise.all([
      fetchCountries(),
      fetchPorts(),
      fetchCurrencies(),
      fetchPaymentTerms(),
    ])
    countries.value = countriesData
    ports.value = portsData
    currencies.value = currenciesData
    paymentTerms.value = paymentTermsData
  }

  function getCountryName(countryId, { detailed = false } = {}) {
    const found = countries.value.find((c) => String(c.countryId) === String(countryId))
    if (!found) return '-'
    return detailed ? `${found.countryNameKr} (${found.countryName})` : found.countryName
  }

  function getPortName(portId) {
    const found = ports.value.find((p) => String(p.id) === String(portId))
    return found ? found.portName : '-'
  }

  function getPaymentTermsLabel(paymentTermsId, { detailed = false } = {}) {
    const found = paymentTerms.value.find((p) => String(p.paymentTermId) === String(paymentTermsId))
    if (!found) return '-'
    return detailed ? `${found.paymentTermCode} (${found.paymentTermDescription})` : found.paymentTermCode
  }

  function getCurrencyLabel(currencyId, { detailed = false } = {}) {
    const found = currencies.value.find((c) => String(c.currencyId) === String(currencyId))
    if (!found) return '-'
    return detailed ? `${found.currencyCode} (${found.currencySymbol})` : found.currencyCode
  }

  return {
    countries,
    ports,
    currencies,
    paymentTerms,
    loadReferenceData,
    getCountryName,
    getPortName,
    getPaymentTermsLabel,
    getCurrencyLabel,
  }
}
