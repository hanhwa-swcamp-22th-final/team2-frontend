<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import CIDocumentTemplate from '@/components/domain/document/CIDocumentTemplate.vue'
import { useCiDocuments } from '@/stores/ciDocuments'
import { usePoDocuments } from '@/stores/poDocuments'
import { useShipmentOrderDocuments } from '@/stores/shipmentOrderDocuments'
import { useToast } from '@/composables/useToast'
import { openDocumentOutputByType } from '@/utils/documentOutput'
import { formatReferenceDocumentStatus } from '@/utils/referenceDocumentStatus'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const previewOpen = ref(false)

const ciDocuments = useCiDocuments()
const poDocuments = usePoDocuments()
const shipmentOrderDocuments = useShipmentOrderDocuments()

const detail = computed(() => ciDocuments.value.find((row) => row.id === route.params.id) ?? null)
const linkedPo = computed(() => poDocuments.value.find((row) => row.id === detail.value?.poId))
const linkedShipmentOrder = computed(() => shipmentOrderDocuments.value.find((row) => row.id === detail.value?.shipmentOrderId))

function parseNumericValue(value) {
  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

const totalItemQuantity = computed(() => (
  detail.value?.items.reduce((sum, item) => sum + parseNumericValue(item.quantity), 0) ?? 0
))

const totalItemAmount = computed(() => {
  if (!detail.value?.items.length) return detail.value?.amount || '-'
  const symbol = detail.value.currency === 'EUR' ? '€' : detail.value.currency === 'JPY' ? '¥' : detail.value.currency === 'KRW' ? '₩' : '$'
  const amount = detail.value.items.reduce((sum, item) => sum + parseNumericValue(item.amount), 0)
  return `${symbol}${amount.toLocaleString('en-US')}`
})

const summaryRows = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '통화 / 총액', value: `${detail.value.currency} / ${detail.value.amount}` },
    { label: '인코텀즈', value: detail.value.incoterms || '-' },
    { label: '발행일', value: detail.value.issueDate || '-' },
  ]
})

const previewFields = computed(() => {
  if (!detail.value) return []

  return [
    { label: '발행일', value: detail.value.issueDate },
    { label: '거래처', value: detail.value.clientName },
    { label: '국가', value: detail.value.country },
    { label: '통화', value: detail.value.currency },
    { label: '인코텀즈', value: detail.value.incoterms },
    { label: '결제조건', value: detail.value.paymentTerms || '-' },
    { label: '총액', value: detail.value.amount },
  ]
})

const linkedDocuments = computed(() => {
  const rows = []

  if (linkedPo.value) {
    rows.push({
      id: linkedPo.value.id,
      label: `PO: ${linkedPo.value.id}`,
      routeName: 'po-detail',
      iconClass: 'fas fa-file-contract',
      status: linkedPo.value.status,
    })
  }

  if (linkedShipmentOrder.value) {
    rows.push({
      id: linkedShipmentOrder.value.id,
      label: `출하지시서: ${linkedShipmentOrder.value.id}`,
      routeName: 'shipment-order-detail',
      iconClass: 'fas fa-truck',
      status: linkedShipmentOrder.value.status,
    })
  }

  return rows
})

function goBack() {
  router.push({ name: 'ci' })
}

function openPreview() {
  previewOpen.value = true
}

function handlePrint() {
  if (!detail.value) return
  openDocumentOutputByType('CI', detail.value, true)
}

function handlePdfDownload() {
  if (!detail.value) return
  const opened = openDocumentOutputByType('CI', detail.value, false)
  if (opened) {
    toast.info('브라우저 인쇄 창에서 PDF로 저장할 수 있습니다.', 'PDF')
  }
}

function handlePreviewPrint() {
  previewOpen.value = false
  handlePrint()
}

