/**
 * 변경 이력(revision history) 항목을 가독성 있는 문자열로 변환
 */

const ACTION_LABEL = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  APPROVE: '승인',
  REJECT: '반려',
  REQUEST: '요청',
  REVIEW_APPROVED: '승인 처리',
  REVIEW_REJECTED: '반려 처리',
}

function formatTimestamp(value) {
  if (!value) return ''
  const str = String(value)
  if (str.includes('T')) {
    const [date, time] = str.split('T')
    return `${date.replace(/-/g, '/')} ${time.substring(0, 5)}`
  }
  return str
}

/**
 * revision 객체를 한 줄 요약 문자열로 변환
 * @param {string|object} rev
 * @returns {string}
 */
export function formatRevisionEntry(rev) {
  if (typeof rev === 'string') return rev

  if (!rev || typeof rev !== 'object') return String(rev ?? '')

  const action = ACTION_LABEL[rev.action] ?? rev.action ?? ''
  const docType = rev.docType ?? ''
  const docCode = rev.docCode ?? ''
  const message = rev.message ?? ''
  const timestamp = formatTimestamp(rev.timestamp ?? rev.createdAt ?? '')

  if (message) {
    return timestamp ? `${timestamp} — ${message}` : message
  }

  const parts = [timestamp, docType, docCode, action].filter(Boolean)
  return parts.join(' ') || JSON.stringify(rev)
}
