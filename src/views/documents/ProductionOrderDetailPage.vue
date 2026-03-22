<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import ProductionOrderTemplate from '@/components/domain/document/ProductionOrderTemplate.vue'
import { useToast } from '@/composables/useToast'
import { openDocumentOutputByType } from '@/utils/documentOutput'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const previewOpen = ref(false)

function parseNumericValue(value) {
  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function detectCurrencySymbol(value) {
  const text = String(value ?? '')
  if (text.includes('€')) return '€'
  if (text.includes('¥')) return '¥'
  return '$'
}

const detailMap = {
  MO2026001: {
    id: 'MO2026001',
    status: '완료',
    issueDate: '2026/02/24',
    poId: 'PO26001',
    country: '말레이시아',
    clientName: 'COOLSAY SDN BHD',
    clientAddress: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
    itemName: 'H-Beam 482x300x11x15',
    manager: '김영업',
    dueDate: '2026/04/20',
    department: '영업부',
    productionSite: '부산 1공장',
    requestedBy: '김영업',
    completionTarget: '2026/04/18',
    remarks: 'PO 기준 납기보다 2일 선행 생산 완료 요청',
    linkedDocuments: [{ id: 'PO26001', status: '확정' }],
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '30', unit: 'EA', unitPrice: '$850', amount: '$25,500', remark: '절단 사양 확인 완료' },
    ],
  },
  MO2026002: {
    id: 'MO2026002',
    status: '진행중',
    issueDate: '2026/03/03',
    poId: 'PO26002',
    country: '독일',
    clientName: 'TechBridge GmbH',
    clientAddress: 'Am Sandtorkai 35, 20457 Hamburg, Germany',
    itemName: 'H-Beam 482x300x11x15',
    manager: '김영업',
    dueDate: '2026/05/25',
    department: '영업부',
    productionSite: '포항 2공장',
    requestedBy: '김영업',
    completionTarget: '2026/05/22',
    remarks: '도장 공정 포함, 출하 전 외관 검사 필요',
    linkedDocuments: [{ id: 'PO26002', status: '발송' }],
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '80', unit: 'EA', unitPrice: '€855', amount: '€68,400', remark: '도장 공정 대기' },
    ],
  },
  MO2026003: {
    id: 'MO2026003',
    status: '대기',
    issueDate: '2026/03/14',
    poId: 'PO26003',
    country: '미국',
    clientName: 'Pacific Trading Inc.',
    clientAddress: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
    itemName: 'Lubricant Oil SAE 10W-40',
    manager: '정영업',
    dueDate: '2026/06/05',
    department: '영업부',
    productionSite: '울산 포장센터',
    requestedBy: '정영업',
    completionTarget: '2026/06/03',
    remarks: '신규 거래처 첫 생산, 라벨링 시안 확인 필요',
    linkedDocuments: [{ id: 'PO26003', status: '초안' }],
    items: [
      { name: 'Lubricant Oil SAE 10W-40', quantity: '520', unit: 'EA', unitPrice: '$30', amount: '$15,600', remark: '라벨 확인 대기' },
    ],
  },
}

const detail = computed(() => detailMap[route.params.id] ?? null)
const totalQuantity = computed(() => (
  detail.value?.items.reduce((sum, item) => sum + Number.parseInt(item.quantity, 10), 0) ?? 0
))
const totalAmount = computed(() => {
  if (!detail.value?.items.length) return '-'
  const symbol = detectCurrencySymbol(detail.value.items[0].amount)
  const amount = detail.value.items.reduce((sum, item) => sum + parseNumericValue(item.amount), 0)
  return `${symbol}${amount.toLocaleString('en-US')}`
})

const previewFields = computed(() => {
  if (!detail.value) return []
  return [
    { label: '생산지시일', value: detail.value.issueDate },
    { label: 'PO', value: detail.value.poId },
    { label: '국가', value: detail.value.country },
    { label: '거래처', value: detail.value.clientName },
    { label: '품목명', value: detail.value.itemName },
    { label: '영업담당자', value: detail.value.manager },
    { label: '상태', value: detail.value.status },
    { label: '납기일', value: detail.value.dueDate },
  ]
})

