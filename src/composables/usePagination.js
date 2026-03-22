import { computed, ref, watch } from 'vue'

export function usePagination(rows, pageSize = 10) {
  const currentPage = ref(1)

  const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)))

  const paginatedRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return rows.value.slice(start, start + pageSize)
  })

  watch(rows, () => {
    currentPage.value = 1
  })

  watch(totalPages, (nextTotalPages) => {
    if (currentPage.value > nextTotalPages) {
      currentPage.value = nextTotalPages
    }
  })

  return {
    currentPage,
    totalPages,
    paginatedRows,
  }
}
