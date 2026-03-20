<script setup>
/**
 * PIDocumentTemplate.vue — Proforma Invoice 출력 양식
 *
 * Purchase Order.pdf 양식을 기반으로 PI용으로 설계합니다.
 * 구조: From(수출자) / To(수입자) + 문서 메타 + 배송조건 + 품목 테이블 + 합계
 */
import DocumentPrintLayout from './DocumentPrintLayout.vue'
import { resolveConsigneeAddress } from '@/utils/ciplTemplate'
import { normalizeIncoterms } from '@/utils/incoterms'

defineProps({
  // 문서 전체 데이터 객체
  document: {
    type: Object,
    required: true,
  },
})

function extractIncotermCode(value, namedPlace) {
  return normalizeIncoterms(value, namedPlace).code || '-'
}

function extractIncotermPlace(value, namedPlace) {
  return normalizeIncoterms(value, namedPlace).namedPlace || '-'
}

function resolveBuyer(document) {
  return document.buyerName || document.buyer || '-'
}

function resolveItemQuantity(item) {
  return item.quantity ?? item.qty ?? '-'
}
</script>

<template>
  <DocumentPrintLayout title="PROFORMA INVOICE" :document-id="document.id">
    <!-- ── 수출자 / 수입자 + 문서 메타 정보 ── -->
    <table class="doc-info-table">
      <colgroup>
        <col style="width:120px">
        <col style="width:42%">
        <col style="width:140px">
        <col>
      </colgroup>
      <tbody>
        <tr>
          <td class="info-label">From</td>
          <td class="info-value company-cell">
            <div class="company-name">SalesBoost Inc.</div>
            <div class="company-address">123 Teheran-ro, Gangnam-gu</div>
            <div class="company-address">Seoul, Republic of Korea</div>
          </td>
          <td class="info-label">PI No.</td>
          <td class="info-value">{{ document.id }}</td>
        </tr>
        <tr>
          <td class="info-label">To</td>
          <td class="info-value party-cell">
            <div class="party-name">{{ document.clientName }}</div>
            <div class="party-address">{{ resolveConsigneeAddress(document) }}</div>
          </td>
          <td class="info-label">Issue Date</td>
          <td class="info-value">{{ document.issueDate }}</td>
        </tr>
        <tr>
          <td class="info-label">Attn.</td>
          <td class="info-value">{{ resolveBuyer(document) }}</td>
          <td class="info-label">Delivery Date</td>
          <td class="info-value">{{ document.deliveryDate }}</td>
        </tr>
      </tbody>
    </table>

    <!-- ── 배송 조건 (인코텀즈, 결제조건) ── -->
    <table class="doc-info-table shipping-info-table" style="margin-top:-1px">
      <colgroup>
        <col style="width:120px">
        <col style="width:42%">
        <col style="width:140px">
        <col>
      </colgroup>
      <tbody>
        <tr>
          <td class="info-label" style="width:120px">Incoterms</td>
          <td class="info-value">{{ extractIncotermCode(document.incoterms, document.namedPlace) }}</td>
          <td class="info-label">Named Place</td>
          <td class="info-value">{{ extractIncotermPlace(document.incoterms, document.namedPlace) }}</td>
        </tr>
        <tr>
          <td class="info-label">Terms of Payment</td>
          <td class="info-value">T/T in Advance</td>
          <td class="info-label">Invoice Currency</td>
          <td class="info-value">{{ document.currency }}</td>
        </tr>
      </tbody>
    </table>

    <!-- ── 품목 테이블 ── -->
    <table class="doc-items-table" style="margin-top:20px">
      <thead>
        <tr>
          <th style="width:70px">Line No.</th>
          <th>Description of Goods</th>
          <th style="width:90px">Quantity</th>
          <th style="width:100px">Unit Price</th>
          <th style="width:110px">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in document.items" :key="index" class="item-row">
          <td class="text-center">{{ index + 1 }}</td>
          <td>{{ item.name }}</td>
          <td class="text-center">{{ resolveItemQuantity(item) }}</td>
          <td class="text-right">{{ item.unitPrice }}</td>
          <td class="text-right font-semibold">{{ item.amount }}</td>
        </tr>
        <!-- 빈 행 — 양식 공간 확보용 (최소 5행) -->
        <tr v-for="n in Math.max(0, 5 - document.items.length)" :key="'empty-' + n" class="empty-row">
          <td>&nbsp;</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="text-right font-bold">Grand Total</td>
          <td class="text-right font-bold">{{ document.totalAmount }}</td>
        </tr>
      </tfoot>
    </table>

    <!-- ── 서명란 ── -->
    <template #footer>
      <div class="doc-signature">
        <div class="signature-box">
          <div class="signature-line"></div>
          <p>Authorized Signature</p>
        </div>
      </div>
    </template>
  </DocumentPrintLayout>
</template>

<style scoped>
/* ── 정보 테이블 (From/To/메타) ── */
.doc-info-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1.5px solid #64748b;
}
.doc-info-table td {
  border: 1px solid #94a3b8;
  padding: 10px 12px;
  font-size: 11.5px;
  vertical-align: top;
  background: #fff;
}
.info-label {
  background: #f8fafc;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #475569;
  white-space: nowrap;
}
.shipping-info-table .info-label {
  white-space: normal;
  word-break: keep-all;
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-transform: none;
}
.info-value {
  color: #0f172a;
  line-height: 1.55;
}
.company-cell,
.party-cell {
  padding-top: 12px;
  padding-bottom: 12px;
}
.company-name,
.party-name {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #0f172a;
}
.company-address,
.party-address,
.party-contact {
  font-size: 11px;
  color: #475569;
}

/* ── 품목 테이블 ── */
.doc-items-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1.5px solid #64748b;
}
.doc-items-table th {
  background: #eef2f7;
  border: 1px solid #94a3b8;
  border-bottom: 1.5px solid #64748b;
  padding: 9px 10px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
  color: #334155;
}
.doc-items-table td {
  border: 1px solid #cbd5e1;
  padding: 8px 10px;
  font-size: 11.5px;
  color: #0f172a;
}
.doc-items-table tfoot td {
  background: #f8fafc;
  border-top: 1.5px solid #64748b;
  font-size: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
}
.item-row,
.empty-row {
  height: 38px;
}
.text-center { text-align: center; }
.text-right { text-align: right; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

/* ── 서명란 ── */
.doc-signature {
  margin-top: 42px;
  padding-top: 12px;
  border-top: 1px solid #cbd5e1;
  display: flex;
  justify-content: flex-end;
}
.signature-box {
  text-align: center;
  width: 220px;
}
.signature-line {
  border-bottom: 1px solid #0f172a;
  height: 58px;
}
.signature-box p {
  margin: 8px 0 0;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}
</style>
