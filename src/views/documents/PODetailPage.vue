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
import { useSearchModalLookups } from '@/composables/useSearchModalLookups'
import { useToast } from '@/composables/useToast'
import { usePiDocuments } from '@/stores/piDocuments'
import { usePoDocuments } from '@/stores/poDocuments'
import { buildApprovalInfoRows } from '@/utils/documentApproval'
import { openDocumentOutputByType } from '@/utils/documentOutput'
import { clientSearchColumns } from '@/utils/searchModalColumns'

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
const piDocuments = usePiDocuments()
const poDocuments = usePoDocuments()

const { createClientRows } = useSearchModalLookups()

const piRows = computed(() => {
  const keyword = piSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return piDocuments.value
  return piDocuments.value.filter((row) => [row.id, row.clientName, row.currency, row.deliveryDate].some((value) => String(value ?? '').toLowerCase().includes(keyword)))
})

const clientRows = createClientRows(clientSearchKeyword)

function parseNumericValue(value) {
  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatCurrencyValue(currency, value) {
  const symbolMap = { KRW: '₩', USD: '$', EUR: '€', JPY: '¥' }
  const symbol = symbolMap[currency] ?? `${currency} `
  return `${symbol}${Math.round(value).toLocaleString('en-US')}`
}

function buildLinkedDocuments(row) {
  const currentLinks = row.linkedDocuments ?? []

  if (currentLinks.length) {
    return currentLinks
  }

  const linkedPi = piDocuments.value.find((pi) => pi.id === (row.piId || row.linkedPiId))
  return linkedPi ? [{ id: linkedPi.id, status: linkedPi.status }] : []
}

function normalizeDetail(row) {
  if (!row) return null

  const currency = row.currency || 'USD'
  const items = (row.items ?? []).map((item) => ({
    name: item.name ?? '',
    quantity: String(item.qty ?? item.quantity ?? ''),
    unit: item.unit ?? 'EA',
    unitPrice: formatCurrencyValue(currency, parseNumericValue(item.unitPrice)),
    amount: formatCurrencyValue(currency, parseNumericValue(item.amount)),
    remark: item.remark ?? '',
  }))

  const totalAmountValue = items.reduce((sum, item) => sum + parseNumericValue(item.amount), 0)

  return {
    ...row,
    buyer: row.buyerName || row.buyer || '-',
    incoterms: row.incoterms ? `${row.incoterms}${row.namedPlace ? ` ${row.namedPlace}` : ''}` : '-',
    linkedDocuments: buildLinkedDocuments(row),
    items,
    totalAmount: row.totalAmount || row.amount || formatCurrencyValue(currency, totalAmountValue),
    revisionHistory: row.revisionHistory ?? [],
  }
}

const detail = computed(() => normalizeDetail(
  poDocuments.value.find((row) => row.id === route.params.id),
))

const approvalInfoRows = computed(() => buildApprovalInfoRows(detail.value))
const linkedPiDocument = computed(() => piDocuments.value.find((row) => row.id === (detail.value?.piId || detail.value?.linkedPiId)))

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

const summaryRows = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '영업담당자', value: detail.value.manager || '-' },
    { label: '통화 / 총액', value: `${detail.value.currency} / ${detail.value.totalAmount}` },
    { label: '납기일', value: detail.value.deliveryDate || '-' },
  ]
})

const documentNote = computed(() => detail.value?.remarks || '-')

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

function formatSlashDate(value) {
  return value ? value.replaceAll('-', '/') : '-'
}

