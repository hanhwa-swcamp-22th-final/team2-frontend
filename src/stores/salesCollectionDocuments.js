import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchCollectionsPaged } from '@/api/documents'

function normalizeDocumentCode(value = '') {
  return String(value ?? '').replace(/[^A-Za-z0-9]/g, '')
}

const COLLECTION_STATUS_LABEL = {
  paid: '수금완료',
  unpaid: '미수금',
  '수금완료': '수금완료',
  '미수금': '미수금',
}

function normalizeCollectionStatus(raw) {
  if (raw == null || raw === '') return '미수금'
  return COLLECTION_STATUS_LABEL[String(raw).toLowerCase()] ?? COLLECTION_STATUS_LABEL[raw] ?? '미수금'
}

function toSlashDate(value) {
  if (!value) return ''
  // LocalDateTime 직렬화("2026-04-18T15:15:38") 가 fallback 으로 내려오면 T 이후를 잘라
  // "2026/04/18" 만 표시. "2026-04-18" 같은 순수 LocalDate 는 그대로 - → / 치환.
  const dateOnly = String(value).split('T')[0]
  return dateOnly.replace(/-/g, '/')
}

function normalizeCollectionRow(row) {
  const status = normalizeCollectionStatus(row.status)
  return {
    ...row,
    status,
    poId: row.poId ? normalizeDocumentCode(row.poId) : (row.poNo ?? ''),
    // 정렬/표시용 필드 — 백엔드가 일부를 null 로 내려주는 경우 페이지 렌더가 localeCompare 에서 죽는다.
    currency: row.currency ?? row.currencyCode ?? row.poCurrencyCode ?? '',
    // 화면 column 은 salesAmount/manager 키를 참조. 백엔드 CollectionResponse 는
    // totalAmount/managerName 로 내려주므로 여기서 정렬.
    salesAmount: row.salesAmount ?? row.totalAmount ?? null,
    manager: row.manager ?? row.managerName ?? '',
    country: row.country ?? '',
    clientName: row.clientName ?? '',
    issueDate: toSlashDate(row.issueDate ?? row.collectionIssueDate ?? row.createdAt ?? ''),
    collectionDate: status === '수금완료' ? row.collectionDate || null : null,
  }
}

const salesCollectionDocuments = ref([])
const salesCollectionPageInfo = ref({ size: 1000, number: 0, totalElements: 0, totalPages: 0 })
let loading = null

export async function loadSalesCollectionDocuments({ page = 0, size = 1000 } = {}) {
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

export function clearSalesCollectionDocuments() {
  salesCollectionDocuments.value = []
  salesCollectionPageInfo.value = { size: 1000, number: 0, totalElements: 0, totalPages: 0 }
  loading = null
}

export function useSalesCollectionPageInfo() {
  return salesCollectionPageInfo
}

export function normalizeSalesCollectionRow(row) {
  return normalizeCollectionRow(row)
}
