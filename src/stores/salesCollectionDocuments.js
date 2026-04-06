import { ref } from 'vue'
import { fetchCollections } from '@/api/documents'

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
let loading = null

async function loadSalesCollectionDocuments() {
  try {
    const data = await fetchCollections()
    salesCollectionDocuments.value = (Array.isArray(data) ? data : []).map(normalizeCollectionRow)
  } catch (e) {
    console.error('Failed to load sales collection documents:', e)
  }
}

export function useSalesCollectionDocuments() {
  if (!loading) {
    loading = loadSalesCollectionDocuments()
  }
  return salesCollectionDocuments
}

export function normalizeSalesCollectionRow(row) {
  return normalizeCollectionRow(row)
}
