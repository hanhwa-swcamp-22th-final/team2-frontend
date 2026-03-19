/**
 * documentOutput.js — 문서 출력(인쇄/PDF) 유틸리티
 *
 * 목적:
 *   - 문서 양식을 새 창에 렌더링하고 브라우저 인쇄 기능을 호출합니다.
 *   - PDF 저장은 브라우저 인쇄 대화상자의 "PDF로 저장" 옵션을 활용합니다.
 *
 * 왜 새 창(window.open) 방식인가?
 *   → 인쇄 시 앱의 사이드바/헤더를 완전히 제외하고 문서 양식만 출력하기 위함입니다.
 *   → CSS @media print보다 확실하게 레이아웃을 제어할 수 있습니다.
 *
 * 문서별 빌더 함수:
 *   - buildPIOutputHtml()   : PI (Proforma Invoice)
 *   - buildPOOutputHtml()   : PO (Purchase Order)
 *   - buildCIOutputHtml()   : CI (Commercial Invoice)
 *   - buildPLOutputHtml()   : PL (Packing List)
 *   - buildProductionOrderOutputHtml() : 생산지시서
 *   - buildShipmentOrderOutputHtml()   : 출하지시서
 */

import {
  normalizeCIItems,
  normalizePLItems,
  resolveConsigneeAddress,
  resolveConsigneeAttention,
  resolvePortOfDischarge,
  resolveShipperAddress,
  resolveShipperName,
} from '@/utils/ciplTemplate'
import { buildInstructionSheetDocument } from '@/utils/instructionSheetTemplate'

// ────────────────────────────────────────────
// 공통 스타일 — 모든 문서 양식에 적용
// ────────────────────────────────────────────
const commonStyles = `
  html { background: #e2e8f0; }
  body { max-width: 794px; box-sizing: border-box; font-family: 'Noto Sans KR', Arial, sans-serif; margin: 24px auto; padding: 38px 42px 44px; background: #fff; border: 1px solid #cbd5e1; color: #0f172a; line-height: 1.6; }
  .doc-header { text-align: center; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 1.5px solid #0f172a; }
  .doc-title { font-size: 24px; font-weight: 700; letter-spacing: 0.28em; margin: 0; text-transform: uppercase; }
  .info-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #64748b; }
  .info-table td { border: 1px solid #94a3b8; padding: 10px 12px; font-size: 11.5px; vertical-align: top; background: #fff; }
  .info-label { background: #f8fafc; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; white-space: nowrap; }
  .shipping-info-table .info-label { white-space: normal; word-break: keep-all; line-height: 1.3; }
  .info-value { color: #0f172a; line-height: 1.55; }
  .company-cell, .party-cell { padding-top: 12px; padding-bottom: 12px; }
  .company-name, .party-name { margin-bottom: 4px; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; color: #0f172a; }
  .company-address, .party-address, .party-contact { font-size: 11px; color: #475569; }
  .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 22px; border: 1.5px solid #64748b; }
  .items-table th { background: #eef2f7; border: 1px solid #94a3b8; border-bottom: 1.5px solid #64748b; padding: 9px 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-align: center; text-transform: uppercase; color: #334155; }
  .items-table td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11.5px; color: #0f172a; }
  .items-table tbody tr { height: 38px; }
  .items-table tfoot td { background: #f8fafc; border-top: 1.5px solid #64748b; padding: 10px 12px; font-size: 12px; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .signature { margin-top: 42px; padding-top: 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: flex-end; }
  .sig-box { text-align: center; width: 220px; }
  .sig-line { border-bottom: 1px solid #0f172a; height: 58px; }
  .sig-label { margin: 8px 0 0; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
  .approval { margin-top: 40px; display: flex; justify-content: flex-end; }
  .approval-table { border-collapse: collapse; width: 240px; }
  .approval-table th { border: 1px solid #94a3b8; background: #f1f5f9; padding: 6px 12px; font-size: 11px; font-weight: 700; text-align: center; }
  .approval-cell { border: 1px solid #94a3b8; height: 50px; width: 80px; }
  @media print { html { background: #fff; } body { max-width: none; margin: 0; padding: 18px 20px; border: 0; } }
`

