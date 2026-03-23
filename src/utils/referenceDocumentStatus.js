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

export function formatReferenceDocumentStatus(documentId, status) {
  const normalizedStatus = normalizeStatus(status)
  const prefix = resolveDocumentPrefix(documentId)

  if (!normalizedStatus) return '-'

  if (prefix === 'MO') {
    if (normalizedStatus === '진행중') return '생산준비'
    if (normalizedStatus === '생산완료') return '생산완료'
  }

  if (prefix === 'SO') {
    if (normalizedStatus === '준비중' || normalizedStatus === '준비완료') return '출하준비'
    if (normalizedStatus === '출하완료') return '출하완료'
  }

  if (prefix === 'SH') {
    if (normalizedStatus === '준비중' || normalizedStatus === '준비완료' || normalizedStatus === '출하준비') return '출하준비'
    if (normalizedStatus === '출하완료') return '출하완료'
  }

  if (prefix === 'PI') {
    return `PI ${normalizedStatus}`
  }

  if (prefix === 'PO') {
    return `PO ${normalizedStatus}`
  }

  if (prefix === 'CI') {
    return `CI ${normalizedStatus}`
  }

  if (prefix === 'PL') {
    return `PL ${normalizedStatus}`
  }

  return normalizedStatus
}
