export function buildDocumentOutputHtml({ title, documentId, fields = [], lineItems = [] }) {
  const fieldRows = fields.map((field) => `
    <tr>
      <th>${escapeHtml(field.label)}</th>
      <td>${escapeHtml(field.value ?? '-')}</td>
    </tr>
  `).join('')

  const lineItemRows = lineItems.length
    ? lineItems.map((item) => `
        <tr>
          <td>${escapeHtml(item.name ?? '-')}</td>
          <td>${escapeHtml(item.quantity ?? '-')}</td>
          <td>${escapeHtml(item.unitPrice ?? '-')}</td>
          <td>${escapeHtml(item.amount ?? '-')}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" class="empty">품목 정보가 없습니다.</td></tr>'

  return `<!doctype html>
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)} - ${escapeHtml(documentId)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
        .header { margin-bottom: 24px; }
        .title { font-size: 28px; font-weight: 700; margin: 0 0 6px; }
        .subtitle { font-size: 14px; color: #64748b; margin: 0; }
        .section { margin-top: 24px; }
        .section-title { font-size: 16px; font-weight: 700; margin: 0 0 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 13px; }
        th { background: #f8fafc; text-align: left; width: 180px; }
        .line-items th { width: auto; text-align: center; }
        .line-items td { text-align: center; }
        .line-items td:first-child, .line-items th:first-child { text-align: left; }
        .empty { color: #94a3b8; }
        @media print {
          body { margin: 16px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${escapeHtml(title)}</h1>
        <p class="subtitle">문서번호: ${escapeHtml(documentId)}</p>
      </div>

      <section class="section">
        <h2 class="section-title">기본 정보</h2>
        <table>
          <tbody>${fieldRows}</tbody>
        </table>
      </section>

      <section class="section">
        <h2 class="section-title">품목 목록</h2>
        <table class="line-items">
          <thead>
            <tr>
              <th>품목</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>${lineItemRows}</tbody>
        </table>
      </section>
    </body>
  </html>`
}

export function openDocumentOutput({ title, documentId, fields, lineItems, autoPrint = false }) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=800')
  if (!printWindow) return false

  const html = buildDocumentOutputHtml({ title, documentId, fields, lineItems })
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  if (autoPrint) {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  return true
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
