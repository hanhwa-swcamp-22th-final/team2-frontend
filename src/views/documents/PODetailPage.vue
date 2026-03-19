<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { info } = useToast()

const previewOpen = ref(false)

const detailMap = {
  PO26001: {
    id: 'PO26001',
    status: '확정',
    clientName: 'COOLSAY SDN BHD',
    buyer: 'Mr. Ahmad Razak (Purchasing Manager)',
    currency: 'USD',
    incoterms: 'FOB BUSAN',
    deliveryDate: '2026/04/20',
    issueDate: '2026/02/05',
    manager: '김영업',
    linkedDocuments: [
      { id: 'PI26001', status: '확정' },
      { id: 'SO2026001', status: '준비중' },
    ],
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '30', unitPrice: '$850', amount: '$25,500' },
      { name: 'Lubricant Oil SAE 10W-40', quantity: '200', unitPrice: '$30', amount: '$6,000' },
      { name: 'Industrial Grease EP-2', quantity: '100', unitPrice: '$45', amount: '$4,500' },
      { name: 'Hydraulic Oil ISO VG 46', quantity: '32', unitPrice: '$200', amount: '$6,400' },
    ],
    totalAmount: '$42,400',
    revisionHistory: [],
  },
  PO26002: {
    id: 'PO26002',
    status: '발송',
    clientName: 'TechBridge GmbH',
    buyer: 'Ms. Hanna Schneider (Procurement Lead)',
    currency: 'EUR',
    incoterms: 'CIF HAMBURG',
    deliveryDate: '2026/05/25',
    issueDate: '2026/02/20',
    manager: '김영업',
    linkedDocuments: [
      { id: 'PI26002', status: '발송' },
    ],
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '80', unitPrice: '€855', amount: '€68,400' },
    ],
    totalAmount: '€68,400',
    revisionHistory: [],
  },
  PO26003: {
    id: 'PO26003',
    status: '초안',
    clientName: 'Pacific Trading Inc.',
    buyer: 'Mr. Jacob Miller (Import Manager)',
    currency: 'USD',
    incoterms: 'CFR LOS ANGELES',
    deliveryDate: '2026/06/05',
    issueDate: '2026/03/03',
    manager: '정영업',
    linkedDocuments: [
      { id: 'PI26003', status: '초안' },
    ],
    items: [
      { name: 'Lubricant Oil SAE 10W-40', quantity: '520', unitPrice: '$30', amount: '$15,600' },
    ],
    totalAmount: '$15,600',
    revisionHistory: [],
  },
}

const detail = computed(() => detailMap[route.params.id] ?? null)

const previewFields = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '바이어', value: detail.value.buyer },
    { label: '통화', value: detail.value.currency },
    { label: '인코텀즈', value: detail.value.incoterms },
    { label: '납기일', value: detail.value.deliveryDate },
    { label: '발행일', value: detail.value.issueDate },
  ]
})

function goBack() {
  router.push({ name: 'po' })
}

function openPreview() {
  previewOpen.value = true
}

function handleEdit() {
  info('PO 수정 폼은 다음 단계에서 연결됩니다.')
}

function handleDelete() {
  info('PO 삭제 확인 흐름은 다음 단계에서 연결됩니다.')
}

function handlePrint() {
  info('PO 인쇄 기능은 다음 단계에서 연결됩니다.')
}

function handlePdfDownload() {
  info('PO PDF 다운로드 기능은 다음 단계에서 연결됩니다.')
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        @click="goBack"
      >
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
      </button>
      <h2 class="text-xl font-bold text-slate-900">{{ detail.id }}</h2>
      <StatusBadge :value="detail.status" />
      <div class="flex-1"></div>

      <BaseButton class="!h-auto !rounded-xl !px-4 !py-2.5" @click="handleEdit">
        <template #leading>
          <i class="fas fa-edit text-xs" aria-hidden="true"></i>
        </template>
        수정
      </BaseButton>
      <BaseButton
        variant="secondary"
        class="!h-auto !rounded-xl !px-4 !py-2.5"
        @click="handleDelete"
      >
        <template #leading>
          <i class="fas fa-trash text-xs" aria-hidden="true"></i>
        </template>
        삭제
      </BaseButton>
      <BaseButton
        variant="secondary"
        class="!h-auto !rounded-xl !px-4 !py-2.5"
        @click="openPreview"
      >
        <template #leading>
          <i class="fas fa-eye text-xs text-brand-500" aria-hidden="true"></i>
        </template>
        미리보기
      </BaseButton>
      <BaseButton
        variant="secondary"
        class="!h-auto !rounded-xl !px-4 !py-2.5"
        @click="handlePrint"
      >
        <template #leading>
          <i class="fas fa-print text-xs text-slate-400" aria-hidden="true"></i>
        </template>
        인쇄
      </BaseButton>
      <BaseButton class="!h-auto !rounded-xl !px-4 !py-2.5" @click="handlePdfDownload">
        <template #leading>
          <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
        </template>
        PDF 다운로드
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">기본 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span class="text-slate-500">거래처</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.clientName }}</div>
            </div>
            <div>
              <span class="text-slate-500">바이어</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.buyer }}</div>
            </div>
            <div>
              <span class="text-slate-500">통화</span>
              <div class="mt-0.5">{{ detail.currency }}</div>
            </div>
            <div>
              <span class="text-slate-500">인코텀즈</span>
              <div class="mt-0.5">{{ detail.incoterms }}</div>
            </div>
            <div>
              <span class="text-slate-500">납기일</span>
              <div class="mt-0.5">{{ detail.deliveryDate }}</div>
            </div>
            <div>
              <span class="text-slate-500">발행일</span>
              <div class="mt-0.5">{{ detail.issueDate }}</div>
            </div>
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
              <tfoot>
                <tr class="border-t border-slate-200">
                  <td colspan="3" class="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                    합계
                  </td>
                  <td class="p-3 text-right text-base font-extrabold text-slate-900">{{ detail.totalAmount }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">연결 문서</h3>
          <div class="space-y-2 text-sm">
            <a
              v-for="document in detail.linkedDocuments"
              :key="document.id"
              href="#"
              class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50"
              @click.prevent
            >
              <i
                :class="document.id.startsWith('PI') ? 'fas fa-file-invoice' : 'fas fa-file-export'"
                aria-hidden="true"
              ></i>
              {{ document.id }}
              <StatusBadge :value="document.status" />
            </a>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">담당자</h3>
          <div class="text-sm">{{ detail.manager }}</div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">수정 이력</h3>
          </div>
          <div class="text-xs text-slate-400">
            {{ detail.revisionHistory.length ? detail.revisionHistory.join(', ') : '수정 이력 없음' }}
          </div>
        </div>
      </div>
    </div>

    <DocumentPreviewModal
      :open="previewOpen"
      title="PO 미리보기"
      :document-title="detail.id"
      :fields="previewFields"
      @close="previewOpen = false"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    PO 문서를 찾을 수 없습니다.
  </div>
</template>
