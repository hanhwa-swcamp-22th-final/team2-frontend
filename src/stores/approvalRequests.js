import { ref } from 'vue'
import { fetchApprovalRequests } from '@/api/documents'
import { useAuthStore } from './auth'

const approvalRequests = ref([])
let loading = null

/**
 * 결재 요청 원본 리스트 로드.
 * piDocuments/poDocuments 가 각 문서에 결재자/반려사유를 병합할 때 참조하고,
 * 대시보드 승인/반려가 실행된 뒤 re-fetch 용으로도 쓰인다.
 */
export async function loadApprovalRequests() {
  try {
    const list = await fetchApprovalRequests()
    approvalRequests.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.error('Failed to load approval requests:', e)
    approvalRequests.value = []
  }
  return approvalRequests.value
}

export function useApprovalRequests() {
  if (!loading && useAuthStore().isLoggedIn) {
    loading = loadApprovalRequests()
  }
  return approvalRequests
}

/**
 * 특정 문서(PI/PO 등)에 대한 "표시용 결재 요청" 한 건을 뽑는다.
 * 우선순위:
 *   1) PENDING(대기중) 중 가장 최신
 *   2) PENDING 없으면 가장 최신(승인/반려 포함)
 * 이 규칙은 QA 리포트의 I9 (반려된 문서 상세에 반려 사유 노출) 를 만족시키기 위함.
 */
export function pickLatestRequestFor(documentType, documentId) {
  const all = approvalRequests.value.filter(
    (r) => r.documentType === documentType && r.documentId === documentId,
  )
  if (all.length === 0) return null
  const pending = all
    .filter((r) => String(r.status ?? '').toLowerCase() === 'pending')
    .sort(byRequestedAtDesc)
  if (pending.length > 0) return pending[0]
  return all.slice().sort(byRequestedAtDesc)[0]
}

function byRequestedAtDesc(a, b) {
  const ta = a?.requestedAt ? new Date(a.requestedAt).getTime() : 0
  const tb = b?.requestedAt ? new Date(b.requestedAt).getTime() : 0
  return tb - ta
}

export function clearApprovalRequests() {
  approvalRequests.value = []
  loading = null
}
