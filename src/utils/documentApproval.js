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
    { label: '결재자', value: approver || '-' },
    { label: '요청자', value: requesterName || '-' },
    { label: '문서 상태', value: documentStatus || '-' },
    { label: '요청 상태', value: requestStatus || '-' },
    { label: '처리 방식', value: applyPolicy || '-', fullWidth: true },
    { label: '요청 시각', value: requestedAt || '-' },
  ]
}

export function buildApprovalInfoRows(document) {
  if (!document?.requestStatus) {
    return []
  }

  return [
    { label: '문서 상태', value: document.status || '-' },
    { label: '결재 상태', value: document.approvalStatus || '-' },
    { label: '요청 상태', value: document.requestStatus || '-' },
    { label: '결재자', value: document.approver || '-' },
    { label: '요청자', value: document.approvalRequestedBy || '-' },
    { label: '요청 시각', value: document.approvalRequestedAt || '-' },
  ]
}
