import { computed, onMounted, ref } from 'vue'

import { fetchClients, fetchCountries, fetchCurrencies, fetchItems } from '@/api/master'
import masterData from '../../db.json'
import { createDocumentClientRows } from '@/utils/documentClientRows'

function createDefaultClientRows() {
  return createDocumentClientRows()
}

function createDefaultProductRows() {
  return (masterData.items ?? []).map((item) => ({
    id: String(item.id),
    code: item.code ?? '-',
    name: item.name ?? '-',
    nameKr: item.nameKr ?? '-',
    spec: item.spec ?? '-',
    unit: item.unit ?? '-',
    unitPrice: item.unitPrice ?? 0,
    hsCode: item.hsCode ?? '-',
    category: item.category ?? '-',
    status: item.status ?? '-',
  }))
}

function includesKeyword(row, fields, keyword) {
  if (!keyword) return true

  return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(keyword))
}

export function useSearchModalLookups() {
  const clientRowsSource = ref(createDefaultClientRows())
  const productRowsSource = ref(createDefaultProductRows())

  async function loadSearchModalLookups() {
    try {
      const [clientsData, countriesData, currenciesData, itemsData] = await Promise.all([
        fetchClients(),
        fetchCountries(),
        fetchCurrencies(),
        fetchItems(),
      ])

      const countryMap = new Map(
        countriesData.map((country) => [String(country.id), country.nameKr ?? country.name ?? '-']),
      )

      const currencyMap = new Map(
        currenciesData.map((currency) => [String(currency.id), currency.code ?? '-']),
      )

      clientRowsSource.value = clientsData.map((client) => ({
        id: String(client.id),
        code: client.code ?? '-',
        name: client.name ?? '-',
        country: countryMap.get(String(client.countryId)) ?? '-',
        city: client.city ?? '-',
        currency: currencyMap.get(String(client.currencyId)) ?? '-',
        manager: client.manager ?? '-',
        tel: client.tel ?? '-',
        status: client.status ?? '-',
      }))

      productRowsSource.value = itemsData.map((item) => ({
        id: String(item.id),
        code: item.code ?? '-',
        name: item.name ?? '-',
        nameKr: item.nameKr ?? '-',
        spec: item.spec ?? '-',
        unit: item.unit ?? '-',
        unitPrice: item.unitPrice ?? 0,
        hsCode: item.hsCode ?? '-',
        category: item.category ?? '-',
        status: item.status ?? '-',
      }))
    } catch {
      clientRowsSource.value = createDefaultClientRows()
      productRowsSource.value = createDefaultProductRows()
    }
  }

  onMounted(loadSearchModalLookups)

  function createClientRows(keywordRef) {
    return computed(() => {
      const keyword = keywordRef.value.trim().toLowerCase()
      return clientRowsSource.value.filter((row) => includesKeyword(
        row,
        ['code', 'name', 'country', 'city', 'currency', 'manager', 'tel', 'status'],
        keyword,
      ))
    })
  }

  function createProductRows(keywordRef) {
    return computed(() => {
      const keyword = keywordRef.value.trim().toLowerCase()
      return productRowsSource.value.filter((row) => includesKeyword(
        row,
        ['code', 'name', 'nameKr', 'spec', 'unit', 'hsCode', 'category', 'status'],
        keyword,
      ))
    })
  }

  return {
    clientRowsSource,
    productRowsSource,
    createClientRows,
    createProductRows,
    reloadSearchModalLookups: loadSearchModalLookups,
  }
}
