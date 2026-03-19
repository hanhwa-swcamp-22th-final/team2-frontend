<script setup>
/**
 * PODocumentTemplate.vue — Purchase Order 출력 양식
 *
 * Purchase Order.pdf를 정확히 반영합니다.
 * 구조: From/To + PO Number/Date + Buyer Reference + Delivery Date
 *       + Method of Dispatch / Type of Shipment / Terms
 *       + Port of Loading / Port of Discharge
 *       + 품목 테이블 + Total
 */
import DocumentPrintLayout from './DocumentPrintLayout.vue'
import { resolveConsigneeAddress } from '@/utils/ciplTemplate'

defineProps({
  document: {
    type: Object,
    required: true,
  },
})

function extractIncotermCode(value) {
  const [code = ''] = String(value ?? '').trim().split(/\s+/)
  return code || '-'
}

function extractIncotermPlace(value) {
  const parts = String(value ?? '').trim().split(/\s+/)
  return parts.slice(1).join(' ') || '-'
}

function resolvePiReference(linkedDocuments) {
  return linkedDocuments?.find((linkedDocument) => String(linkedDocument.id).startsWith('PI'))?.id || '-'
}
</script>

<template>
  <DocumentPrintLayout title="PURCHASE ORDER" :document-id="document.id">
    <!-- ── 수출자(From) + PO메타 (Pages, PO Number, Date, Buyer Reference) ── -->
    <table class="doc-info-table">
      <colgroup>
        <col style="width:140px">
        <col style="width:36%">
        <col style="width:160px">
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
          <td class="info-label">PO No.</td>
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
          <td class="info-label">PI Ref.</td>
          <td class="info-value">{{ resolvePiReference(document.linkedDocuments) }}</td>
          <td class="info-label">Requested Delivery</td>
          <td class="info-value">{{ document.deliveryDate }}</td>
        </tr>
      </tbody>
    </table>

    <!-- ── 배송 조건 ── -->
    <table class="doc-info-table shipping-info-table" style="margin-top:-1px">
      <colgroup>
        <col style="width:140px">
        <col style="width:36%">
        <col style="width:160px">
        <col>
      </colgroup>
      <tbody>
        <tr>
          <td class="info-label">Method of Dispatch</td>
          <td class="info-value">Ocean Freight</td>
          <td class="info-label">Shipment Type</td>
          <td class="info-value">FCL</td>
        </tr>
        <tr>
          <td class="info-label">Buyer Contact</td>
          <td class="info-value">{{ document.buyer || '-' }}</td>
          <td class="info-label">Order Currency</td>
          <td class="info-value">{{ document.currency || '-' }}</td>
        </tr>
        <tr>
          <td class="info-label">Trade Terms</td>
          <td class="info-value">{{ extractIncotermCode(document.incoterms) }}</td>
          <td class="info-label">Named Place</td>
          <td class="info-value">{{ extractIncotermPlace(document.incoterms) }}</td>
        </tr>
        <tr>
          <td class="info-label">Port of Loading</td>
          <td class="info-value">BUSAN, KOREA</td>
          <td class="info-label">Terms of Payment</td>
          <td class="info-value">T/T in Advance</td>
        </tr>
      </tbody>
    </table>

    <!-- ── 품목 테이블 ── -->
    <table class="doc-items-table" style="margin-top:20px">
      <thead>
        <tr>
          <th style="width:84px">Line No.</th>
          <th>Description of Goods</th>
          <th style="width:88px">Quantity</th>
          <th style="width:76px">UOM</th>
          <th style="width:96px">Unit Price</th>
          <th style="width:100px">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in document.items" :key="index" class="item-row">
          <td class="text-center">{{ String(index + 1).padStart(3, '0') }}</td>
          <td>{{ item.name }}</td>
          <td class="text-center">{{ item.quantity }}</td>
          <td class="text-center">EA</td>
          <td class="text-right">{{ item.unitPrice }}</td>
          <td class="text-right font-semibold">{{ item.amount }}</td>
        </tr>
        <!-- 빈 행 채우기 -->
        <tr v-for="n in Math.max(0, 5 - document.items.length)" :key="'empty-' + n" class="empty-row">
          <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" class="text-right font-bold">Order Total</td>
          <td class="text-right font-bold">{{ document.totalAmount }}</td>
        </tr>
      </tfoot>
    </table>
  </DocumentPrintLayout>
</template>

<style scoped>
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
</style>
