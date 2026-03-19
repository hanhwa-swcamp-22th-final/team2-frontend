import { computed, ref } from 'vue'

/**
 * 문서 목록 페이지 공통 필터 composable
 *
 * @param {import('vue').Ref<Array>} rows - 원본 데이터 배열 ref
 * @param {Object} options
 * @param {Array<string>} options.keywordFields - 키워드 검색 대상 필드명 배열
 * @param {string} options.issueDateField - 발행일 필드명 (기본: 'issueDate')
 * @param {string} options.deliveryDateField - 납기 필드명 (기본: 'deliveryDate')
 * @param {string} options.codeField - 코드/번호 필드명 (기본: 'id')
 * @param {string} options.clientField - 거래처 필드명 (기본: 'clientName')
 * @param {string} options.productField - 품목 필드명 (기본: 'itemName')
 */
export function useDocumentFilter(rows, options = {}) {
  const {
    keywordFields = ['id', 'clientName', 'country', 'itemName', 'amount', 'manager', 'status', 'issueDate', 'deliveryDate'],
    issueDateField = 'issueDate',
    deliveryDateField = 'deliveryDate',
    codeField = 'id',
    clientField = 'clientName',
    productField = 'itemName',
  } = options

  const filters = ref(getEmptyFilters())
  const appliedFilters = ref(getEmptyFilters())

  function getEmptyFilters() {
    return {
      keyword: '',
      registeredFrom: '',
      registeredTo: '',
      manager: '',
      clientName: '',
      code: '',
      productName: '',
      country: '',
      status: '',
      deliveryFrom: '',
      deliveryTo: '',
    }
  }

  function normalizeDate(value) {
    return String(value ?? '').replaceAll('/', '-')
  }

  function resetFilters() {
    filters.value = getEmptyFilters()
    appliedFilters.value = getEmptyFilters()
  }

  function applyFilters() {
    appliedFilters.value = { ...filters.value }
  }

  const filteredRows = computed(() => {
    return rows.value.filter((row) => {
      const keyword = appliedFilters.value.keyword.trim().toLowerCase()

      if (keyword) {
        const matched = keywordFields.some(
          (field) => String(row[field] ?? '').toLowerCase().includes(keyword),
        )
        if (!matched) return false
      }

      if (appliedFilters.value.manager && row.manager !== appliedFilters.value.manager) return false
      if (appliedFilters.value.clientName && !String(row[clientField] ?? '').toLowerCase().includes(appliedFilters.value.clientName.toLowerCase())) return false
      if (appliedFilters.value.code && !String(row[codeField] ?? '').toLowerCase().includes(appliedFilters.value.code.toLowerCase())) return false
      if (appliedFilters.value.productName && !String(row[productField] ?? '').toLowerCase().includes(appliedFilters.value.productName.toLowerCase())) return false
      if (appliedFilters.value.country && row.country !== appliedFilters.value.country) return false
      if (appliedFilters.value.status && row.status !== appliedFilters.value.status) return false

      const issueDate = normalizeDate(row[issueDateField])
      const deliveryDate = normalizeDate(row[deliveryDateField])

      if (appliedFilters.value.registeredFrom && issueDate < appliedFilters.value.registeredFrom) return false
      if (appliedFilters.value.registeredTo && issueDate > appliedFilters.value.registeredTo) return false
      if (appliedFilters.value.deliveryFrom && deliveryDate < appliedFilters.value.deliveryFrom) return false
      if (appliedFilters.value.deliveryTo && deliveryDate > appliedFilters.value.deliveryTo) return false

      return true
    })
  })

  return {
    filters,
    appliedFilters,
    filteredRows,
    resetFilters,
    applyFilters,
    normalizeDate,
  }
}
