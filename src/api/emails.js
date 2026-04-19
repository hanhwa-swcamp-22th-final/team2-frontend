import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

export async function fetchActivityEmails() {
  const { data } = await api.get('/email-logs')
  // 백엔드 응답은 { clientName, types: [{emailLogTypeId, emailDocType}], ... } 형태.
  // UI 는 e.client (문자열), e.types (문자열 배열) 를 기대하므로 여기서 평탄화.
  return unwrapCollection(data).map((row) => ({
    ...row,
    client: row.client ?? row.clientName ?? '-',
    types: (row.types ?? row.docTypes ?? [])
      .map((t) => (typeof t === 'string' ? t : (t?.emailDocType ?? t?.docType ?? t?.type ?? t?.name)))
      .filter(Boolean),
    recipient: row.recipient ?? row.recipientName ?? row.emailRecipientName ?? '',
    email: row.email ?? row.recipientEmail ?? row.emailRecipientEmail ?? '',
    sender: row.sender ?? row.senderName ?? '-',
    sentAt: row.sentAt ?? row.sentDate ?? row.emailSentAt ?? '',
  }))
}

/**
 * 문서를 첨부한 메일을 발송한다 (Documents 서비스).
 * @param {Object} payload
 * @param {number} payload.clientId       거래처 ID (필수)
 * @param {string} [payload.poId]         발주서 코드 (CI/PL 발송 시 필수)
 * @param {string} payload.emailTitle     메일 제목
 * @param {string} [payload.emailRecipientName]
 * @param {string} payload.emailRecipientEmail
 * @param {string[]} payload.docTypes     ['CI'] | ['PL'] | ['PI'] 등
 * @returns {Promise<{status:'SENT'|'FAILED', message:string, attachmentFilenames:string[]}>}
 */
export async function sendDocumentEmail(payload) {
  const { data } = await api.post('/emails/send', payload)
  return data
}

/**
 * 실패한 이메일 로그를 재전송한다 (Activity 서비스 → Documents 서비스).
 * @param {number} emailLogId
 * @returns {Promise<Object>} EmailLog 응답
 */
export async function resendEmailLog(emailLogId) {
  const { data } = await api.post(`/email-logs/${emailLogId}/resend`)
  return data
}
