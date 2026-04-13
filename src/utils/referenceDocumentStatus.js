const STATUS_LABEL = {
  draft: '초안', DRAFT: '초안',
  confirmed: '확정', CONFIRMED: '확정',
  cancelled: '취소', CANCELLED: '취소',
  pending: '대기', PENDING: '대기',
  pending_approval: '결재대기', PENDING_APPROVAL: '결재대기',
  approval_pending: '결재대기', APPROVAL_PENDING: '결재대기',
  registration_requested: '등록요청', REGISTRATION_REQUESTED: '등록요청',
  modification_requested: '수정요청', MODIFICATION_REQUESTED: '수정요청',
  deletion_requested: '삭제요청', DELETION_REQUESTED: '삭제요청',
  rejected: '반려', REJECTED: '반려',
  approved: '승인', APPROVED: '승인',
  completed: '완료', COMPLETED: '완료',
  in_progress: '진행중', IN_PROGRESS: '진행중',
  preparing: '준비중', PREPARING: '준비중',
}

function normalizeStatus(status) {
  return String(status ?? '').trim()
}

function resolveDocumentPrefix(documentId) {
  const id = String(documentId ?? '')
  if (id.startsWith('PI')) return 'PI'
  if (id.startsWith('PO')) return 'PO'
  if (id.startsWith('MO')) return 'MO'
  if (id.startsWith('SO')) return 'SO'
  if (id.startsWith('SH')) return 'SH'
  if (id.startsWith('CI')) return 'CI'
  if (id.startsWith('PL')) return 'PL'
  return ''
}

function toKorean(status) {
  return STATUS_LABEL[status] ?? status
}

export function formatReferenceDocumentStatus(documentId, status) {
  const raw = normalizeStatus(status)
  const prefix = resolveDocumentPrefix(documentId)

  if (!raw) return '-'

  if (prefix === 'MO') {
    if (raw === '진행중' || raw === 'in_progress' || raw === 'IN_PROGRESS') return '생산준비'
    if (raw === '생산완료' || raw === 'completed' || raw === 'COMPLETED') return '생산완료'
  }

  if (prefix === 'SO') {
    const kr = toKorean(raw)
    if (kr === '준비중' || kr === '준비완료') return '출하준비'
    if (kr === '출하완료') return '출하완료'
  }

  if (prefix === 'SH') {
    const kr = toKorean(raw)
    if (kr === '준비중' || kr === '준비완료' || kr === '출하준비') return '출하준비'
    if (kr === '출하완료') return '출하완료'
  }

  return `${prefix} ${toKorean(raw)}`
}
