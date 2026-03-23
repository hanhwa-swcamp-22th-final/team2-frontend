<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ApprovalReviewModal from '@/components/common/ApprovalReviewModal.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useCiDocuments } from '@/stores/ciDocuments'
import { usePiDocuments } from '@/stores/piDocuments'
import { usePlDocuments } from '@/stores/plDocuments'
import { usePoDocuments } from '@/stores/poDocuments'
import { useProductionOrderDocuments } from '@/stores/productionOrderDocuments'
import { useShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'
import masterData from '../../db.json'

const router = useRouter()
const authStore = useAuthStore()
const ciDocuments = useCiDocuments()
const piDocuments = usePiDocuments()
const plDocuments = usePlDocuments()
const poDocuments = usePoDocuments()
const productionOrderDocuments = useProductionOrderDocuments()
const shipmentStatusDocuments = useShipmentStatusDocuments()
const selectedRequest = ref(null)
const decisionConfirmOpen = ref(false)
const pendingDecision = ref('')

const currentUser = computed(() => authStore.currentUser ?? null)
const isAdmin = computed(() => currentUser.value?.role === 'admin')
const isProductionUser = computed(() => currentUser.value?.role === 'production')
const isShippingUser = computed(() => currentUser.value?.role === 'shipping')
const isSalesUser = computed(() => currentUser.value?.role === 'sales')
const isSalesManager = computed(() => currentUser.value?.role === 'sales' && Number(currentUser.value?.positionId) === 1)
const isSalesMember = computed(() => currentUser.value?.role === 'sales' && Number(currentUser.value?.positionId) === 2)
const canApproveRequests = computed(() => isSalesManager.value)
const showApprovalSection = computed(() => canApproveRequests.value || isSalesMember.value)
const requestSectionTitle = computed(() => (canApproveRequests.value ? '결재 요청함' : '내 요청 현황'))

function parseSlashDate(value) {
  if (!value) return 0
  return new Date(String(value).replace(/\./g, '-').replace(/\//g, '-')).getTime() || 0
}

function findLatestRow(rows, dateField) {
  return [...rows].sort((left, right) => parseSlashDate(right?.[dateField]) - parseSlashDate(left?.[dateField]))[0] ?? null
}

function createSummaryCard(id, title, rows, dateField, to, iconClass, helperPrefix = '최근 발행') {
  const latestRow = findLatestRow(rows, dateField)
  return {
    id,
    title,
    count: String(rows.length),
    status: latestRow?.status || '-',
    helper: latestRow?.[dateField] ? `${helperPrefix} ${latestRow[dateField]}` : '데이터 없음',
    to,
    iconClass,
  }
}

const summaryCards = computed(() => {
  if (isProductionUser.value) {
    const inProgressCount = productionOrderDocuments.value.filter((row) => row.status !== '생산완료').length
    return [
      {
        id: 'production',
        title: '생산 관리',
        count: String(productionOrderDocuments.value.length),
        status: inProgressCount > 0 ? '진행중' : '생산완료',
        helper: `진행중 ${inProgressCount}건`,
        to: '/production-orders',
        iconClass: 'fa-industry',
      },
    ]
  }

  if (isShippingUser.value) {
    const pendingCount = shipmentStatusDocuments.value.filter((row) => row.status !== '출하완료').length
    return [
      {
        id: 'shipments',
        title: '출하현황',
        count: String(shipmentStatusDocuments.value.length),
        status: pendingCount > 0 ? '출하준비' : '출하완료',
        helper: `출하완료 대기 ${pendingCount}건`,
        to: '/shipments',
        iconClass: 'fa-truck',
      },
      {
        id: 'shipment-pending',
        title: '출하완료 대기',
        count: String(pendingCount),
        status: pendingCount > 0 ? '출하준비' : '출하완료',
        helper: pendingCount > 0 ? '미완료 출하 건 확인' : '대기 건이 없습니다.',
        to: { path: '/shipments', query: { status: '출하준비' } },
        iconClass: 'fa-hourglass-half',
      },
    ]
  }

  return [
    createSummaryCard('pi', 'PI 관리', piDocuments.value, 'issueDate', '/pi', 'fa-file-invoice'),
    createSummaryCard('po', 'PO 관리', poDocuments.value, 'issueDate', '/po', 'fa-file-contract'),
    {
      id: 'cipl',
      title: 'CI/PL 관리',
      count: String(ciDocuments.value.length + plDocuments.value.length),
      status: findLatestRow([...ciDocuments.value, ...plDocuments.value], 'issueDate')?.status || '-',
      helper: findLatestRow([...ciDocuments.value, ...plDocuments.value], 'issueDate')?.issueDate
        ? `최근 발행 ${findLatestRow([...ciDocuments.value, ...plDocuments.value], 'issueDate')?.issueDate}`
        : '데이터 없음',
      to: '/ci',
      iconClass: 'fa-file-pdf',
    },
  ]
})

const summaryGridClass = computed(() => {
  if (summaryCards.value.length === 1) return 'sm:grid-cols-1 xl:grid-cols-1'
  if (summaryCards.value.length === 2) return 'sm:grid-cols-2 xl:grid-cols-2'
  return 'sm:grid-cols-2 xl:grid-cols-3'
})

const shipmentItems = computed(() => {
  return [...shipmentStatusDocuments.value]
    .sort((left, right) => parseSlashDate(right.updatedAt || right.requestDate) - parseSlashDate(left.updatedAt || left.requestDate))
    .slice(0, 3)
    .map((row) => ({
      id: row.id,
      shipmentNo: row.id,
      company: row.clientName,
      sourcePo: row.poId,
      dueDate: row.dueDate,
      status: row.status,
    }))
})

const clientNameById = new Map((masterData.clients ?? []).map((client) => [Number(client.id), client.name]))

function resolveActivityIcon(type) {
  if (type === '미팅/협의') return 'fa-users'
  if (type === '이슈') return 'fa-flag'
  if (type === '메모/노트') return 'fa-sticky-note'
  return 'fa-comment'
}

const recentActivities = computed(() => {
  return [...(masterData.activities ?? [])]
    .sort((left, right) => parseSlashDate(right.date) - parseSlashDate(left.date))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      icon: resolveActivityIcon(item.type),
      title: item.title,
      company: clientNameById.get(Number(item.clientId)) || '-',
      date: item.date,
    }))
})

