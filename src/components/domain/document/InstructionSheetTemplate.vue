<script setup>
import { computed } from 'vue'
import { buildInstructionSheetDocument } from '@/utils/instructionSheetTemplate'

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
  kind: {
    type: String,
    default: 'production',
  },
})

const sheet = computed(() => buildInstructionSheetDocument(props.document, props.kind))
</script>

<template>
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
                  <td colspan="2" class="brand-cell">{{ sheet.brandMark }} {{ sheet.brandName }}</td>
                </tr>
                <tr v-for="field in sheet.metaFields" :key="field.label">
                  <th>{{ field.label }}</th>
                  <td>{{ field.value }}</td>
                </tr>
              </tbody>
            </table>
          </td>

          <td class="title-cell">{{ sheet.title }}</td>

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
          <th>{{ sheet.quantityLabel }}</th>
          <th class="due-date-head">{{ sheet.dueLabel }}</th>
          <th>비고</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sheet.renderRows" :key="row.fillerKey || `${sheet.id}-${row.no}-${row.itemName}`">
          <td class="text-center">{{ row.no }}</td>
          <td>{{ row.clientName }}</td>
          <td>{{ row.modelName }}</td>
          <td>{{ row.itemName }}</td>
          <td>{{ row.spec }}</td>
          <td class="text-center">{{ row.quantity }}</td>
          <td class="text-center due-date-cell">{{ row.dueDate }}</td>
          <td>{{ row.remark }}</td>
        </tr>
      </tbody>
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
          <td class="remarks-body">{{ sheet.remarks }}</td>
          <td class="change-log-cell">
            <table class="change-log-table">
              <tbody>
                <tr>
                  <th colspan="2">{{ sheet.changeLogTitle }}</th>
                </tr>
                <tr>
                  <th>부서</th>
                  <th>확인서명</th>
                </tr>
                <tr v-for="row in sheet.changeLogRows" :key="row.department">
                  <td>{{ row.department }}</td>
                  <td>{{ row.signer }}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <table class="sheet-footer-table">
      <tbody>
        <tr>
          <td class="footer-left">{{ sheet.footerCode }}</td>
          <td class="footer-center">{{ sheet.footerCompany }}</td>
          <td class="footer-right">{{ sheet.footerPaper }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.instruction-sheet {
  background: #fff;
  color: #111;
  font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  font-size: 11px;
  line-height: 1.25;
}

.sheet-head-table,
.meta-table,
.approval-table,
.detail-table,
.sheet-bottom-table,
.change-log-table,
.sheet-footer-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.sheet-head-table td,
.detail-table th,
.detail-table td,
.sheet-bottom-table th,
.sheet-bottom-table td {
  border: 1px solid #111;
  box-sizing: border-box;
  font-weight: 400;
}

.meta-table th,
.meta-table td,
.approval-table th,
.approval-table td,
.change-log-table th,
.change-log-table td {
  border: 1px solid #111;
  box-sizing: border-box;
  font-weight: 400;
}

.sheet-head-table {
  table-layout: fixed;
}

.sheet-head-table > tbody > tr > td {
  height: 82px;
  padding: 0;
}

.meta-head-cell,
.approval-head-cell {
  vertical-align: top;
}

.title-cell {
  padding: 0 12px;
  text-align: center;
  vertical-align: middle;
  font-size: 18px;
  letter-spacing: 0.55em;
}

.brand-cell {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  padding: 6px 10px;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: left;
}

.meta-table th,
.meta-table td {
  padding: 4px 6px;
  font-size: 10px;
}

.meta-table {
  height: 100%;
}

.meta-table tr:first-child > * {
  border-top: 0;
}

.meta-table tr:last-child > * {
  border-bottom: 0;
}

.meta-table tr > :first-child {
  border-left: 0;
}

.meta-table tr > :last-child {
  border-right: 0;
}

.meta-table th {
  width: 36%;
  text-align: center;
  white-space: nowrap;
}

.approval-table {
  width: 100%;
  height: 100%;
  table-layout: fixed;
}

.approval-table th,
.approval-table td {
  border: 0;
  padding: 2px 4px;
  font-size: 10px;
  text-align: center;
  vertical-align: middle;
}

.approval-label-row th:not(.approval-side) {
  border-right: 1px solid #111;
  border-bottom: 1px solid #111;
  height: 24px;
}

.approval-label-row th:last-child {
  border-right: 0;
}

.approval-sign-row td {
  border-right: 1px solid #111;
  height: 54px;
}

.approval-sign-row td:last-child {
  border-right: 0;
}

.approval-side {
  position: relative;
  line-height: 1.2;
  width: 14.2857%;
}

.approval-side::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: #111;
}

.detail-table {
  margin-top: -1px;
}

.detail-table th,
.detail-table td {
  padding: 3px 4px;
  font-size: 10px;
  vertical-align: middle;
}

.detail-table thead th {
  text-align: center;
  word-break: keep-all;
}

.detail-table tbody td {
  height: 22px;
}

.due-date-head,
.due-date-cell {
  white-space: nowrap;
  font-size: 9px;
}

.sheet-bottom-table {
  margin-top: -1px;
}

.sheet-bottom-table > tbody > tr > th,
.sheet-bottom-table > tbody > tr > td {
  height: 136px;
}

.sheet-bottom-table th,
.sheet-bottom-table td {
  padding: 6px 8px;
  font-size: 10px;
  vertical-align: top;
}

.remarks-side {
  text-align: center;
  white-space: nowrap;
  vertical-align: middle !important;
}

.remarks-body {
  height: 136px;
  white-space: pre-wrap;
}

.change-log-cell {
  padding: 0;
  height: 136px;
}

.change-log-table {
  height: 100%;
}

.change-log-table th,
.change-log-table td {
  padding: 4px 6px;
  font-size: 10px;
  text-align: center;
}

.change-log-table tr:first-child > * {
  border-top: 0;
}

.change-log-table tr:last-child > * {
  border-bottom: 0;
}

.change-log-table th:first-child,
.change-log-table td:first-child {
  border-left: 0;
}

.change-log-table th:last-child,
.change-log-table td:last-child {
  border-right: 0;
}

.sheet-footer-table {
  margin-top: 6px;
}

.sheet-footer-table td {
  border: 0;
  padding: 0 2px;
  font-size: 9px;
}

.footer-left {
  text-align: left;
}

.footer-center {
  text-align: center;
}

.footer-right {
  text-align: right;
}

.text-center {
  text-align: center;
}
</style>
