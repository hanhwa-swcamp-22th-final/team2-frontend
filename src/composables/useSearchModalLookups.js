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
        // 소비자(POPage 등)가 numeric clientId 를 기대. id 를 문자열로 쓰는 코드와
        // 공존시키기 위해 clientId 를 별도 필드로도 보존. 이 매핑이 clientId 를 버려서
        // PO 생성 payload 의 clientId 가 null → 백엔드 0 fallback → 하류 CI/PL/활동-PO
        // 매칭 전부 깨지던 블로커 (시연 2026-04-21 재현). email 필드도 CI/PL 메일 모달
        // default-recipient-email 로 쓰므로 포함.
        clientId: client.clientId ?? null,
        clientEmail: client.clientEmail ?? '',
        code: client.clientCode ?? '-',
        name: client.clientName ?? '-',
        country: client.countryName ?? '-',
        city: client.clientCity ?? '-',
        status: client.clientStatus ?? '-',
      }))

      productRowsSource.value = itemsData.map((item) => ({
        id: String(item.itemId),
        itemId: item.itemId ?? null,
        code: item.itemCode ?? '-',
        name: item.itemName ?? '-',
        nameKr: item.itemNameKr ?? '-',
        spec: item.itemSpec ?? '-',
        unit: item.itemUnit ?? '-',
        unitPrice: item.itemUnitPrice ?? 0,
        weight: item.itemWeight ?? 0,
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
