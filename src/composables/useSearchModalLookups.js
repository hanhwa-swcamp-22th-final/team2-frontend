import { computed, onMounted, ref } from 'vue'

import { fetchClients, fetchItems } from '@/api/master'

function includesKeyword(row, fields, keyword) {
  if (!keyword) return true

  return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(keyword))
}

export function useSearchModalLookups() {
  const clientRowsSource = ref([])
  const productRowsSource = ref([])

  async function loadSearchModalLookups() {
    try {
      const [clientsData, itemsData] = await Promise.all([
        fetchClients(),
        fetchItems(),
      ])

      clientRowsSource.value = clientsData.map((client) => ({
        id: String(client.clientId),
        code: client.clientCode ?? '-',
        name: client.clientName ?? '-',
        country: client.countryName ?? '-',
        city: client.clientCity ?? '-',
        status: client.clientStatus ?? '-',
      }))

      productRowsSource.value = itemsData.map((item) => ({
        id: String(item.itemId),
        code: item.itemCode ?? '-',
        name: item.itemName ?? '-',
        nameKr: item.itemNameKr ?? '-',
        spec: item.itemSpec ?? '-',
        unit: item.itemUnit ?? '-',
        unitPrice: item.itemUnitPrice ?? 0,
        category: item.itemCategory ?? '-',
        status: item.itemStatus ?? '-',
      }))
    } catch {
      clientRowsSource.value = []
      productRowsSource.value = []
    }
  }

  onMounted(loadSearchModalLookups)

  function createClientRows(keywordRef) {
    return computed(() => {
      const keyword = keywordRef.value.trim().toLowerCase()
      return clientRowsSource.value.filter((row) => includesKeyword(
        row,
        ['code', 'name', 'country', 'city', 'status'],
        keyword,
      ))
    })
  }

  function createProductRows(keywordRef) {
    return computed(() => {
      const keyword = keywordRef.value.trim().toLowerCase()
      return productRowsSource.value.filter((row) => includesKeyword(
        row,
        ['code', 'name', 'nameKr', 'spec', 'unit', 'category', 'status'],
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