function parseRequestedAt(value) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return 0
  return new Date(normalized.replace(/\./g, '-')).getTime() || 0
}

function buildFallbackReview(docType, row) {
  const itemRows = (row.items ?? []).map((item, index) => ({
    id: `${row.id}-item-${index}`,
    name: item.name || '-',
    qty: item.qty ?? item.quantity ?? '-',
    unit: item.unit || '-',
    unitPrice: item.unitPrice || '-',
    amount: item.amount || '-',
    remark: item.remark || '-',
  }))

  return {
    title: `${docType} ${row.approvalAction || row.requestStatus || '결재'} 검토`,
    message: '요청 시점의 검토 데이터가 없어 현재 문서 스냅샷 기준으로 표시합니다.',
    requestRows: [
      { label: '요청 유형', value: `${row.approvalAction || '-'} 요청` },
      { label: '결재자', value: row.approver || '-' },
      { label: '요청자', value: row.approvalRequestedBy || '-' },
      { label: '문서 상태', value: row.status || '-' },
      { label: '요청 상태', value: row.requestStatus || '-' },
      { label: '요청 시각', value: row.approvalRequestedAt || '-' },
    ],
    requestSectionTitle: '팀장 결재 정보',
    documentRows: [
      { label: `${docType} 번호`, value: row.id || '-' },
      { label: '거래처', value: row.clientName || '-' },
      { label: '통화', value: row.currency || '-' },
      { label: '발행일', value: row.issueDate || '-' },
      { label: '납기일', value: row.deliveryDate || '-' },
    ],
    documentSectionTitle: `${docType} 문서 정보`,
    changeColumns: [],
    changeRows: [],
    itemColumns: [
      { key: 'name', label: '품목명', align: 'left' },
      { key: 'qty', label: '수량', align: 'right' },
      { key: 'unit', label: '단위', align: 'center' },
      { key: 'unitPrice', label: '단가', align: 'right' },
      { key: 'amount', label: '금액', align: 'right' },
      { key: 'remark', label: '비고', align: 'left' },
    ],
    itemRows,
    itemSummaryRows: [
      { label: '품목 건수', value: `${itemRows.length}건` },
      { label: '총액', value: row.amount || '-', emphasis: true },
    ],
    itemSectionTitle: `${docType} 품목 정보`,
    referenceRows: [],
    referenceSectionTitle: '참조 문서 정보',
    helperText: '',
  }
}

