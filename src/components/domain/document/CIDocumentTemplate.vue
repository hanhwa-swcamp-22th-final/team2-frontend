<script setup>
import { computed } from 'vue'
import {
  normalizeCIItems,
  resolveConsigneeAddress,
  resolveConsigneeAttention,
  resolvePortOfDischarge,
  resolveShipperAddress,
  resolveShipperName,
} from '@/utils/ciplTemplate'

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
})

const invoiceItems = computed(() => normalizeCIItems(props.document?.items))
const itemCount = computed(() => invoiceItems.value.length)
const consigneeAttention = computed(() => resolveConsigneeAttention(props.document))
const currencyCode = computed(() => props.document?.currency || 'USD')
</script>

<template>
  <div class="ci-page">
    <h1 class="doc-title">COMMERCIAL INVOICE</h1>
    <div class="doc-divider"></div>

    <table class="header-table">
      <tbody>
        <tr>
          <td class="left-cell">
            <div class="cell-label">① Shipper / Exporter</div>
            <div class="cell-value header-block">
              <strong>{{ resolveShipperName(document) }}</strong><br>
              {{ resolveShipperAddress(document) }}<br>
              <span class="contact-line">TEL : +82-2-1234-5678</span>
              <span class="contact-line right">FAX : +82-2-1234-5679</span><br>
              <span class="contact-line">Email : sales@salesboost.com</span>
            </div>
          </td>
          <td class="right-cell">
            <div class="cell-label">⑧ No. &amp; date of invoice</div>
            <div class="cell-value accent-red">
              {{ document.id }} / {{ document.issueDate }}
            </div>
          </td>
        </tr>
        <tr>
          <td class="left-cell">
            <div class="cell-label">② Consignee</div>
            <div class="cell-value header-block accent-red">
              <strong>{{ document.clientName }}</strong><br>
              {{ resolveConsigneeAddress(document) }}
              <template v-if="consigneeAttention">
                <br>{{ consigneeAttention }}
              </template>
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
                SHIPMENT NO. : {{ document.id }}<br><br>
                Terms of Delivery and payment<br>
                {{ document.incoterms || 'FOB BUSAN' }}<br>
                {{ document.paymentTerms || 'T/T REMITTANCE' }}
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="left-cell">
            <div class="cell-label">③ Notify Party</div>
            <div class="cell-value italic accent-red">
              SAME AS CONSIGNEE
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <table class="shipping-table">
      <tbody>
        <tr>
          <td class="ship-cell" style="width:50%">
            <div class="cell-label">④ Port of loading</div>
            <div class="cell-value italic accent-red">BUSAN, KOREA</div>
          </td>
          <td class="ship-cell" style="width:50%">
            <div class="cell-label">⑤ Port of Discharge</div>
            <div class="cell-value italic accent-red">{{ resolvePortOfDischarge(document) }}</div>
          </td>
        </tr>
        <tr>
          <td class="ship-cell">
            <div class="cell-label">⑥ Carrier</div>
            <div class="cell-value">{{ document.carrier || '' }}</div>
          </td>
          <td class="ship-cell">
            <div class="cell-label">⑦ Sailing on or about</div>
            <div class="cell-value">{{ document.deliveryDate || '' }}</div>
          </td>
        </tr>
      </tbody>
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
        <tr v-for="(item, index) in invoiceItems" :key="`${item.name}-${index}`" class="item-row">
          <td class="accent-blue">
            <span class="item-meta">{{ item.name }}</span>
            <span v-if="item.hsCode" class="item-code">{{ item.hsCode }}</span>
          </td>
          <td class="text-right accent-blue">
            {{ item.quantity }}
            <span class="unit-label">EA</span>
          </td>
          <td class="text-right accent-blue">{{ currencyCode }} {{ item.unitPrice }}</td>
          <td class="text-right accent-blue">{{ currencyCode }} {{ item.amount }}</td>
        </tr>
        <tr v-if="itemCount === 0" class="no-items-row">
          <td colspan="4" class="no-items-cell">No items</td>
        </tr>
        <tr class="filler-row" aria-hidden="true">
          <td class="filler-cell"></td>
          <td class="filler-cell"></td>
          <td class="filler-cell"></td>
          <td class="filler-cell"></td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <span class="total-left accent-blue">TOTAL {{ itemCount }} Packages</span>
      <span class="total-right accent-blue">{{ currencyCode }} {{ document.totalAmount }}</span>
    </div>

    <div class="signature-area">
      <div class="signature-line-row">
        <span class="signed-label">Signed by</span>
        <span class="signed-line"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ci-page {
  --remarks-extension-height: 116px;
  font-family: 'Times New Roman', serif;
  color: #000;
  padding: 34px 38px 42px;
  font-size: 12px;
  line-height: 1.28;
}

