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

const detailMap = {
  MO2026001: {
    id: 'MO2026001',
    status: '완료',
    issueDate: '2026/02/24',
    poId: 'PO26001',
    country: '말레이시아',
    clientName: 'COOLSAY SDN BHD',
    itemName: 'H-Beam 482x300x11x15',
    manager: '김영업',
    dueDate: '2026/04/20',
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '30', unitPrice: '$850', amount: '$25,500' },
    ],
  },
  MO2026002: {
    id: 'MO2026002',
    status: '진행중',
    issueDate: '2026/03/03',
    poId: 'PO26002',
    country: '독일',
    clientName: 'TechBridge GmbH',
    itemName: 'H-Beam 482x300x11x15',
    manager: '김영업',
    dueDate: '2026/05/25',
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '80', unitPrice: '€855', amount: '€68,400' },
    ],
  },
  MO2026003: {
    id: 'MO2026003',
    status: '대기',
    issueDate: '2026/03/14',
    poId: 'PO26003',
    country: '미국',
    clientName: 'Pacific Trading Inc.',
    itemName: 'Lubricant Oil SAE 10W-40',
    manager: '정영업',
    dueDate: '2026/06/05',
    items: [
      { name: 'Lubricant Oil SAE 10W-40', quantity: '520', unitPrice: '$30', amount: '$15,600' },
    ],
  },
}

const detail = computed(() => detailMap[route.params.id] ?? null)

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

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">기본 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div><span class="text-slate-500">생산지시일</span><div class="mt-0.5 font-medium">{{ detail.issueDate }}</div></div>
            <div><span class="text-slate-500">PO</span><div class="mt-0.5 font-medium">{{ detail.poId }}</div></div>
            <div><span class="text-slate-500">국가</span><div class="mt-0.5">{{ detail.country }}</div></div>
            <div><span class="text-slate-500">거래처</span><div class="mt-0.5 font-medium">{{ detail.clientName }}</div></div>
            <div><span class="text-slate-500">영업담당자</span><div class="mt-0.5">{{ detail.manager }}</div></div>
            <div><span class="text-slate-500">납기일</span><div class="mt-0.5">{{ detail.dueDate }}</div></div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">품목 목록</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[620px] text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="p-3 text-left">품목</th>
                  <th class="p-3 text-right">수량</th>
                  <th class="p-3 text-right">단가</th>
                  <th class="p-3 text-right">금액</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in detail.items" :key="`${detail.id}-${item.name}`">
                  <td class="p-3">{{ item.name }}</td>
                  <td class="p-3 text-right">{{ item.quantity }}</td>
                  <td class="p-3 text-right">{{ item.unitPrice }}</td>
                  <td class="p-3 text-right font-semibold">{{ item.amount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">연결 문서</h3>
          <a href="#" class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50" @click.prevent>
            <i class="fas fa-file-contract" aria-hidden="true"></i>
            {{ detail.poId }}
          </a>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">담당자</h3>
          <div class="text-sm">{{ detail.manager }}</div>
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