function createRequestItem(docType, row) {
  return {
    id: `${docType}-${row.id}`,
    docType,
    docId: row.id,
    actionLabel: row.approvalAction || row.requestStatus?.replace('요청', '') || '결재',
    company: row.clientName || '-',
    requester: row.approvalRequestedBy || '-',
    approver: row.approver || '-',
    status: row.approvalStatus || '-',
    requestStatus: row.requestStatus || '-',
    requestedAt: row.approvalRequestedAt || '-',
    urgent: false,
    routeName: docType === 'PI' ? 'pi-detail' : 'po-detail',
    review: row.approvalReview || buildFallbackReview(docType, row),
  }
}

function canReviewRequest(item) {
  if (isSalesManager.value) {
    return item.docType === 'PI' || item.docType === 'PO'
  }
  return false
}

const allRequestItems = computed(() => {
  const piItems = piDocuments.value
    .filter((row) => row.requestStatus)
    .map((row) => createRequestItem('PI', row))

  const poItems = poDocuments.value
    .filter((row) => row.requestStatus)
    .map((row) => createRequestItem('PO', row))

  return [...poItems, ...piItems].sort((a, b) => parseRequestedAt(b.requestedAt) - parseRequestedAt(a.requestedAt))
})

const requestItems = computed(() => {
  if (canApproveRequests.value) {
    return allRequestItems.value.filter((item) => item.status === '대기' && canReviewRequest(item))
  }

  if (isSalesMember.value) {
    return allRequestItems.value.filter((item) => item.requester === currentUser.value?.name)
  }

  return []
})

const selectedRequestReview = computed(() => selectedRequest.value?.review ?? null)

function openRequestReview(item) {
  selectedRequest.value = item
}

function closeRequestReview() {
  selectedRequest.value = null
}

function closeDecisionConfirm() {
  decisionConfirmOpen.value = false
  pendingDecision.value = ''
}

function updateRequestDocument(item, patch) {
  const targetStore = item.docType === 'PI' ? piDocuments : poDocuments
  targetStore.value = targetStore.value.map((row) => (
    row.id === item.docId
      ? { ...row, ...patch }
      : row
  ))
}

function getReviewedAt() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

const decisionConfirmTitle = computed(() => (
  pendingDecision.value === 'approve' ? '결재 승인' : '결재 반려'
))

const decisionConfirmMessage = computed(() => {
  if (!selectedRequest.value) return ''

  return pendingDecision.value === 'approve'
    ? `해당 ${selectedRequest.value.docType} 결재 요청을 승인하시겠습니까?`
    : `해당 ${selectedRequest.value.docType} 결재 요청을 반려하시겠습니까?`
})

const decisionConfirmDetailRows = computed(() => {
  if (!selectedRequest.value) return []

  return [
    { label: '문서 종류', value: selectedRequest.value.docType },
    { label: '문서 번호', value: selectedRequest.value.docId },
    { label: '요청 유형', value: `${selectedRequest.value.actionLabel} 요청` },
    { label: '요청자', value: selectedRequest.value.requester || '-' },
    { label: '결재자', value: selectedRequest.value.approver || '-' },
    { label: '요청 시각', value: selectedRequest.value.requestedAt || '-' },
  ]
})

function openApproveConfirm() {
  pendingDecision.value = 'approve'
  decisionConfirmOpen.value = true
}

function openRejectConfirm() {
  pendingDecision.value = 'reject'
  decisionConfirmOpen.value = true
}

