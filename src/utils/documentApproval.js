export const REGISTRATION_DOCUMENT_STATUS = '결재대기'
export const REGISTRATION_APPROVAL_STATUS = '대기'
export const REGISTRATION_REQUEST_STATUS = '등록요청'
export const REGISTRATION_APPROVAL_ACTION = '등록'
export const EDIT_REQUEST_DOCUMENT_STATUS = '결재대기'
export const EDIT_REQUEST_APPROVAL_STATUS = '대기'
export const EDIT_REQUEST_STATUS = '수정요청'
export const EDIT_REQUEST_APPROVAL_ACTION = '수정'
export const DELETE_REQUEST_DOCUMENT_STATUS = '결재대기'
export const DELETE_REQUEST_APPROVAL_STATUS = '대기'
export const DELETE_REQUEST_STATUS = '삭제요청'
export const DELETE_REQUEST_APPROVAL_ACTION = '삭제'

export function createRegistrationApprovalMeta({ approver, requesterName, requestedAt }) {
  return {
    approver: approver || '',
    status: REGISTRATION_DOCUMENT_STATUS,
    approvalStatus: REGISTRATION_APPROVAL_STATUS,
    requestStatus: REGISTRATION_REQUEST_STATUS,
    approvalAction: REGISTRATION_APPROVAL_ACTION,
    approvalRequestedBy: requesterName,
    approvalRequestedAt: requestedAt,
  }
}

export function createEditApprovalMeta({ approver, requesterName, requestedAt }) {
  return {
    approver: approver || '',
    status: EDIT_REQUEST_DOCUMENT_STATUS,
    approvalStatus: EDIT_REQUEST_APPROVAL_STATUS,
    requestStatus: EDIT_REQUEST_STATUS,
    approvalAction: EDIT_REQUEST_APPROVAL_ACTION,
    approvalRequestedBy: requesterName,
    approvalRequestedAt: requestedAt,
  }
}

export function createDeleteApprovalMeta({ approver, requesterName, requestedAt }) {
  return {
    approver: approver || '',
    status: DELETE_REQUEST_DOCUMENT_STATUS,
    approvalStatus: DELETE_REQUEST_APPROVAL_STATUS,
    requestStatus: DELETE_REQUEST_STATUS,
    approvalAction: DELETE_REQUEST_APPROVAL_ACTION,
    approvalRequestedBy: requesterName,
    approvalRequestedAt: requestedAt,
  }
}

export function buildApprovalRequestRows({
  approver,
  requesterName,
  requestedAt,
  documentStatus,
  requestStatus,
  requestTypeLabel,
  applyPolicy,
}) {
  return [
    { label: '요청 유형', value: requestTypeLabel },
    { label: '결재자', value: approver || '미지정' },
    { label: '요청자', value: requesterName || '미지정' },
    { label: '문서 상태', value: documentStatus || '-' },
    { label: '요청 상태', value: requestStatus || '-' },
    { label: '처리 방식', value: applyPolicy || '-', fullWidth: true },
    { label: '요청 시각', value: requestedAt || '-' },
  ]
}

// 문서 상태 + 요청 상태 + 결재 상태를 단일 라벨로 합산.
// 백엔드가 영문 code('pending_approval','pending','approved','rejected')를 내려줄 때와
// 프론트 로컬 뮤테이션으로 한글('결재대기','대기','승인','반려')을 박아 둔 상태를 둘 다 수용.
function resolveCompositeStatus(document) {
  const normalize = (v) => String(v ?? '').trim().toLowerCase()
  const statusNorm = normalize(document.status)
  const approvalNorm = normalize(document.approvalStatus)
  const request = document.requestStatus || ''

  const isPendingApproval =
      statusNorm === '결재대기' || statusNorm === 'approval_pending' || statusNorm === 'pending_approval'
  if (isPendingApproval && request) {
    if (approvalNorm === '대기' || approvalNorm === 'pending') return `${request} 결재대기`
    if (approvalNorm === '승인' || approvalNorm === 'approved') return `${request} 승인`
    if (approvalNorm === '반려' || approvalNorm === 'rejected') return `${request} 반려`
    return `${request} 결재대기`
  }
  return document.status || '-'
}

export function buildApprovalInfoRows(document) {
  if (!document?.requestStatus) {
    return []
  }

  const rows = [
    { label: '상태', value: resolveCompositeStatus(document) },
    // approvalRequests 병합 결과로 붙는 approverName 을 우선. 과거 로컬 뮤테이션으로만
    // 채워지던 document.approver 는 백업 fallback.
    { label: '결재자', value: document.approverName || document.approver || '미지정' },
    { label: '요청자', value: document.approvalRequestedBy || '미지정' },
    { label: '요청 시각', value: document.approvalRequestedAt || '-' },
  ]

  // 반려 상태일 때 사유 노출 (I9). 상태 정규화는 resolveCompositeStatus 와 동일 규칙.
  const statusNorm = String(document.status ?? '').trim().toLowerCase()
  const approvalNorm = String(document.approvalStatus ?? '').trim().toLowerCase()
  const isRejected =
    statusNorm === '반려' ||
    statusNorm === 'rejected' ||
    approvalNorm === '반려' ||
    approvalNorm === 'rejected'
  if (isRejected && document.approvalRejectReason) {
    rows.push({ label: '반려 사유', value: document.approvalRejectReason, fullWidth: true })
  }

  return rows
}
