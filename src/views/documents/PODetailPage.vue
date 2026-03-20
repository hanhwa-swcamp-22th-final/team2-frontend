<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import PODocumentTemplate from '@/components/domain/document/PODocumentTemplate.vue'
import POFormModal from '@/components/domain/document/POFormModal.vue'
import { useToast } from '@/composables/useToast'
import { openDocumentOutputByType } from '@/utils/documentOutput'

const route = useRoute()
const router = useRouter()
const { info, success } = useToast()

const previewOpen = ref(false)
const formOpen = ref(false)
const deleteOpen = ref(false)
const piSearchOpen = ref(false)
const piSearchKeyword = ref('')
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedPi = ref(null)
const selectedClient = ref(null)

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

const piRowsSource = [
  { id: 'PI26001', clientName: 'COOLSAY SDN BHD', currency: 'USD', deliveryDate: '2026/04/15' },
  { id: 'PI26002', clientName: 'TechBridge GmbH', currency: 'EUR', deliveryDate: '2026/05/20' },
  { id: 'PI26003', clientName: 'Pacific Trading Inc.', currency: 'USD', deliveryDate: '2026/06/01' },
]
const clientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아' },
  { id: 'CL002', name: 'TechBridge GmbH', country: '독일' },
  { id: 'CL003', name: 'Pacific Trading Inc.', country: '미국' },
]

const piRows = computed(() => {
  const keyword = piSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return piRowsSource
  return piRowsSource.filter((row) => [row.id, row.clientName, row.currency, row.deliveryDate].some((value) => String(value).toLowerCase().includes(keyword)))
})

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource
  return clientRowsSource.filter((row) => [row.id, row.name, row.country].some((value) => String(value).toLowerCase().includes(keyword)))
})

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
  formOpen.value = true
}

function handleDelete() {
  deleteOpen.value = true
}

function handlePrint() {
  if (!detail.value) return
  openDocumentOutputByType('PO', detail.value, true)
}

function handlePdfDownload() {
  if (!detail.value) return
  const opened = openDocumentOutputByType('PO', detail.value, true)
  if (opened) {
    info('브라우저 인쇄 창에서 "PDF로 저장"을 선택하세요.', 'PDF')
  }
}

function handlePreviewPrint() {
  previewOpen.value = false
  handlePrint()
}

function handleSave() {
  formOpen.value = false
  success(`${detail.value?.id} 수정 폼이 연결되었습니다.`)
}

function openPiSearch() {
  piSearchOpen.value = true
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function handlePiSelect(pi) {
  selectedPi.value = pi
  piSearchOpen.value = false
  piSearchKeyword.value = ''
}

function handleClientSelect(client) {
  selectedClient.value = client
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function goToLinkedDocument(documentId) {
  if (documentId?.startsWith('PI')) {
    router.push({ name: 'pi-detail', params: { id: documentId } })
    return
  }

  if (documentId?.startsWith('SO')) {
    router.push({ name: 'shipment-order-detail', params: { id: documentId } })
  }
}

function confirmDelete() {
  deleteOpen.value = false
  success(`${detail.value?.id}가 삭제되었습니다.`)
  router.push({ name: 'po' })
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6">
      <DetailPageHeader :title="detail.id" :status="detail.status" @back="goBack">
        <template #actions>
          <BaseButton size="sm" @click="handleEdit">
            <template #leading>
              <i class="fas fa-edit text-xs" aria-hidden="true"></i>
            </template>
            수정
          </BaseButton>
          <BaseButton variant="secondary" size="sm" @click="handleDelete">
            <template #leading>
              <i class="fas fa-trash text-xs" aria-hidden="true"></i>
            </template>
            삭제
          </BaseButton>
          <BaseButton variant="secondary" size="sm" @click="openPreview">
            <template #leading>
              <i class="fas fa-eye text-xs text-brand-500" aria-hidden="true"></i>
            </template>
            미리보기
          </BaseButton>
          <BaseButton variant="secondary" size="sm" @click="handlePrint">
            <template #leading>
              <i class="fas fa-print text-xs text-slate-400" aria-hidden="true"></i>
            </template>
            인쇄
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
            <button
              v-for="document in detail.linkedDocuments"
              :key="document.id"
              type="button"
              class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50"
              @click="goToLinkedDocument(document.id)"
            >
              <i
                :class="document.id.startsWith('PI') ? 'fas fa-file-invoice' : 'fas fa-file-export'"
                aria-hidden="true"
              ></i>
              {{ document.id }}
              <StatusBadge :value="document.status" />
            </button>
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
      @print="handlePreviewPrint"
    >
      <PODocumentTemplate :document="detail" />
    </DocumentPreviewModal>

    <POFormModal
      :open="formOpen"
      mode="edit"
      :document="{
        id: detail.id,
        piId: detail.linkedDocuments.find((document) => document.id.startsWith('PI'))?.id ?? '',
        clientName: detail.clientName,
        deliveryDate: detail.deliveryDate,
      }"
      :selected-pi="selectedPi"
      :selected-client="selectedClient"
      @open-pi-search="openPiSearch"
      @open-client-search="openClientSearch"
      @close="formOpen = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="deleteOpen"
      title="PO 삭제"
      message="아래 PO를 삭제하시겠습니까?"
      :detail="detail.id"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
    />

    <SearchModal
      :open="piSearchOpen"
      title="PI 검색"
      :columns="[
        { key: 'id', label: 'PI번호' },
        { key: 'clientName', label: '거래처명' },
        { key: 'currency', label: '통화' },
        { key: 'deliveryDate', label: '납기일' },
      ]"
      :rows="piRows"
      :search-keyword="piSearchKeyword"
      @update:search-keyword="piSearchKeyword = $event"
      @close="piSearchOpen = false"
      @select="handlePiSelect"
    />

    <SearchModal
      :open="clientSearchOpen"
      title="거래처 검색"
      :columns="[
        { key: 'id', label: '코드' },
        { key: 'name', label: '거래처명' },
        { key: 'country', label: '국가' },
      ]"
      :rows="clientRows"
      :search-keyword="clientSearchKeyword"
      @update:search-keyword="clientSearchKeyword = $event"
      @close="clientSearchOpen = false"
      @select="handleClientSelect"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    PO 문서를 찾을 수 없습니다.
  </div>
</template>