function confirmDecision() {
  if (!selectedRequest.value || !pendingDecision.value) return

  if (pendingDecision.value === 'approve') {
    const nextStatus = selectedRequest.value.actionLabel === '삭제' ? '취소' : '확정'
    updateRequestDocument(selectedRequest.value, {
      status: nextStatus,
      approvalStatus: '승인',
      approvalReviewedBy: currentUser.value?.name || '',
      approvalReviewedAt: getReviewedAt(),
    })
  } else {
    updateRequestDocument(selectedRequest.value, {
      status: '반려',
      approvalStatus: '반려',
      approvalReviewedBy: currentUser.value?.name || '',
      approvalReviewedAt: getReviewedAt(),
    })
  }

  closeDecisionConfirm()
  closeRequestReview()
}

function goToRequestDetail() {
  if (!selectedRequest.value) return

  router.push({
    name: selectedRequest.value.routeName,
    params: { id: selectedRequest.value.docId },
    query: { source: 'dashboard-approval-review' },
  })
  closeRequestReview()
}

function goToActivityItem(item) {
  router.push({
    path: '/activities',
    query: {
      keyword: item.company,
      source: 'dashboard-activity',
    },
  })
}

function goToShipmentItem(item) {
  router.push({
    path: '/shipments',
    query: {
      code: item.shipmentNo,
      source: 'dashboard-shipment',
    },
  })
}
</script>