function handleSave(formValue) {
  if (!detail.value) return

  const linkedPi = piDocuments.value.find((row) => row.id === formValue.linkedPiId)
  const currency = linkedPi?.currency || formValue.currency || detail.value.currency || 'USD'
  const items = (linkedPi?.items ?? detail.value.items ?? []).map((item) => ({
    name: item.name ?? '',
    qty: String(item.qty ?? item.quantity ?? ''),
    unit: item.unit ?? 'EA',
    unitPrice: String(parseNumericValue(item.unitPrice)),
    amount: String(parseNumericValue(item.amount)),
    remark: item.remark ?? '',
  }))
  const totalAmount = items.reduce((sum, item) => sum + parseNumericValue(item.amount), 0)

  poDocuments.value = poDocuments.value.map((row) => (
    row.id === detail.value.id
      ? {
        ...row,
        piId: formValue.linkedPiId || '',
        linkedPiId: formValue.linkedPiId || '',
        clientName: linkedPi?.clientName || formValue.clientName || row.clientName,
        clientAddress: linkedPi?.clientAddress || row.clientAddress || '',
        buyerName: linkedPi?.buyerName || row.buyerName || '',
        currency,
        country: linkedPi?.country || row.country || '-',
        itemName: items[0]?.name || row.itemName,
        amount: formatCurrencyValue(currency, totalAmount),
        totalAmount: formatCurrencyValue(currency, totalAmount),
        incoterms: linkedPi?.incoterms || row.incoterms || '',
        namedPlace: linkedPi?.namedPlace || row.namedPlace || '',
        deliveryDate: formatSlashDate(formValue.deliveryDate),
        sourceDeliveryDate: formatSlashDate(formValue.sourceDeliveryDate),
        deliveryDateOverride: Boolean(formValue.linkedPiId && formValue.deliveryDateOverride),
        approver: formValue.approver || row.approver || '',
        items,
      }
      : row
  ))

  formOpen.value = false
  success(`${detail.value?.id} 수정 내용이 반영되었습니다.`)
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
  poDocuments.value = poDocuments.value.filter((row) => row.id !== detail.value?.id)
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
            <div>
              <span class="text-slate-500">거래처</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.clientName }}</div>
            </div>
            <div>
              <span class="text-slate-500">바이어</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.buyer }}</div>
            </div>
            <div>
              <span class="text-slate-500">영문주소</span>
              <div class="mt-0.5 break-words">{{ detail.clientAddress || '-' }}</div>
            </div>
            <div>
              <span class="text-slate-500">국가</span>
              <div class="mt-0.5">{{ detail.country || '-' }}</div>
            </div>
            <div>
              <span class="text-slate-500">발행일</span>
              <div class="mt-0.5">{{ detail.issueDate }}</div>
            </div>
            <div>
              <span class="text-slate-500">PO 번호</span>
              <div class="mt-0.5 font-medium">{{ detail.id }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">거래 조건 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span class="text-slate-500">통화</span>
              <div class="mt-0.5">{{ detail.currency }}</div>
            </div>
            <div>
              <span class="text-slate-500">총액</span>
              <div class="mt-0.5 font-semibold text-slate-900">{{ detail.totalAmount }}</div>
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
              <span class="text-slate-500">PI 기준 납기일</span>
              <div class="mt-0.5">{{ detail.sourceDeliveryDate || linkedPiDocument?.deliveryDate || '-' }}</div>
            </div>
            <div>
              <span class="text-slate-500">납기 처리</span>
              <div class="mt-0.5">{{ detail.deliveryDateOverride ? 'PO 별도 조정' : 'PI 기준값 사용' }}</div>
            </div>
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
                  <td colspan="4" class="p-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                    합계
                  </td>
                  <td class="p-3 text-right text-base font-extrabold text-slate-900">{{ detail.totalAmount }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">비고</h3>
          <p class="text-sm leading-6 text-slate-700">{{ documentNote }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">결재 정보</h3>
          <div v-if="approvalInfoRows.length" class="space-y-3 text-sm">
            <div
              v-for="row in approvalInfoRows"
              :key="row.label"
              class="flex items-start justify-between gap-3"
            >
              <span class="text-slate-500">{{ row.label }}</span>
              <div class="text-right">
                <StatusBadge
                  v-if="['문서 상태', '결재 상태', '요청 상태'].includes(row.label)"
                  :value="row.value"
                />
                <span v-else class="break-words font-medium text-slate-700">{{ row.value }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-slate-400">결재 요청 이력 없음</div>
        </div>

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
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">변경 이력</h3>
          </div>
          <div class="text-xs text-slate-400">
            {{ detail.revisionHistory.length ? detail.revisionHistory.join(', ') : '변경 이력 없음' }}
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
        currency: detail.currency,
        deliveryDate: detail.deliveryDate,
        sourceDeliveryDate: detail.sourceDeliveryDate,
        deliveryDateOverride: detail.deliveryDateOverride,
        approver: detail.approver,
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
      :columns="clientSearchColumns"
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
