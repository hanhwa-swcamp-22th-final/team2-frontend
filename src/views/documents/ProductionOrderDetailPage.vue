<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import ProductionOrderTemplate from '@/components/domain/document/ProductionOrderTemplate.vue'
import { useDocumentItemCatalog } from '@/composables/useDocumentItemCatalog'
import { useAuthStore } from '@/stores/auth'
import { usePoDocuments } from '@/stores/poDocuments'
import { useToast } from '@/composables/useToast'
import { useProductionOrderDocuments } from '@/stores/productionOrderDocuments'
import { openDocumentOutputByType } from '@/utils/documentOutput'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const poDocuments = usePoDocuments()
const productionOrderDocuments = useProductionOrderDocuments()
const { loadItemCatalog, enrichDocumentItems } = useDocumentItemCatalog()

const previewOpen = ref(false)
const completeConfirmOpen = ref(false)

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

const detail = computed(() => productionOrderDocuments.value.find((row) => row.id === route.params.id) ?? null)
const displayItems = computed(() => enrichDocumentItems(detail.value?.items ?? []))
const isProductionUser = computed(() => authStore.currentUser?.role === 'production')
const canCompleteProduction = computed(() => isProductionUser.value && detail.value?.status === '진행중')
const totalQuantity = computed(() => (
  displayItems.value.reduce((sum, item) => sum + Number.parseInt(item.quantity, 10), 0)
))
const totalWeight = computed(() => {
  const weight = displayItems.value.reduce((sum, item) => sum + (item.rowWeight ?? 0), 0)
  return weight > 0 ? `${weight.toFixed(2)} kg` : '-'
})
const documentForOutput = computed(() => (
  detail.value
    ? {
        ...detail.value,
        items: displayItems.value.map((item) => ({
          ...item,
          spec: item.spec || '-',
        })),
      }
    : null
))

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

function openCompleteConfirm() {
  if (!canCompleteProduction.value) return
  completeConfirmOpen.value = true
}

function closeCompleteConfirm() {
  completeConfirmOpen.value = false
}

function confirmCompleteProduction() {
  if (!detail.value || !canCompleteProduction.value) return

  productionOrderDocuments.value = productionOrderDocuments.value.map((row) => (
    row.id === detail.value.id
      ? { ...row, status: '생산완료' }
      : row
  ))

  poDocuments.value = poDocuments.value.map((row) => {
    if (row.id !== detail.value.poId) return row

    const currentLinks = row.linkedDocuments ?? []
    return {
      ...row,
      linkedDocuments: currentLinks.map((document) => (
        document.id === detail.value.id
          ? { ...document, status: '생산완료' }
          : document
      )),
    }
  })

  completeConfirmOpen.value = false
  toast.success(`${detail.value.id}가 생산완료 처리되었습니다.`)
}

function handlePrint() {
  if (!documentForOutput.value) return
  openDocumentOutputByType('PRODUCTION', documentForOutput.value, true)
}

function handlePdfDownload() {
  if (!documentForOutput.value) return
  const opened = openDocumentOutputByType('PRODUCTION', documentForOutput.value, true)
  if (opened) {
    toast.info('브라우저 인쇄 창에서 "PDF로 저장"을 선택하세요.', 'PDF')
  }
}

function handlePreviewPrint() {
  previewOpen.value = false
  handlePrint()
}

onMounted(() => {
  loadItemCatalog()
})
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6">
      <DetailPageHeader :title="detail.id" :status="detail.status" @back="goBack">
        <template #actions>
          <BaseButton
            v-if="isProductionUser"
            size="sm"
            :disabled="!canCompleteProduction"
            @click="openCompleteConfirm"
          >
            <template #leading>
              <i class="fas fa-check-circle text-xs" aria-hidden="true"></i>
            </template>
            생산완료 처리
          </BaseButton>
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
            <table class="w-full min-w-[920px] text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="p-3 text-left">품목</th>
                  <th class="p-3 text-left">규격</th>
                  <th class="p-3 text-center">HS Code</th>
                  <th class="p-3 text-center">단위</th>
                  <th class="p-3 text-right">수량</th>
                  <th class="p-3 text-right">중량(kg)</th>
                  <th class="p-3 text-left">비고</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in displayItems" :key="`${detail.id}-${item.name}`">
                  <td class="p-3">{{ item.name }}</td>
                  <td class="p-3 text-slate-600">{{ item.spec || '-' }}</td>
                  <td class="p-3 text-center">{{ item.hsCode || '-' }}</td>
                  <td class="p-3 text-center">{{ item.unit || '-' }}</td>
                  <td class="p-3 text-right">{{ item.quantity }}</td>
                  <td class="p-3 text-right">{{ item.rowWeight != null ? item.rowWeight.toFixed(2) : '-' }}</td>
                  <td class="p-3 text-slate-600">{{ item.remark || '-' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-slate-200 bg-slate-50">
                  <td class="p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">합계</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td class="p-3 text-right font-semibold text-slate-900">{{ totalQuantity.toLocaleString('ko-KR') }} EA</td>
                  <td class="p-3 text-right text-base font-extrabold text-slate-900">{{ totalWeight }}</td>
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
      <ProductionOrderTemplate :document="documentForOutput || detail" />
    </DocumentPreviewModal>

    <ConfirmModal
      :open="completeConfirmOpen"
      title="생산완료 처리"
      message="선택한 생산지시서를 생산완료 상태로 변경하시겠습니까?"
      :detail-rows="[
        { label: '지시번호', value: detail.id },
        { label: '원천 PO', value: detail.poId },
        { label: '거래처', value: detail.clientName },
        { label: '현재 상태', value: detail.status },
      ]"
      confirm-label="생산완료 처리"
      cancel-label="취소"
      helper-text="생산완료 처리 후 생산팀 기준 작업 완료 문서로 표시됩니다."
      width="max-w-2xl"
      @confirm="confirmCompleteProduction"
      @cancel="closeCompleteConfirm"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    생산지시서를 찾을 수 없습니다.
  </div>
</template>
