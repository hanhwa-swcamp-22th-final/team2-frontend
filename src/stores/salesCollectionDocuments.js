import { ref } from 'vue'

import masterData from '../../db.json'

function normalizeDocumentCode(value = '') {
  return String(value ?? '').replace(/[^A-Za-z0-9]/g, '')
}

function normalizeCollectionRow(row) {
  return {
    ...row,
    poId: normalizeDocumentCode(row.poId),
    collectionDate: row.status === '수금완료' ? row.collectionDate || null : null,
  }
}

function createInitialSalesCollectionDocuments() {
  return (masterData.salesCollections ?? []).map(normalizeCollectionRow)
}

const salesCollectionDocuments = ref(createInitialSalesCollectionDocuments())

export function useSalesCollectionDocuments() {
  return salesCollectionDocuments
}

export function normalizeSalesCollectionRow(row) {
  return normalizeCollectionRow(row)
}