function goToLinkedDocument(document) {
  if (!document?.routeName || !document?.id) return
  router.push({ name: document.routeName, params: { id: document.id } })
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6">
      <DetailPageHeader :title="detail.id" :status="detail.status" @back="goBack">
        <template #actions>
          <BaseButton variant="secondary" size="sm" @click="openPreview">
            <template #leading>
              <i class="fas fa-eye text-xs text-brand-500" aria-hidden="true"></i>
            </template>
            미리보기
          </BaseButton>
          <BaseButton size="sm" @click="handlePdfDownload">
            <template #leading>
              <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
            </template>
            PDF 다운로드
          </BaseButton>
        </template>
      </DetailPageHeader>
    </div>

    <div class="mb-6 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-4">
      <div
        v-for="row in summaryRows"
        :key="row.label"
        class="border-b border-slate-200 px-5 py-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
      >
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ row.label }}</div>
        <div class="mt-1 text-sm font-semibold text-slate-900">{{ row.value }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">문서 기본정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div><span class="text-slate-500">CI 번호</span><div class="mt-0.5 font-medium">{{ detail.id }}</div></div>
            <div><span class="text-slate-500">발행일</span><div class="mt-0.5">{{ detail.issueDate }}</div></div>
            <div><span class="text-slate-500">거래처</span><div class="mt-0.5 font-medium">{{ detail.clientName }}</div></div>
            <div><span class="text-slate-500">바이어</span><div class="mt-0.5">{{ detail.buyer || '-' }}</div></div>
            <div><span class="text-slate-500">국가</span><div class="mt-0.5">{{ detail.country }}</div></div>
            <div><span class="text-slate-500">영문주소</span><div class="mt-0.5 break-words">{{ detail.clientAddress || '-' }}</div></div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">거래 조건 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div><span class="text-slate-500">통화</span><div class="mt-0.5">{{ detail.currency }}</div></div>
            <div><span class="text-slate-500">총액</span><div class="mt-0.5 font-semibold text-slate-900">{{ detail.amount }}</div></div>
            <div><span class="text-slate-500">인코텀즈</span><div class="mt-0.5">{{ detail.incoterms }}</div></div>
            <div><span class="text-slate-500">결제조건</span><div class="mt-0.5">{{ detail.paymentTerms || '-' }}</div></div>
            <div><span class="text-slate-500">Port of Discharge</span><div class="mt-0.5">{{ detail.portOfDischarge || '-' }}</div></div>
            <div><span class="text-slate-500">Carrier</span><div class="mt-0.5">{{ detail.carrier || '-' }}</div></div>
            <div><span class="text-slate-500">Sailing on or about</span><div class="mt-0.5">{{ detail.deliveryDate || '-' }}</div></div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">품목 내역</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="p-3 text-left">품목</th>
                  <th class="p-3 text-center">HS Code</th>
                  <th class="p-3 text-right">수량</th>
                  <th class="p-3 text-right">단가</th>
                  <th class="p-3 text-right">금액</th>
                  <th class="p-3 text-left">비고</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in detail.items" :key="`${detail.id}-${item.name}`">
                  <td class="p-3">{{ item.name }}</td>
                  <td class="p-3 text-center">{{ item.hsCode || '-' }}</td>
                  <td class="p-3 text-right">{{ item.quantity }}</td>
                  <td class="p-3 text-right">{{ item.unitPrice }}</td>
                  <td class="p-3 text-right font-semibold">{{ item.amount }}</td>
                  <td class="p-3 text-slate-600">{{ item.remark || '-' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-slate-200 bg-slate-50">
                  <td class="p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">합계</td>
                  <td></td>
                  <td class="p-3 text-right font-semibold text-slate-900">{{ totalItemQuantity.toLocaleString('ko-KR') }}</td>
                  <td></td>
                  <td class="p-3 text-right text-base font-extrabold text-slate-900">{{ totalItemAmount }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">비고</h3>
          <p class="text-sm leading-6 text-slate-700">{{ detail.remarks || '-' }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">참조 문서</h3>
          <div class="space-y-2 text-sm">
            <button
              v-for="document in linkedDocuments"
              :key="document.id"
              type="button"
              class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50"
              @click="goToLinkedDocument(document)"
            >
              <i :class="document.iconClass" aria-hidden="true"></i>
              {{ document.label }}
              <StatusBadge :value="document.status" :variant="document.status">
                {{ formatReferenceDocumentStatus(document.id, document.status) }}
              </StatusBadge>
            </button>
            <div v-if="!linkedDocuments.length" class="text-xs text-slate-400">참조 문서 없음</div>
          </div>
        </div>
      </div>
    </div>

    <DocumentPreviewModal
      :open="previewOpen"
      title="CI 미리보기"
      preview-background="white"
      :document-title="detail.id"
      :fields="previewFields"
      @close="previewOpen = false"
      @print="handlePreviewPrint"
    >
      <CIDocumentTemplate :document="detail" />
    </DocumentPreviewModal>
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    Commercial Invoice를 찾을 수 없습니다.
  </div>
</template>
