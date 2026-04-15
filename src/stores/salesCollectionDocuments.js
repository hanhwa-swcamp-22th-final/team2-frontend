import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchCollectionsPaged } from '@/api/documents'

function normalizeDocumentCode(value = '') {
  return String(value ?? '').replace(/[^A-Za-z0-9]/g, '')
}

function normalizeCollectionRow(row) {
  return {
    ...row,
    poId: row.poId ? normalizeDocumentCode(row.poId) : (row.poNo ?? ''),
    collectionDate: row.status === '수금완료' ? row.collectionDate || null : null,
  }
}

const salesCollectionDocuments = ref([])
const salesCollectionPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
let loading = null

async function loadSalesCollectionDocuments({ page = 0, size = 1000 } = {}) {
  try {
    const { content, page: pageInfo } = await fetchCollectionsPaged({ page, size })
    salesCollectionDocuments.value = (Array.isArray(content) ? content : []).map(normalizeCollectionRow)
    salesCollectionPageInfo.value = pageInfo
  } catch (e) {
    console.error('Failed to load sales collection documents:', e)
  }
}

export function useSalesCollectionDocuments() {
  if (!loading && useAuthStore().isLoggedIn) {
    loading = loadSalesCollectionDocuments()
  }
  return salesCollectionDocuments
}

export function useSalesCollectionPageInfo() {
  return salesCollectionPageInfo
}

export function normalizeSalesCollectionRow(row) {
  return normalizeCollectionRow(row)
}
