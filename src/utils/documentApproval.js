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
