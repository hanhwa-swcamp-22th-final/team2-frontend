import { computed, onMounted, ref } from 'vue'

import { fetchClients, fetchCountries, fetchCurrencies, fetchItems } from '@/api/master'

const fallbackClientRows = [
  {
    id: '1',
    code: 'CLI001',
    name: 'Global Steel Corp.',
    country: '미국',
    city: 'Houston',
    currency: 'USD',
    manager: 'John Smith',
    tel: '+1-713-555-0101',
    status: '활성',
  },
  {
    id: '2',
    code: 'CLI003',
    name: 'Tokyo Trading Co.',
    country: '일본',
    city: 'Tokyo',
    currency: 'JPY',
    manager: 'Tanaka Yuki',
    tel: '+81-3-555-0303',
    status: '활성',
  },
  {
    id: '3',
    code: 'CLI020',
    name: 'Hanoi Digital JSC',
    country: '베트남',
    city: 'Hanoi',
    currency: 'USD',
    manager: 'Pham Thi Lan',
    tel: '+84-24-555-2010',
    status: '활성',
  },
]

const fallbackProductRows = [
  {
    id: '1',
    code: 'ITM001',
    name: 'Wireless Presenter',
    nameKr: '무선 프레젠터',
    spec: '2.4GHz / 100m / USB Receiver / Laser Pointer',
    unit: 'EA',
    unitPrice: 55000,
    hsCode: '8471.60',
    category: 'Electronics',
    status: '활성',
  },
  {
    id: '2',
    code: 'ITM003',
    name: 'Smart Projector FHD',
    nameKr: '스마트 프로젝터 FHD',
    spec: 'FHD 1920×1080 / 3500lm / HDMI / WiFi / BT',
    unit: 'EA',
    unitPrice: 780000,
    hsCode: '8528.62',
    category: 'Electronics',
    status: '활성',
  },
  {
    id: '3',
    code: 'ITM010',
    name: 'Smart Whiteboard 65"',
    nameKr: '스마트 화이트보드 65형',
    spec: '65" 4K Touch / Android / WiFi / HDMI / 20pt',
    unit: 'EA',
    unitPrice: 3500000,
    hsCode: '8528.52',
    category: 'Electronics',
    status: '활성',
  },
]

function includesKeyword(row, fields, keyword) {
  if (!keyword) return true

  return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(keyword))
}

export function useSearchModalLookups() {
  const clientRowsSource = ref([...fallbackClientRows])
  const productRowsSource = ref([...fallbackProductRows])

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
      clientRowsSource.value = [...fallbackClientRows]
      productRowsSource.value = [...fallbackProductRows]
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
