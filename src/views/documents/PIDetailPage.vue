<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import PIFormModal from '@/components/domain/document/PIFormModal.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { info, success } = useToast()

const previewOpen = ref(false)
const formOpen = ref(false)
const deleteOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedClient = ref(null)

const detailMap = {
  PI26001: {
    id: 'PI26001',
    status: '확정',
    clientName: 'COOLSAY SDN BHD',
    buyer: 'Mr. Ahmad Razak (Purchasing Manager)',
    currency: 'USD',
    incoterms: 'FOB BUSAN',
    deliveryDate: '2026/04/15',
    issueDate: '2026/02/01',
    manager: '김영업',
    linkedDocuments: [
      { id: 'PO26001', status: '생산중' },
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
  PI26002: {
    id: 'PI26002',
    status: '발송',
    clientName: 'TechBridge GmbH',
    buyer: 'Ms. Hanna Schneider (Procurement Lead)',
    currency: 'EUR',
    incoterms: 'CIF HAMBURG',
    deliveryDate: '2026/05/20',
    issueDate: '2026/02/15',
    manager: '김영업',
    linkedDocuments: [
      { id: 'PO26002', status: '생산중' },
    ],
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '80', unitPrice: '€855', amount: '€68,400' },
    ],
    totalAmount: '€68,400',
    revisionHistory: [],
  },
  PI26003: {
    id: 'PI26003',
    status: '초안',
    clientName: 'Pacific Trading Inc.',
    buyer: 'Mr. Jacob Miller (Import Manager)',
    currency: 'USD',
    incoterms: 'CFR LOS ANGELES',
    deliveryDate: '2026/06/01',
    issueDate: '2026/03/01',
    manager: '정영업',
    linkedDocuments: [],
    items: [
      { name: 'Lubricant Oil SAE 10W-40', quantity: '520', unitPrice: '$30', amount: '$15,600' },
    ],
    totalAmount: '$15,600',
    revisionHistory: [],
  },
}

const detail = computed(() => detailMap[route.params.id] ?? null)

const clientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아', buyers: ['Mr. Ahmad Razak (Purchasing Manager)', 'Ms. Siti Nurhaliza (Director)'] },
  { id: 'CL002', name: 'TechBridge GmbH', country: '독일', buyers: ['Ms. Hanna Schneider (Procurement Lead)'] },
  { id: 'CL003', name: 'Pacific Trading Inc.', country: '미국', buyers: ['Mr. Jacob Miller (Import Manager)'] },
]

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource
  return clientRowsSource.filter((client) => [client.id, client.name, client.country].some((value) => value.toLowerCase().includes(keyword)))
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
  router.push({ name: 'pi' })
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
  info('PI 인쇄 기능은 다음 단계에서 연결됩니다.')
}

function handlePdfDownload() {
  info('PI PDF 다운로드 기능은 다음 단계에서 연결됩니다.')
}

function handleSave() {
  formOpen.value = false
  success(`${detail.value?.id} 수정 폼이 연결되었습니다.`)
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function handleClientSelect(client) {
  selectedClient.value = client
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function confirmDelete() {
  deleteOpen.value = false
  success(`${detail.value?.id} 삭제 확인이 연결되었습니다.`)
  router.push({ name: 'pi' })
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
            <template v-if="detail.linkedDocuments.length">
              <a
                v-for="document in detail.linkedDocuments"
                :key="document.id"
                href="#"
                class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50"
                @click.prevent
              >
                <i class="fas fa-file-contract" aria-hidden="true"></i>
                {{ document.id }}
                <StatusBadge :value="document.status" />
              </a>
            </template>
            <div v-else class="text-xs text-slate-400">연결 문서 없음</div>
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
      title="PI 미리보기"
      :document-title="detail.id"
      :fields="previewFields"
      @close="previewOpen = false"
    />

    <PIFormModal
      :open="formOpen"
      mode="edit"
      :document="{
        id: detail.id,
        clientName: detail.clientName,
        currency: detail.currency,
        incoterms: detail.incoterms,
        deliveryDate: detail.deliveryDate,
        items: detail.items.map((item) => ({
          name: item.name,
          qty: item.quantity,
          unitPrice: item.unitPrice.replace(/[^0-9.]/g, ''),
          amount: item.amount,
        })),
      }"
      :selected-client="selectedClient"
      @open-client-search="openClientSearch"
      @close="formOpen = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="deleteOpen"
      title="PI 삭제"
      message="아래 PI를 삭제하시겠습니까?"
      :detail="detail.id"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
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
    PI 문서를 찾을 수 없습니다.
  </div>
</template>