<template>
  <div class="fade-in space-y-6">
    <section class="grid gap-4" :class="summaryGridClass">
      <RouterLink
        v-for="card in summaryCards"
        :key="card.id"
        :to="card.to"
        class="min-h-[136px] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md sm:min-h-[148px]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
            <i
              class="fas text-sm text-slate-500"
              :class="card.iconClass"
            />
          </div>
          <StatusBadge :value="card.status" />
        </div>
        <div class="mt-4 flex items-end justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate text-xs font-medium text-slate-500">{{ card.title }}</div>
            <div class="mt-1 text-2xl font-bold text-slate-800">{{ card.count }}</div>
          </div>
          <i class="fas fa-chevron-right text-xs text-slate-300" />
        </div>
        <div class="mt-3 truncate text-xs text-slate-400">{{ card.helper }}</div>
      </RouterLink>
    </section>

    <BaseCard
      v-if="showApprovalSection"
      body-class="-mx-5 -mb-5 max-h-[400px] divide-y divide-slate-100 overflow-y-auto"
    >
      <template #title>
        <h3 class="flex items-center gap-2 font-bold text-slate-800">
          <i class="fas fa-stamp text-brand-500" />
          {{ requestSectionTitle }}
        </h3>
      </template>
      <template #header-actions>
        <span class="text-xs font-medium text-slate-400">{{ requestItems.length }}건</span>
      </template>
      <div
        v-if="!requestItems.length"
        class="px-5 py-10 text-center text-sm text-slate-400"
      >
        표시할 결재 요청이 없습니다.
      </div>
      <div
        v-for="item in requestItems"
        :key="item.id"
        class="flex cursor-pointer flex-col items-start gap-3 px-5 py-3.5 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
        @click="openRequestReview(item)"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
            :class="item.actionLabel === '삭제' ? 'bg-red-50' : 'bg-blue-50'"
          >
            <i
              class="fas text-xs"
              :class="item.actionLabel === '삭제' ? 'fa-trash text-red-400' : 'fa-edit text-blue-400'"
            />
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-slate-800">
              {{ item.docType }} {{ item.docId }} — {{ item.actionLabel }} 요청
            </div>
            <div class="truncate text-xs text-slate-400 sm:whitespace-normal">
              {{ item.company }} · 요청: {{ item.requester }} → 결재: {{ item.approver }}
            </div>
          </div>
        </div>
        <div class="flex flex-shrink-0 items-center gap-2 self-end sm:self-auto">
          <span
            v-if="item.urgent"
            class="rounded px-1.5 py-0.5 text-[10px] font-bold text-red-600 bg-red-50"
          >
            긴급
          </span>
          <StatusBadge :value="item.status" />
          <i class="fas fa-chevron-right text-xs text-slate-300" />
        </div>
      </div>
    </BaseCard>

    <section class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <BaseCard>
        <template #title>
          <h3 class="font-bold text-slate-800">최근 활동</h3>
        </template>
        <template #header-actions>
          <RouterLink to="/activities" class="text-xs font-medium text-brand-500 hover:text-brand-700">
            전체보기 <i class="fas fa-chevron-right ml-0.5 text-[9px]" />
          </RouterLink>
        </template>
        <div class="space-y-3">
          <div
            v-for="item in recentActivities"
            :key="item.id"
            class="group flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1 text-sm transition hover:bg-slate-50/70"
            @click="goToActivityItem(item)"
          >
            <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500">
              <i class="fas" :class="item.icon" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium text-slate-800 transition group-hover:text-brand-600">{{ item.title }}</div>
              <div class="truncate text-xs text-slate-400 sm:whitespace-normal">{{ item.company }} · {{ item.date }}</div>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <template #title>
          <h3 class="font-bold text-slate-800">출하 현황</h3>
        </template>
        <template #header-actions>
          <RouterLink to="/shipments" class="text-xs font-medium text-brand-500 hover:text-brand-700">
            전체보기 <i class="fas fa-chevron-right ml-0.5 text-[9px]" />
          </RouterLink>
        </template>
        <div class="space-y-3">
          <div
            v-for="item in shipmentItems"
            :key="item.id"
            class="flex cursor-pointer flex-col items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-sm transition hover:border-slate-200 sm:flex-row sm:items-center sm:justify-between"
            @click="goToShipmentItem(item)"
          >
            <div class="min-w-0">
              <div class="font-semibold text-slate-800">{{ item.shipmentNo }}</div>
              <div class="truncate mt-0.5 text-xs text-slate-400 sm:whitespace-normal">{{ item.company }}</div>
              <div class="truncate mt-1 text-[11px] text-slate-400 sm:whitespace-normal">{{ item.sourcePo }} · 납기 {{ item.dueDate }}</div>
            </div>
            <div class="flex shrink-0 items-center gap-2 sm:ml-4">
              <StatusBadge :value="item.status" />
            </div>
          </div>
        </div>
      </BaseCard>
    </section>

    <ApprovalReviewModal
      :open="Boolean(selectedRequest)"
      :title="selectedRequestReview?.title || '결재 검토'"
      :message="selectedRequestReview?.message || ''"
      :request-rows="selectedRequestReview?.requestRows || []"
      :request-section-title="selectedRequestReview?.requestSectionTitle || '결재 요청 정보'"
      :document-rows="selectedRequestReview?.documentRows || []"
      :document-section-title="selectedRequestReview?.documentSectionTitle || '문서 정보'"
      :change-columns="selectedRequestReview?.changeColumns || []"
      :change-rows="selectedRequestReview?.changeRows || []"
      :change-section-title="selectedRequestReview?.changeSectionTitle || '변경 사항'"
      :item-columns="selectedRequestReview?.itemColumns || []"
      :item-rows="selectedRequestReview?.itemRows || []"
      :item-summary-rows="selectedRequestReview?.itemSummaryRows || []"
      :item-section-title="selectedRequestReview?.itemSectionTitle || '품목 정보'"
      :reference-rows="selectedRequestReview?.referenceRows || []"
      :reference-section-title="selectedRequestReview?.referenceSectionTitle || '참조 문서 정보'"
      :helper-text="selectedRequestReview?.helperText || ''"
      :can-approve="canApproveRequests"
      @close="closeRequestReview"
      @detail="goToRequestDetail"
      @approve="openApproveConfirm"
      @reject="openRejectConfirm"
    />

    <ConfirmModal
      :open="decisionConfirmOpen"
      :title="decisionConfirmTitle"
      :message="decisionConfirmMessage"
      :detail-rows="decisionConfirmDetailRows"
      :confirm-label="pendingDecision === 'approve' ? '승인' : '반려'"
      :confirm-variant="pendingDecision === 'approve' ? 'primary' : 'danger'"
      helper-text="처리 후 요청 상태와 문서 상태가 즉시 갱신됩니다."
      width="max-w-2xl"
      :z-index="90"
      @confirm="confirmDecision"
      @cancel="closeDecisionConfirm"
    />
  </div>
</template>
