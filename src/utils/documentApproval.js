export const REGISTRATION_DOCUMENT_STATUS = '결재대기'
export const REGISTRATION_APPROVAL_STATUS = '대기'
export const REGISTRATION_REQUEST_STATUS = '등록요청'
export const REGISTRATION_APPROVAL_ACTION = '등록'

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