const summaryRows = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '영업담당자', value: detail.value.manager || '-' },
    { label: '총수량', value: `${totalQuantity.value} EA` },
    { label: '납기일', value: detail.value.dueDate || '-' },
  ]
})

function goToLinkedDocument(documentId) {
  if (documentId?.startsWith('PO')) {
    router.push({ name: 'po-detail', params: { id: documentId } })
  }
}

function goBack() {
  router.push({ name: 'production' })
}

function openPreview() {
  previewOpen.value = true
}

function handlePrint() {
  if (!detail.value) return
  openDocumentOutputByType('PRODUCTION', detail.value, true)
}

function handlePdfDownload() {
  if (!detail.value) return
  const opened = openDocumentOutputByType('PRODUCTION', detail.value, true)
  if (opened) {
    toast.info('브라우저 인쇄 창에서 "PDF로 저장"을 선택하세요.', 'PDF')
  }
}

function handlePreviewPrint() {
  previewOpen.value = false
  handlePrint()
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
            <div><span class="text-slate-500">생산지시일</span><div class="mt-0.5 font-medium">{{ detail.issueDate }}</div></div>
            <div><span class="text-slate-500">PO</span><div class="mt-0.5 font-medium">{{ detail.poId }}</div></div>
            <div><span class="text-slate-500">지시번호</span><div class="mt-0.5 font-medium">{{ detail.id }}</div></div>
            <div><span class="text-slate-500">거래처</span><div class="mt-0.5 font-medium">{{ detail.clientName }}</div></div>
            <div><span class="text-slate-500">국가</span><div class="mt-0.5">{{ detail.country }}</div></div>
            <div><span class="text-slate-500">영업담당자</span><div class="mt-0.5">{{ detail.manager }}</div></div>
            <div><span class="text-slate-500">납기일</span><div class="mt-0.5">{{ detail.dueDate }}</div></div>
            <div><span class="text-slate-500">완료 목표일</span><div class="mt-0.5">{{ detail.completionTarget }}</div></div>
            <div class="sm:col-span-2"><span class="text-slate-500">영문주소</span><div class="mt-0.5 break-words">{{ detail.clientAddress }}</div></div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">지시 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div><span class="text-slate-500">부서</span><div class="mt-0.5">{{ detail.department }}</div></div>
            <div><span class="text-slate-500">생산 거점</span><div class="mt-0.5">{{ detail.productionSite }}</div></div>
            <div><span class="text-slate-500">요청자</span><div class="mt-0.5">{{ detail.requestedBy }}</div></div>
            <div><span class="text-slate-500">상태</span><div class="mt-0.5">{{ detail.status }}</div></div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">품목 내역</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="p-3 text-left">품목</th>
                  <th class="p-3 text-center">단위</th>
                  <th class="p-3 text-right">수량</th>
                  <th class="p-3 text-right">단가</th>
                  <th class="p-3 text-right">금액</th>
                  <th class="p-3 text-left">비고</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in detail.items" :key="`${detail.id}-${item.name}`">
                  <td class="p-3">{{ item.name }}</td>
                  <td class="p-3 text-center">{{ item.unit || '-' }}</td>
                  <td class="p-3 text-right">{{ item.quantity }}</td>
                  <td class="p-3 text-right">{{ item.unitPrice }}</td>
                  <td class="p-3 text-right font-semibold">{{ item.amount }}</td>
                  <td class="p-3 text-slate-600">{{ item.remark || '-' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-slate-200">
                  <td colspan="3" class="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">총수량</td>
                  <td class="p-3 text-right font-semibold text-slate-900">{{ totalQuantity }} EA</td>
                  <td class="p-3 text-right text-base font-extrabold text-slate-900">{{ totalAmount }}</td>
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
              v-for="document in detail.linkedDocuments"
              :key="document.id"
              type="button"
              class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50"
              @click="goToLinkedDocument(document.id)"
            >
              <i class="fas fa-file-contract" aria-hidden="true"></i>
              {{ document.id }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <DocumentPreviewModal
      :open="previewOpen"
      title="생산지시서 미리보기"
      :document-title="detail.id"
      :fields="previewFields"
      @close="previewOpen = false"
      @print="handlePreviewPrint"
    >
      <ProductionOrderTemplate :document="detail" />
    </DocumentPreviewModal>
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    생산지시서를 찾을 수 없습니다.
  </div>
</template>