// ────────────────────────────────────────────
// 유틸: HTML 특수문자 이스케이프
// ────────────────────────────────────────────
function esc(value) {
  return String(value ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function parseIncoterms(value) {
  const parts = String(value ?? '').trim().split(/\s+/).filter(Boolean)

  return {
    code: parts[0] || '-',
    place: parts.slice(1).join(' ') || '-',
  }
}

// 빈 행 생성 (최소 행 수 확보용)
function emptyRows(count, cols) {
  return Array.from({ length: Math.max(0, count) }, () =>
    `<tr>${'<td>&nbsp;</td>'.repeat(cols)}</tr>`,
  ).join('')
}

// ────────────────────────────────────────────
// HTML 프레임 감싸기
// ────────────────────────────────────────────
function wrapHtml(title, documentId, bodyContent) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} - ${esc(documentId)}</title>
  <style>${commonStyles}</style>
</head>
<body>
  <div class="doc-header">
    <h1 class="doc-title">${esc(title)}</h1>
  </div>
  ${bodyContent}
</body>
</html>`
}

function renderInstructionSheetOutputHtml(doc, kind) {
  const sheet = buildInstructionSheetDocument(doc, kind)
  const metaRows = sheet.metaFields.map((field) => `
    <tr>
      <th>${esc(field.label)}</th>
      <td>${esc(field.value)}</td>
    </tr>`).join('')

  const bodyRows = sheet.renderRows.map((row) => `
    <tr>
      <td class="text-center">${esc(row.no)}</td>
      <td>${esc(row.clientName)}</td>
      <td>${esc(row.modelName)}</td>
      <td>${esc(row.itemName)}</td>
      <td>${esc(row.spec)}</td>
      <td class="text-center">${esc(row.quantity)}</td>
      <td class="text-center due-date-cell">${esc(row.dueDate)}</td>
      <td>${esc(row.remark)}</td>
    </tr>`).join('')

  const changeLogRows = sheet.changeLogRows.map((row) => `
    <tr>
      <td>${esc(row.department)}</td>
      <td>${esc(row.signer)}</td>
    </tr>`).join('')

  const styles = `
    body { margin: 20px; background: #fff; color: #111; font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; }
    .instruction-sheet { font-size: 11px; line-height: 1.25; }
    .sheet-head-table, .meta-table, .approval-table, .detail-table, .sheet-bottom-table, .change-log-table, .sheet-footer-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .sheet-head-table td, .detail-table th, .detail-table td, .sheet-bottom-table th, .sheet-bottom-table td { border: 1px solid #111; box-sizing: border-box; font-weight: 400; }
    .meta-table th, .meta-table td, .approval-table th, .approval-table td, .change-log-table th, .change-log-table td { border: 1px solid #111; box-sizing: border-box; font-weight: 400; }
    .sheet-head-table > tbody > tr > td { height: 82px; padding: 0; }
    .meta-head-cell, .approval-head-cell { vertical-align: top; }
    .title-cell { padding: 0 12px; text-align: center; vertical-align: middle; font-size: 18px; letter-spacing: 0.55em; }
    .brand-cell { border-top: 0; border-left: 0; border-right: 0; padding: 6px 10px; font-size: 19px; font-weight: 700; letter-spacing: 0.04em; text-align: left; }
    .meta-table th, .meta-table td { padding: 4px 6px; font-size: 10px; }
    .meta-table { height: 100%; }
    .meta-table tr:first-child > * { border-top: 0; }
    .meta-table tr:last-child > * { border-bottom: 0; }
    .meta-table tr > :first-child { border-left: 0; }
    .meta-table tr > :last-child { border-right: 0; }
    .meta-table th { width: 36%; text-align: center; white-space: nowrap; }
    .approval-table { width: 100%; height: 100%; table-layout: fixed; }
    .approval-table th, .approval-table td { border: 0; padding: 2px 4px; font-size: 10px; text-align: center; vertical-align: middle; }
    .approval-label-row th:not(.approval-side) { border-right: 1px solid #111; border-bottom: 1px solid #111; height: 24px; }
    .approval-label-row th:last-child { border-right: 0; }
    .approval-sign-row td { border-right: 1px solid #111; height: 54px; }
    .approval-sign-row td:last-child { border-right: 0; }
    .approval-side { position: relative; line-height: 1.2; width: 14.2857%; }
    .approval-side::after { content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 1px; background: #111; }
    .detail-table { margin-top: -1px; table-layout: fixed; }
    .detail-table th, .detail-table td { padding: 3px 4px; font-size: 10px; vertical-align: middle; }
    .detail-table thead th { text-align: center; word-break: keep-all; }
    .detail-table tbody td { height: 22px; }
    .due-date-head, .due-date-cell { white-space: nowrap; font-size: 9px; }
    .sheet-bottom-table { margin-top: -1px; table-layout: fixed; }
    .sheet-bottom-table > tbody > tr > th, .sheet-bottom-table > tbody > tr > td { height: 136px; }
    .sheet-bottom-table th, .sheet-bottom-table td { padding: 6px 8px; font-size: 10px; vertical-align: top; }
    .remarks-side { text-align: center; white-space: nowrap; vertical-align: middle !important; }
    .remarks-body { height: 136px; white-space: pre-wrap; }
    .change-log-cell { padding: 0; height: 136px; }
    .change-log-table { height: 100%; table-layout: fixed; }
    .change-log-table th, .change-log-table td { padding: 4px 6px; font-size: 10px; text-align: center; }
    .change-log-table tr:first-child > * { border-top: 0; }
    .change-log-table tr:last-child > * { border-bottom: 0; }
    .change-log-table th:first-child, .change-log-table td:first-child { border-left: 0; }
    .change-log-table th:last-child, .change-log-table td:last-child { border-right: 0; }
    .sheet-footer-table { margin-top: 6px; }
    .sheet-footer-table td { border: 0; padding: 0 2px; font-size: 9px; }
    .footer-left { text-align: left; }
    .footer-center { text-align: center; }
    .footer-right { text-align: right; }
    .text-center { text-align: center; }
    @media print { body { margin: 12px; } }
  `

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${esc(sheet.title)} - ${esc(sheet.id)}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="instruction-sheet">
    <table class="sheet-head-table">
      <colgroup>
        <col style="width:24%">
        <col style="width:48%">
        <col style="width:28%">
      </colgroup>
      <tbody>
        <tr>
          <td class="meta-head-cell">
            <table class="meta-table">
              <tbody>
                <tr>
                  <td colspan="2" class="brand-cell">${esc(sheet.brandMark)} ${esc(sheet.brandName)}</td>
                </tr>
                ${metaRows}
              </tbody>
            </table>
          </td>
          <td class="title-cell">${esc(sheet.title)}</td>
          <td class="approval-head-cell">
            <table class="approval-table">
              <colgroup>
                <col style="width:14.2857%">
                <col style="width:28.5714%">
                <col style="width:28.5714%">
                <col style="width:28.5714%">
              </colgroup>
              <tbody>
                <tr class="approval-label-row">
                  <th class="approval-side" rowspan="2">결<br>재</th>
                  <th>작 성</th>
                  <th>검 토</th>
                  <th>승 인</th>
                </tr>
                <tr class="approval-sign-row">
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <table class="detail-table">
      <colgroup>
        <col style="width:8%">
        <col style="width:14%">
        <col style="width:15%">
        <col style="width:15%">
        <col style="width:14%">
        <col style="width:10%">
        <col style="width:14%">
        <col style="width:10%">
      </colgroup>
      <thead>
        <tr>
          <th>NO</th>
          <th>고객명</th>
          <th>모델명</th>
          <th>품명</th>
          <th>사양</th>
          <th>${esc(sheet.quantityLabel)}</th>
          <th class="due-date-head">${esc(sheet.dueLabel)}</th>
          <th>비고</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>

    <table class="sheet-bottom-table">
      <colgroup>
        <col style="width:8%">
        <col style="width:68%">
        <col style="width:24%">
      </colgroup>
      <tbody>
        <tr>
          <th class="remarks-side">특기사항</th>
          <td class="remarks-body">${esc(sheet.remarks)}</td>
          <td class="change-log-cell">
            <table class="change-log-table">
              <tbody>
                <tr><th colspan="2">${esc(sheet.changeLogTitle)}</th></tr>
                <tr><th>부서</th><th>확인서명</th></tr>
                ${changeLogRows}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <table class="sheet-footer-table">
      <tbody>
        <tr>
          <td class="footer-left">${esc(sheet.footerCode)}</td>
          <td class="footer-center">${esc(sheet.footerCompany)}</td>
          <td class="footer-right">${esc(sheet.footerPaper)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`
}

// ════════════════════════════════════════════
// PI 빌더
// ════════════════════════════════════════════
export function buildPIOutputHtml(doc) {
  const { code: incotermCode, place: incotermPlace } = parseIncoterms(doc.incoterms)
  const itemRows = doc.items.map((item, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${esc(item.name)}</td>
      <td class="text-center">${esc(item.quantity)}</td>
      <td class="text-right">${esc(item.unitPrice)}</td>
      <td class="text-right font-semibold">${esc(item.amount)}</td>
    </tr>`).join('')

  const body = `
    <table class="info-table">
      <colgroup>
        <col style="width:120px">
        <col style="width:42%">
        <col style="width:140px">
        <col>
      </colgroup>
      <tr><td class="info-label">From</td><td class="info-value company-cell"><div class="company-name">SalesBoost Inc.</div><div class="company-address">123 Teheran-ro, Gangnam-gu</div><div class="company-address">Seoul, Republic of Korea</div></td><td class="info-label">PI No.</td><td class="info-value">${esc(doc.id)}</td></tr>
      <tr><td class="info-label">To</td><td class="info-value party-cell"><div class="party-name">${esc(doc.clientName)}</div><div class="party-address">${esc(resolveConsigneeAddress(doc))}</div></td><td class="info-label">Issue Date</td><td class="info-value">${esc(doc.issueDate)}</td></tr>
      <tr><td class="info-label">Attn.</td><td class="info-value">${esc(doc.buyer || '-')}</td><td class="info-label">Requested Delivery</td><td class="info-value">${esc(doc.deliveryDate)}</td></tr>
    </table>
    <table class="info-table shipping-info-table" style="margin-top:-1px">
      <colgroup>
        <col style="width:120px">
        <col style="width:42%">
        <col style="width:140px">
        <col>
      </colgroup>
      <tr><td class="info-label">Trade Terms</td><td class="info-value">${esc(incotermCode)}</td><td class="info-label">Named Place</td><td class="info-value">${esc(incotermPlace)}</td></tr>
      <tr><td class="info-label">Terms of Payment</td><td class="info-value">T/T in Advance</td><td class="info-label">Invoice Currency</td><td class="info-value">${esc(doc.currency)}</td></tr>
    </table>
    <table class="items-table">
      <thead><tr><th style="width:70px">Line No.</th><th>Description of Goods</th><th style="width:90px">Quantity</th><th style="width:100px">Unit Price</th><th style="width:110px">Amount</th></tr></thead>
      <tbody>${itemRows}${emptyRows(5 - doc.items.length, 5)}</tbody>
      <tfoot><tr><td colspan="4" class="text-right font-bold">Grand Total</td><td class="text-right font-bold">${esc(doc.totalAmount)}</td></tr></tfoot>
    </table>
    <div class="signature"><div class="sig-box"><div class="sig-line"></div><p class="sig-label">Authorized Signature</p></div></div>`

  return wrapHtml('PROFORMA INVOICE', doc.id, body)
}

// ════════════════════════════════════════════
// PO 빌더
// ════════════════════════════════════════════
export function buildPOOutputHtml(doc) {
  const { code: incotermCode, place: incotermPlace } = parseIncoterms(doc.incoterms)
  const itemRows = doc.items.map((item, i) => `
    <tr>
      <td class="text-center">${String(i + 1).padStart(3, '0')}</td>
      <td>${esc(item.name)}</td>
      <td class="text-center">${esc(item.quantity)}</td>
      <td class="text-center">EA</td>
      <td class="text-right">${esc(item.unitPrice)}</td>
      <td class="text-right font-semibold">${esc(item.amount)}</td>
    </tr>`).join('')

  const body = `
    <table class="info-table">
      <colgroup>
        <col style="width:140px">
        <col style="width:36%">
        <col style="width:160px">
        <col>
      </colgroup>
      <tr><td class="info-label">From</td><td class="info-value company-cell"><div class="company-name">SalesBoost Inc.</div><div class="company-address">123 Teheran-ro, Gangnam-gu</div><div class="company-address">Seoul, Republic of Korea</div></td><td class="info-label">PO No.</td><td class="info-value">${esc(doc.id)}</td></tr>
      <tr><td class="info-label">To</td><td class="info-value party-cell"><div class="party-name">${esc(doc.clientName)}</div><div class="party-address">${esc(resolveConsigneeAddress(doc))}</div></td><td class="info-label">Issue Date</td><td class="info-value">${esc(doc.issueDate)}</td></tr>
      <tr><td class="info-label">PI Ref.</td><td class="info-value">${esc(doc.linkedDocuments?.find((linkedDocument) => String(linkedDocument.id).startsWith('PI'))?.id || '-')}</td><td class="info-label">Requested Delivery</td><td class="info-value">${esc(doc.deliveryDate)}</td></tr>
    </table>
    <table class="info-table shipping-info-table" style="margin-top:-1px">
      <colgroup>
        <col style="width:140px">
        <col style="width:36%">
        <col style="width:160px">
        <col>
      </colgroup>
      <tr><td class="info-label">Method of Dispatch</td><td class="info-value">Ocean Freight</td><td class="info-label">Shipment Type</td><td class="info-value">FCL</td></tr>
      <tr><td class="info-label">Buyer Contact</td><td class="info-value">${esc(doc.buyer || '-')}</td><td class="info-label">Order Currency</td><td class="info-value">${esc(doc.currency || '-')}</td></tr>
      <tr><td class="info-label">Trade Terms</td><td class="info-value">${esc(incotermCode)}</td><td class="info-label">Named Place</td><td class="info-value">${esc(incotermPlace)}</td></tr>
      <tr><td class="info-label">Port of Loading</td><td class="info-value">BUSAN, KOREA</td><td class="info-label">Terms of Payment</td><td class="info-value">T/T in Advance</td></tr>
    </table>
    <table class="items-table">
      <thead><tr><th style="width:84px">Line No.</th><th>Description of Goods</th><th style="width:88px">Quantity</th><th style="width:76px">UOM</th><th style="width:96px">Unit Price</th><th style="width:100px">Amount</th></tr></thead>
      <tbody>${itemRows}${emptyRows(5 - doc.items.length, 6)}</tbody>
      <tfoot>
        <tr><td colspan="5" class="text-right font-bold">Order Total</td><td class="text-right font-bold">${esc(doc.totalAmount)}</td></tr>
      </tfoot>
    </table>`

  return wrapHtml('PURCHASE ORDER', doc.id, body)
}

// ════════════════════════════════════════════
// CI 빌더 — CIPL_COOLSAY+FORM.pdf 원본 구조
// 좌측: ①Shipper ②Consignee ③Notify Party
// 우측: ⑧Invoice No ⑨Country ⑩Remarks
// 하단: ④⑤Port ⑥Carrier ⑦Sailing + 품목 테이블 + TOTAL + 서명
// ════════════════════════════════════════════
export function buildCIOutputHtml(doc) {
  const items = normalizeCIItems(doc.items)
  const attention = resolveConsigneeAttention(doc)
  const itemRows = items.length
    ? items.map((item) => `
        <tr class="item-row">
          <td class="accent-blue">품명 <span class="item-meta">${esc(item.name)}</span>${item.hsCode ? `<span class="item-code">${esc(item.hsCode)}</span>` : ''}</td>
          <td class="text-right accent-blue">${esc(item.quantity)} <span class="unit-label">EA</span></td>
          <td class="text-right accent-blue">USD ${esc(item.unitPrice)}</td>
          <td class="text-right accent-blue">USD ${esc(item.amount)}</td>
        </tr>`).join('')
    : '<tr class="no-items-row"><td colspan="4" class="no-items-cell">No items</td></tr>'

  const ciStyles = `
    body { font-family: 'Times New Roman', serif; margin: 34px 38px 42px; color: #000; line-height: 1.28; font-size: 12px; }
    .doc-title { margin: 0 0 8px; text-align: center; font-size: 18px; font-weight: 700; }
    .doc-divider { border-top: 2px solid #000; }
    .header-table, .shipping-table, .items-table { width: 100%; border-collapse: collapse; }
    .header-table { position: relative; z-index: 0; margin-top: -1px; }
    .header-table td, .shipping-table td, .items-table th, .items-table td { border: 1px solid #000; }
    .header-table td, .shipping-table td { vertical-align: top; }
    .left-cell { width: 55%; padding: 4px 10px 8px; }
    .right-cell { width: 45%; padding: 4px 10px 8px; }
    .header-block { min-height: 60px; }
    .cell-label { margin-bottom: 2px; font-size: 11px; font-weight: 700; }
    .cell-value { font-size: 12px; }
    .contact-line { display: inline-block; min-width: 44%; font-size: 11px; }
    .contact-line.right { text-align: right; }
    .remarks-cell { position: relative; padding: 0; }
    .remarks-cell::after { content: ''; position: absolute; top: calc(100% - 1px); left: -1px; width: calc(100% + 2px); height: 115px; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; background: #fff; box-sizing: border-box; pointer-events: none; z-index: 0; }
    .remarks-country { padding: 4px 10px 8px; border-bottom: 1px solid #000; }
    .remarks-box { padding: 4px 10px 10px; min-height: 116px; }
    .shipping-table { position: relative; z-index: 1; width: 55%; margin-top: -1px; }
    .ship-cell { padding: 4px 10px; height: 48px; }
    .items-table { position: relative; z-index: 2; background: #fff; margin-top: -1px; table-layout: fixed; }
    .items-table th { padding: 3px 6px; font-size: 11px; font-weight: 700; text-align: center; }
    .items-table td { padding: 3px 8px; font-size: 12px; border-top: none; }
    .item-row td { border-bottom: none; }
    .item-meta, .item-code { margin-left: 18px; }
    .unit-label { margin-left: 10px; font-size: 10px; }
    .no-items-cell { padding: 14px 8px; border-bottom: none; text-align: center; color: #666; font-style: italic; }
    .filler-row td { height: 126px; padding: 0; border-top: none; }
    .total-row { display: grid; grid-template-columns: 1fr 0.8fr; align-items: center; border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 6px; padding: 2px 10px; font-size: 13px; font-weight: 700; }
    .total-right { text-align: right; }
    .signature-area { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 48px; padding-right: 24px; }
    .signature-kor { padding-right: 72px; font-size: 12px; font-weight: 700; }
    .signature-line-row { display: flex; align-items: flex-end; gap: 10px; }
    .signed-label { font-size: 12px; }
    .signed-line { display: inline-block; width: 230px; border-bottom: 1px dotted #000; }
    .accent-red { color: #d72626; font-style: italic; }
    .accent-blue { color: #2d74b7; font-style: italic; font-weight: 700; }
    .italic { font-style: italic; }
    .text-right { text-align: right; }
    @media print { body { margin: 24px 28px; } }
  `

  return `<!doctype html>
<html lang="ko">
<head><meta charset="UTF-8"/><title>COMMERCIAL INVOICE - ${esc(doc.id)}</title><style>${ciStyles}</style></head>
<body>
  <h1 class="doc-title">COMMERCIAL INVOICE</h1>
  <div class="doc-divider"></div>

  <table class="header-table">
    <tr>
      <td class="left-cell">
        <div class="cell-label">① Shipper / Exporter</div>
        <div class="cell-value header-block">
          <strong>${esc(resolveShipperName(doc))}</strong><br>
          ${esc(resolveShipperAddress(doc))}<br>
          <span class="contact-line">TEL : +82-2-1234-5678</span>
          <span class="contact-line right">FAX : +82-2-1234-5679</span><br>
          <span class="contact-line">Email : sales@salesboost.com</span>
        </div>
      </td>
      <td class="right-cell">
        <div class="cell-label">⑧ No. &amp; date of invoice</div>
        <div class="cell-value accent-red">${esc(doc.id)} / ${esc(doc.issueDate)}</div>
      </td>
    </tr>
    <tr>
      <td class="left-cell">
        <div class="cell-label">② Consignee</div>
        <div class="cell-value header-block accent-red">
          <strong>${esc(doc.clientName)}</strong><br>
          ${esc(resolveConsigneeAddress(doc))}${attention ? `<br>${esc(attention)}` : ''}
        </div>
      </td>
      <td class="right-cell remarks-cell" rowspan="2">
        <div class="remarks-country">
          <div class="cell-label">⑨ Country of Origin</div>
          <div class="cell-value accent-red">KOREA</div>
        </div>
        <div class="remarks-box">
          <div class="cell-label">⑩ Remarks</div>
          <div class="cell-value accent-red">
            SHIPMENT NO. : ${esc(doc.id)}<br><br>
            Terms of Delivery and payment<br>
            ${esc(doc.incoterms || 'FOB BUSAN')}<br>
            T/T REMITTANCE
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td class="left-cell">
        <div class="cell-label">③ Notify Party</div>
        <div class="cell-value italic accent-red">SAME AS CONSIGNEE</div>
      </td>
    </tr>
  </table>

  <table class="shipping-table">
    <tr>
      <td class="ship-cell" style="width:50%"><div class="cell-label">④ Port of loading</div><div class="cell-value italic accent-red">BUSAN, KOREA</div></td>
      <td class="ship-cell" style="width:50%"><div class="cell-label">⑤ Port of Discharge</div><div class="cell-value italic accent-red">${esc(resolvePortOfDischarge(doc))}</div></td>
    </tr>
    <tr>
      <td class="ship-cell"><div class="cell-label">⑥ Carrier</div><div class="cell-value">${esc(doc.carrier || '')}</div></td>
      <td class="ship-cell"><div class="cell-label">⑦ Sailing on or about</div><div class="cell-value">${esc(doc.deliveryDate || '')}</div></td>
    </tr>
  </table>

  <table class="items-table">
    <colgroup>
      <col style="width:45%">
      <col style="width:15%">
      <col style="width:20%">
      <col style="width:20%">
    </colgroup>
    <thead>
      <tr>
        <th>⑪ Description of Goods</th>
        <th>⑫ Quantity</th>
        <th>⑬ Unit Price</th>
        <th>⑭ Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="filler-row" aria-hidden="true">
        <td></td><td></td><td></td><td></td>
      </tr>
    </tbody>
  </table>
  <div class="total-row">
    <span class="accent-blue">TOTAL ${items.length} Packages</span>
    <span class="total-right accent-blue">USD ${esc(doc.totalAmount)}</span>
  </div>

  <div class="signature-area">
    <div class="signature-kor accent-red">서명파일삽입</div>
    <div class="signature-line-row">
      <span class="signed-label">Signed by</span>
      <span class="signed-line"></span>
    </div>
  </div>
</body>
</html>`
}

// ════════════════════════════════════════════
// PL 빌더 — CIPL_COOLSAY+FORM.pdf 원본 구조
// CI와 동일한 헤더, Remarks에 BOOKING NO 추가
// 품목 컬럼: Description, Quantity, Net/Gross Weight, Volume(CBM)
// ════════════════════════════════════════════
export function buildPLOutputHtml(doc) {
  const items = normalizePLItems(doc.items)
  const attention = resolveConsigneeAttention(doc)
  const itemRows = items.length
    ? items.map((item) => `
        <tr class="item-row">
          <td class="accent-blue"><span class="item-meta">${esc(item.name)}</span></td>
          <td class="text-right accent-blue">${esc(item.quantity)} <span class="unit-label">EA</span></td>
          <td class="text-right accent-blue">${esc(item.netWeight)}</td>
          <td class="text-right accent-blue">${esc(item.grossWeight)}</td>
          <td class="text-right accent-blue">${esc(item.measurement)}</td>
        </tr>`).join('')
    : '<tr class="no-items-row"><td colspan="5" class="no-items-cell">No items</td></tr>'

  const plStyles = `
    body { font-family: 'Times New Roman', serif; margin: 34px 38px 42px; color: #000; line-height: 1.28; font-size: 12px; }
    .doc-title { margin: 0 0 8px; text-align: center; font-size: 18px; font-weight: 700; }
    .doc-divider { border-top: 2px solid #000; }
    .header-table, .shipping-table, .items-table { width: 100%; border-collapse: collapse; }
    .header-table { position: relative; z-index: 0; margin-top: -1px; }
    .header-table td, .shipping-table td, .items-table th, .items-table td { border: 1px solid #000; }
    .header-table td, .shipping-table td { vertical-align: top; }
    .left-cell { width: 55%; padding: 4px 10px 8px; }
    .right-cell { width: 45%; padding: 4px 10px 8px; }
    .header-block { min-height: 60px; }
    .cell-label { margin-bottom: 2px; font-size: 11px; font-weight: 700; }
    .cell-value { font-size: 12px; }
    .contact-line { display: inline-block; min-width: 44%; font-size: 11px; }
    .contact-line.right { text-align: right; }
    .remarks-cell { position: relative; padding: 0; }
    .remarks-cell::after { content: ''; position: absolute; top: calc(100% - 1px); left: -1px; width: calc(100% + 2px); height: 115px; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; background: #fff; box-sizing: border-box; pointer-events: none; z-index: 0; }
    .remarks-country { padding: 4px 10px 8px; border-bottom: 1px solid #000; }
    .remarks-box { padding: 4px 10px 10px; min-height: 116px; }
    .shipping-table { position: relative; z-index: 1; width: 55%; margin-top: -1px; }
    .ship-cell { padding: 4px 10px; height: 48px; }
    .items-table { position: relative; z-index: 2; background: #fff; margin-top: -1px; table-layout: fixed; }
    .items-table th { padding: 3px 6px; font-size: 11px; font-weight: 700; text-align: center; }
    .items-table th small { font-size: 10px; font-weight: 400; }
    .items-table td { padding: 3px 8px; font-size: 12px; border-top: none; }
    .item-row td { border-bottom: none; }
    .item-meta { margin-left: 0; }
    .unit-label { margin-left: 10px; font-size: 10px; }
    .no-items-cell { padding: 14px 8px; border-bottom: none; text-align: center; color: #000; }
    .filler-row td { height: 126px; padding: 0; border-top: none; }
    .total-row { display: grid; grid-template-columns: 1.6fr 0.8fr 0.9fr 0.9fr 0.9fr; align-items: center; border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 6px; padding: 2px 10px; font-size: 13px; font-weight: 700; }
    .total-qty, .total-nw, .total-gw, .total-vol { text-align: right; }
    .signature-area { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 48px; padding-right: 24px; }
    .signature-line-row { display: flex; align-items: flex-end; gap: 10px; }
    .signed-label { font-size: 12px; }
    .signed-line { display: inline-block; width: 230px; border-bottom: 1px solid #000; }
    .accent-red, .accent-blue { color: #000; font-style: normal; }
    .accent-blue { font-weight: 700; }
    .italic { font-style: italic; }
    .text-right { text-align: right; }
    @media print { body { margin: 24px 28px; } }
  `

  return `<!doctype html>
<html lang="ko">
<head><meta charset="UTF-8"/><title>PACKING LIST - ${esc(doc.id)}</title><style>${plStyles}</style></head>
<body>
  <h1 class="doc-title">PACKING LIST</h1>
  <div class="doc-divider"></div>

  <table class="header-table">
    <tr>
      <td class="left-cell">
        <div class="cell-label">① Shipper / Exporter</div>
        <div class="cell-value header-block">
          <strong>${esc(resolveShipperName(doc))}</strong><br>
          ${esc(resolveShipperAddress(doc))}<br>
          <span class="contact-line">TEL : +82-2-1234-5678</span>
          <span class="contact-line right">FAX : +82-2-1234-5679</span><br>
          <span class="contact-line">Email : sales@salesboost.com</span>
        </div>
      </td>
      <td class="right-cell">
        <div class="cell-label">⑧ No. &amp; date of invoice</div>
        <div class="cell-value accent-red">${esc(doc.id)} / ${esc(doc.issueDate)}</div>
      </td>
    </tr>
    <tr>
      <td class="left-cell">
        <div class="cell-label">② Consignee</div>
        <div class="cell-value header-block accent-red">
          <strong>${esc(doc.clientName)}</strong><br>
          ${esc(resolveConsigneeAddress(doc))}${attention ? `<br>${esc(attention)}` : ''}
        </div>
      </td>
      <td class="right-cell remarks-cell" rowspan="2">
        <div class="remarks-country">
          <div class="cell-label">⑨ Country of Origin</div>
          <div class="cell-value accent-red">KOREA</div>
        </div>
        <div class="remarks-box">
          <div class="cell-label">⑩ Remarks</div>
          <div class="cell-value accent-red">BOOKING NO. : ${esc(doc.bookingNo || 'T.B.A.')}</div>
        </div>
      </td>
    </tr>
    <tr>
      <td class="left-cell">
        <div class="cell-label">③ Notify Party</div>
        <div class="cell-value italic accent-red">SAME AS CONSIGNEE</div>
      </td>
    </tr>
  </table>

  <table class="shipping-table">
    <tr>
      <td class="ship-cell" style="width:50%"><div class="cell-label">④ Port of loading</div><div class="cell-value italic accent-red">BUSAN, KOREA</div></td>
      <td class="ship-cell" style="width:50%"><div class="cell-label">⑤ Port of Discharge</div><div class="cell-value italic accent-red">${esc(resolvePortOfDischarge(doc))}</div></td>
    </tr>
    <tr>
      <td class="ship-cell"><div class="cell-label">⑥ Carrier</div><div class="cell-value">${esc(doc.carrier || '')}</div></td>
      <td class="ship-cell"><div class="cell-label">⑦ Sailing on or about</div><div class="cell-value">${esc(doc.deliveryDate || '')}</div></td>
    </tr>
  </table>

  <table class="items-table">
    <colgroup>
      <col style="width:35%">
      <col style="width:12%">
      <col style="width:17%">
      <col style="width:18%">
      <col style="width:18%">
    </colgroup>
    <thead>
      <tr>
        <th>⑪ Description of Goods</th>
        <th>⑫ Quantity</th>
        <th>⑬ Net Weight<br><small>(KG)</small></th>
        <th>Gross Weight<br><small>(KG)</small></th>
        <th>⑭ Volume<br><small>(CBM)</small></th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="filler-row" aria-hidden="true">
        <td></td><td></td><td></td><td></td><td></td>
      </tr>
    </tbody>
  </table>

  <div class="total-row">
    <span class="accent-blue">TOTAL ${items.length} Packages</span>
    <span class="total-qty accent-blue">${esc(doc.totalQuantity || '')}</span>
    <span class="total-nw accent-blue">${esc(doc.totalNetWeight || '')}</span>
    <span class="total-gw accent-blue">${esc(doc.totalGrossWeight || '')}</span>
    <span class="total-vol accent-blue">${esc(doc.totalMeasurement || '')}</span>
  </div>

  <div class="signature-area">
    <div class="signature-line-row">
      <span class="signed-label">Signed by</span>
      <span class="signed-line"></span>
    </div>
  </div>
</body>
</html>`
}

// ════════════════════════════════════════════
// 생산지시서 빌더
// ════════════════════════════════════════════
export function buildProductionOrderOutputHtml(doc) {
  return renderInstructionSheetOutputHtml(doc, 'production')
}

// ════════════════════════════════════════════
// 출하지시서 빌더
// ════════════════════════════════════════════
export function buildShipmentOrderOutputHtml(doc) {
  return renderInstructionSheetOutputHtml(doc, 'shipment')
}

// ════════════════════════════════════════════
// 레거시 호환 빌더 (기존 코드와의 하위 호환)
// ════════════════════════════════════════════
export function buildDocumentOutputHtml({ title, documentId, fields = [], lineItems = [] }) {
  const fieldRows = fields.map((field) => `
    <tr>
      <th>${esc(field.label)}</th>
      <td>${esc(field.value)}</td>
    </tr>
  `).join('')

  const lineItemRows = lineItems.length
    ? lineItems.map((item) => `
        <tr>
          <td>${esc(item.name)}</td>
          <td>${esc(item.quantity)}</td>
          <td>${esc(item.unitPrice)}</td>
          <td>${esc(item.amount)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" class="empty">품목 정보가 없습니다.</td></tr>'

  return `<!doctype html>
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <title>${esc(title)} - ${esc(documentId)}</title>
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
        @media print { body { margin: 16px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${esc(title)}</h1>
        <p class="subtitle">문서번호: ${esc(documentId)}</p>
      </div>
      <section class="section">
        <h2 class="section-title">기본 정보</h2>
        <table><tbody>${fieldRows}</tbody></table>
      </section>
      <section class="section">
        <h2 class="section-title">품목 목록</h2>
        <table class="line-items">
          <thead><tr><th>품목</th><th>수량</th><th>단가</th><th>금액</th></tr></thead>
          <tbody>${lineItemRows}</tbody>
        </table>
      </section>
    </body>
  </html>`
}

// ════════════════════════════════════════════
// 출력 실행 함수 — 새 창에 HTML 렌더링 후 인쇄 호출
// ════════════════════════════════════════════

/**
 * openDocumentOutput — 레거시 호환 (기존 호출 방식 유지)
 * @param {Object} options - { title, documentId, fields, lineItems, autoPrint }
 */
export function openDocumentOutput({ title, documentId, fields, lineItems, autoPrint = false }) {
  const html = buildDocumentOutputHtml({ title, documentId, fields, lineItems })
  return openPrintWindow(html, autoPrint)
}

/**
 * openDocumentOutputByType — 문서 유형별 양식으로 출력
 * @param {'PI'|'PO'|'CI'|'PL'|'PRODUCTION'|'SHIPMENT'} type - 문서 유형
 * @param {Object} doc - 문서 데이터 객체
 * @param {boolean} autoPrint - true면 자동으로 인쇄 대화상자 표시
 */
export function openDocumentOutputByType(type, doc, autoPrint = false) {
  const builders = {
    PI: buildPIOutputHtml,
    PO: buildPOOutputHtml,
    CI: buildCIOutputHtml,
    PL: buildPLOutputHtml,
    PRODUCTION: buildProductionOrderOutputHtml,
    SHIPMENT: buildShipmentOrderOutputHtml,
  }

  const builder = builders[type]
  if (!builder) {
    console.warn(`[documentOutput] 알 수 없는 문서 유형: ${type}`)
    return false
  }

  const html = builder(doc)
  return openPrintWindow(html, autoPrint)
}

/**
 * openPrintWindow — 새 창에 HTML을 렌더링하고 선택적으로 인쇄 호출
 */
function openPrintWindow(html, autoPrint) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=800')
  if (!printWindow) return false

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