.doc-title {
  margin: 0 0 8px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
}

.doc-divider {
  border-top: 2px solid #000;
}

.header-table,
.shipping-table,
.items-table {
  width: 100%;
  border-collapse: collapse;
}

.header-table {
  position: relative;
  z-index: 0;
  margin-top: -1px;
}

.header-table td,
.shipping-table td,
.items-table th,
.items-table td {
  border: 1px solid #000;
}

.header-table td,
.shipping-table td {
  vertical-align: top;
}

.left-cell {
  width: 55%;
  padding: 4px 10px 8px;
}

.right-cell {
  width: 45%;
  padding: 4px 10px 8px;
}

.header-block {
  min-height: 60px;
}

.cell-label {
  margin-bottom: 2px;
  font-size: 11px;
  font-weight: 700;
}

.cell-value {
  font-size: 12px;
}

.contact-line {
  display: inline-block;
  min-width: 44%;
  font-size: 11px;
}

.contact-line.right {
  text-align: right;
}

.remarks-cell {
  position: relative;
  padding: 0;
}

.remarks-cell::after {
  content: '';
  position: absolute;
  top: calc(100% - 1px);
  left: -1px;
  width: calc(100% + 2px);
  height: calc(var(--remarks-extension-height) - 1px);
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  background: #fff;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 0;
}

.remarks-country {
  padding: 4px 10px 8px;
  border-bottom: 1px solid #000;
}

.remarks-box {
  padding: 4px 10px 10px;
  min-height: 116px;
}

.shipping-table {
  position: relative;
  z-index: 1;
  width: 55%;
  margin-top: -1px;
}

.ship-cell {
  padding: 4px 10px;
  height: 48px;
}

.items-table {
  position: relative;
  z-index: 2;
  background: #fff;
  margin-top: -1px;
  table-layout: fixed;
}

.items-table th {
  padding: 3px 6px;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.items-table td {
  padding: 3px 8px;
  font-size: 12px;
  border-top: none;
}

.item-row td {
  border-bottom: none;
}

.item-meta,
.item-code {
  margin-left: 0;
}

.unit-label {
  margin-left: 10px;
  font-size: 10px;
}

.no-items-cell {
  padding: 14px 8px;
  border-bottom: none;
  text-align: center;
  color: #000;
}

.filler-row td {
  height: 126px;
  padding: 0;
  border-top: none;
}

.total-row {
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  align-items: center;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  margin-top: 6px;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 700;
}

.total-right {
  text-align: right;
}

.signature-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  margin-top: 48px;
  padding-right: 24px;
}

.signature-kor {
  padding-right: 72px;
  font-size: 12px;
  font-weight: 700;
}

.signature-line-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.signed-label {
  font-size: 12px;
}

.signed-line {
  display: inline-block;
  width: 230px;
  border-bottom: 1px solid #000;
}

.accent-red,
.accent-blue {
  color: #000;
  font-style: normal;
}

.accent-blue {
  font-weight: 700;
}

.italic {
  font-style: italic;
}

.text-right {
  text-align: right;
}
</style>
