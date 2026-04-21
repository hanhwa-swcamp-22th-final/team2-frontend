<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ApprovalReviewModal from '@/components/common/ApprovalReviewModal.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useCiDocuments, loadCiDocuments } from '@/stores/ciDocuments'
import { usePiDocuments, loadPiDocuments } from '@/stores/piDocuments'
import { usePlDocuments, loadPlDocuments } from '@/stores/plDocuments'
import { usePoDocuments, loadPoDocuments } from '@/stores/poDocuments'
import { useProductionOrderDocuments, loadProductionOrderDocuments } from '@/stores/productionOrderDocuments'
import { useShipmentStatusDocuments, loadShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'
import { fetchActivities } from '@/api/activity'
import { fetchClients } from '@/api/master'
import { fetchPackageById, fetchPackages, deletePackage as deletePackageApi } from '@/api/package'
import { updateApprovalRequest } from '@/api/documents'
import { loadApprovalRequests } from '@/stores/approvalRequests'
import { label as enumLabel, PI_PO_STATUS_LABEL } from '@/utils/enumLabels'
import { useToast } from '@/composables/useToast'
import PackageDetailModal from '@/components/domain/activity/PackageDetailModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { success, error: toastError } = useToast()
const ciDocuments = useCiDocuments()
const piDocuments = usePiDocuments()
const plDocuments = usePlDocuments()
const poDocuments = usePoDocuments()
const productionOrderDocuments = useProductionOrderDocuments()
const shipmentStatusDocuments = useShipmentStatusDocuments()
const selectedRequest = ref(null)
const decisionConfirmOpen = ref(false)
const decisionSaving = ref(false)
const pendingDecision = ref('')
const rejectReason = ref('')
const clientsData = ref([])
const activitiesData = ref([])
const packagesData = ref([])
const selectedPackage = ref(null)
const deleteConfirmOpen = ref(false)

onMounted(async () => {
  // 인증되지 않은 상태에서는 API 호출하지 않음 (k8s 전환 후 401 크래시 방지)
  if (!authStore.isLoggedIn) return

  // /api/activity-packages 는 ActivityPackageQueryController @PreAuthorize 로 ADMIN/SALES 만
  // 허용. production/shipping 에서 호출 시 403 + 콘솔 에러 → 권한 가드 후 호출.
  const role = (authStore.currentUser?.role ?? '').toLowerCase()
  const canFetchPackages = role === 'admin' || role === 'sales'

  // 대시보드는 진입할 때마다 문서 store 를 강제 재조회한다. 모듈 싱글톤 store 는
  // 최초 1회만 자동 로드되므로, PI 등록/결재 후 대시보드 복귀 시 stale snapshot 이
  // 그대로 노출되어 카운트·결재현황이 반영되지 않았음 (QA 8차 #4 / #6).
  await Promise.allSettled([
    fetchClients().then((v) => { clientsData.value = v ?? [] }),
    fetchActivities().then((v) => { activitiesData.value = v ?? [] }),
    canFetchPackages
      ? fetchPackages().then((v) => { if (v) packagesData.value = v })
      : Promise.resolve(null),
    loadPiDocuments(),
    loadPoDocuments(),
    loadCiDocuments(),
    loadPlDocuments(),
    loadProductionOrderDocuments(),
    loadShipmentStatusDocuments(),
  ])

  if (canFetchPackages) {
    await ensureCreatedPackageVisible()
  }
})

const currentUser = computed(() => authStore.currentUser ?? null)
const isAdminUser = computed(() => currentUser.value?.role === 'admin')
const isProductionUser = computed(() => currentUser.value?.role === 'production')
const isShippingUser = computed(() => currentUser.value?.role === 'shipping')
const isSalesManager = computed(() => currentUser.value?.role === 'sales' && Number(currentUser.value?.positionId) === 1)
const isSalesMember = computed(() => currentUser.value?.role === 'sales' && Number(currentUser.value?.positionId) === 2)
// admin 은 모든 팀 결재 현황을 볼 수 있도록 승인자 분기에 포함 (read/review 전반)
const canApproveRequests = computed(() => isSalesManager.value || isAdminUser.value)
const showApprovalSection = computed(() => canApproveRequests.value || isSalesMember.value)
const requestSectionTitle = computed(() => {
  if (isAdminUser.value) return '전체 결재 현황'
  return canApproveRequests.value ? '결재 요청함' : '내 요청 현황'
})

function parseSlashDate(value) {
  if (!value) return 0
  return new Date(String(value).replace(/\./g, '-').replace(/\//g, '-')).getTime() || 0
}

function packageIdOf(pkg) {
  return pkg?.packageId ?? pkg?.id
}

function packageViewerIds(pkg) {
  return (pkg?.viewerIds ?? pkg?.viewers ?? [])
    .map((viewer) => (viewer && typeof viewer === 'object' ? viewer.userId ?? viewer.id : viewer))
    .filter((viewer) => viewer != null)
}

function upsertPackage(pkg) {
  const packageId = packageIdOf(pkg)
  if (!packageId) return
  const exists = packagesData.value.some((row) => String(packageIdOf(row)) === String(packageId))
  packagesData.value = exists
    ? packagesData.value.map((row) => String(packageIdOf(row)) === String(packageId) ? pkg : row)
    : [pkg, ...packagesData.value]
}

async function ensureCreatedPackageVisible() {
  const rawId = Array.isArray(route.query.createdPackageId)
    ? route.query.createdPackageId[0]
    : route.query.createdPackageId
  if (!rawId) return
  const existing = packagesData.value.find((pkg) => String(packageIdOf(pkg)) === String(rawId))
  if (existing) {
    selectedPackage.value = existing
    return
  }
  try {
    const pkg = await fetchPackageById(rawId)
    upsertPackage(pkg)
    selectedPackage.value = pkg
  } catch (e) {
    console.error('생성 패키지 상세 로드 실패', e)
  }
}

function findLatestRow(rows, dateField) {
  return [...rows].sort((left, right) => parseSlashDate(right?.[dateField]) - parseSlashDate(left?.[dateField]))[0] ?? null
}

// 카드에 어떤 상태를 어떤 순서로 노출할지 정의. 결재대기/초안 같이 "액션 필요" 상태를
// 앞쪽에 배치해 시선이 먼저 가게 한다. 가장 중요하지 않은 "확정·발행완료" 는 뒤.
const STATUS_PRIORITY = [
  '결재대기',
  '초안',
  '등록요청',
  '수정요청',
  '삭제요청',
  '반려',
  '발행대기',
  '발송대기',
  '발송완료',
  '발행완료',
  '확정',
  '취소',
  '삭제',
]

function sortByStatusPriority(label) {
  const index = STATUS_PRIORITY.indexOf(label)
  return index === -1 ? STATUS_PRIORITY.length : index
}

function buildStatusBuckets(rows) {
  const counts = new Map()
  for (const row of rows) {
    const status = String(row?.status ?? '').trim() || '기타'
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => sortByStatusPriority(a) - sortByStatusPriority(b))
    .map(([label, count]) => ({ label, count }))
}

function createSummaryCard(id, title, rows, dateField, to, iconClass, helperPrefix = '최근 발행') {
  const latestRow = findLatestRow(rows, dateField)
  return {
    id,
    title,
    count: String(rows.length),
    // 이전에는 "최신 문서 한 건의 상태" 만 표시해 전체 현황을 오인할 여지가 컸다.
    // 지금은 각 상태별 카운트를 같이 노출 (예: 결재대기 2 · 초안 3 · 확정 11).
    statusBuckets: buildStatusBuckets(rows),
    helper: latestRow?.[dateField] ? `${helperPrefix} ${latestRow[dateField]}` : '데이터 없음',
    to,
    iconClass,
  }
}

const summaryCards = computed(() => {
  if (isProductionUser.value) {
    return [
      {
        id: 'production',
        title: '생산 관리',
        count: String(productionOrderDocuments.value.length),
        statusBuckets: buildStatusBuckets(productionOrderDocuments.value),
        helper: '',
        to: '/production',
        iconClass: 'fa-industry',
      },
    ]
  }

  if (isShippingUser.value) {
    return [
      {
        id: 'shipments',
        title: '출하현황',
        count: String(shipmentStatusDocuments.value.length),
        statusBuckets: buildStatusBuckets(shipmentStatusDocuments.value),
        helper: '',
        to: '/shipments',
        iconClass: 'fa-truck',
      },
    ]
  }

  const ciPlRows = [...ciDocuments.value, ...plDocuments.value]
  const latestCiPl = findLatestRow(ciPlRows, 'issueDate')
  return [
    createSummaryCard('pi', 'PI 관리', piDocuments.value, 'issueDate', '/pi', 'fa-file-invoice'),
    createSummaryCard('po', 'PO 관리', poDocuments.value, 'issueDate', '/po', 'fa-file-contract'),
    {
      id: 'cipl',
      title: 'CI/PL 관리',
      count: String(ciPlRows.length),
      statusBuckets: buildStatusBuckets(ciPlRows),
      helper: latestCiPl?.issueDate ? `최근 발행 ${latestCiPl.issueDate}` : '데이터 없음',
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

const clientNameById = computed(() => new Map(
  clientsData.value
    .map((client) => [
      Number(client.clientId ?? client.id),
      client.clientName ?? client.name ?? '-',
    ])
    .filter(([id]) => Number.isFinite(id)),
))

function resolveActivityIcon(type) {
  if (type === 'meeting' || type === '미팅/협의') return 'fa-users'
  if (type === 'issue' || type === '이슈') return 'fa-flag'
  if (type === 'memo' || type === '메모/노트') return 'fa-sticky-note'
  if (type === 'schedule' || type === '일정') return 'fa-calendar'
  return 'fa-comment'
}

const recentActivities = computed(() => {
  return [...activitiesData.value]
    .sort((left, right) => parseSlashDate(right.date) - parseSlashDate(left.date))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      icon: resolveActivityIcon(item.type),
      title: item.title,
      company: clientNameById.value.get(Number(item.clientId)) || '-',
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
      { label: '결재자', value: row.approverName || row.approver || '미지정' },
      { label: '요청자', value: row.approvalRequestedBy || '미지정' },
      // 백엔드가 내려주는 raw enum(pending_approval 등)이 그대로 노출되는 UX 결함을 방지.
      { label: '문서 상태', value: enumLabel(PI_PO_STATUS_LABEL, row.status) || '-' },
      { label: '요청 상태', value: row.requestStatus || '-' },
      { label: '요청 시각', value: row.approvalRequestedAt || '-' },
      ...(row.approvalRejectReason
        ? [{ label: '반려 사유', value: row.approvalRejectReason, fullWidth: true }]
        : []),
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

// 24 시간 이내 요청 임계값. NEW 배지 + 행 강조용.
const NEW_REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000

function isRecentlyRequested(requestedAt) {
  const ts = parseRequestedAt(requestedAt)
  if (!ts) return false
  return Date.now() - ts < NEW_REQUEST_WINDOW_MS
}

function createRequestItem(docType, row) {
  const requestedAt = row.approvalRequestedAt || '-'
  const status = row.approvalStatus || '-'
  return {
    id: `${docType}-${row.id}`,
    docType,
    docId: row.id,
    // 실제 승인/반려 PUT 에 필요한 approvalRequestId (piDocuments/poDocuments 가 병합해둠)
    approvalRequestId: row.approvalRequestId ?? null,
    actionLabel: row.approvalAction || row.requestStatus?.replace('요청', '') || '결재',
    company: row.clientName || '-',
    requester: row.approvalRequestedBy || '미지정',
    approver: row.approverName || row.approver || '미지정',
    status,
    requestStatus: row.requestStatus || '-',
    requestedAt,
    rejectReason: row.approvalRejectReason || '',
    urgent: false,
    // "대기" 상태 + 24h 이내 요청된 건은 "NEW" 배지 + 행 강조. 결재자가 신규 유입을
    // 한눈에 식별하도록 (기존에는 status 만 보이고 "얼마나 새 요청인지" 단서 없음).
    isNew: status === '대기' && isRecentlyRequested(requestedAt),
    routeName: docType === 'PI' ? 'pi-detail' : 'po-detail',
    review: row.approvalReview || buildFallbackReview(docType, row),
  }
}

function canReviewRequest(item) {
  if (isSalesManager.value || isAdminUser.value) {
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
  // admin 은 전체 팀의 모든 상태(대기·승인·반려) 결재 현황을 본다
  if (isAdminUser.value) {
    return allRequestItems.value
  }
  // 영업 팀장은 자기 팀 대기 건을 본다 (canReviewRequest 가 PI/PO 한정)
  if (isSalesManager.value) {
    return allRequestItems.value.filter((item) => item.status === '대기' && canReviewRequest(item))
  }
  if (isSalesMember.value) {
    // 백엔드 UserInfo DTO 는 userName 필드로 내려오지만 프론트 다른 곳은
    // userName 을 우선 사용 → name 폴백. 여기서도 동일 패턴으로 맞춰야 본인이
    // 요청한 결재가 대시보드 "내 요청 현황" 에 나타난다 (과거 name 하나만 비교해
    // STAFF 본인 요청이 리스트에서 빠지던 Issue A).
    const myDisplayName = currentUser.value?.userName || currentUser.value?.name
    return allRequestItems.value.filter((item) => item.requester === myDisplayName)
  }
  return []
})

const REQUEST_PAGE_STEP = 5
const requestDisplayLimit = ref(REQUEST_PAGE_STEP)
const visibleRequestItems = computed(() => requestItems.value.slice(0, requestDisplayLimit.value))
const hasMoreRequestItems = computed(() => requestItems.value.length > requestDisplayLimit.value)
function showMoreRequests() {
  requestDisplayLimit.value = Math.min(
    requestDisplayLimit.value + REQUEST_PAGE_STEP,
    requestItems.value.length,
  )
}
function resetRequestPagination() {
  requestDisplayLimit.value = REQUEST_PAGE_STEP
}

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
  rejectReason.value = ''
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
    { label: '요청자', value: selectedRequest.value.requester || '미지정' },
    { label: '결재자', value: selectedRequest.value.approver || '미지정' },
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

async function confirmDecision() {
  if (!selectedRequest.value || !pendingDecision.value || decisionSaving.value) return

  const item = selectedRequest.value
  const approvalRequestId = item.approvalRequestId
  if (!approvalRequestId) {
    toastError('해당 요청의 결재 요청 ID를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.')
    closeDecisionConfirm()
    closeRequestReview()
    return
  }

  decisionSaving.value = true
  try {
    if (pendingDecision.value === 'approve') {
      await updateApprovalRequest(approvalRequestId, { status: 'APPROVED' })
    } else {
      await updateApprovalRequest(approvalRequestId, {
        status: 'REJECTED',
        reason: rejectReason.value.trim() || '',
      })
    }

    // 백엔드가 approval_requests + 원본 문서(PI/PO) 상태를 모두 갱신하므로
    // 양쪽 store 를 모두 다시 fetch 해 UI 에 즉시 반영. approvalRequests 는
    // PI/PO loader 가 내부에서 다시 호출한다.
    await Promise.all([loadPiDocuments(), loadPoDocuments(), loadApprovalRequests()])

    success(pendingDecision.value === 'approve' ? '결재가 승인되었습니다.' : '결재가 반려되었습니다.')
  } catch (e) {
    toastError(e?.response?.data?.message || '결재 처리 중 오류가 발생했습니다.')
  } finally {
    decisionSaving.value = false
    closeDecisionConfirm()
    closeRequestReview()
  }
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

// ── 패키지 섹션 ────────────────────────────────────────────
const currentUserId = computed(() => {
  const u = currentUser.value
  if (!u) return null
  return String(u.userId ?? u.id ?? '')
})

const visiblePackages = computed(() => {
  if (!currentUser.value) return []
  // admin 은 전체 패키지 열람 가능
  if (isAdminUser.value) {
    return [...packagesData.value]
      .sort((a, b) => parseSlashDate(b.createdAt) - parseSlashDate(a.createdAt))
      .slice(0, 5)
  }
  const uid = currentUserId.value
  return [...packagesData.value]
    .filter((pkg) => String(pkg.creatorId) === uid || packageViewerIds(pkg).map(String).includes(uid))
    .sort((a, b) => parseSlashDate(b.createdAt) - parseSlashDate(a.createdAt))
    .slice(0, 5)
})

const isPackageOwner = computed(() => {
  if (!selectedPackage.value || !currentUser.value) return false
  return String(selectedPackage.value.creatorId) === currentUserId.value
})

function openPackageDetail(pkg) {
  selectedPackage.value = pkg
}

function closePackageDetail() {
  selectedPackage.value = null
}

function handlePackageEdit() {
  if (!selectedPackage.value) return
  const packageId = selectedPackage.value.packageId ?? selectedPackage.value.id
  if (!packageId) return
  router.push({ path: '/package', query: { edit: packageId } })
  closePackageDetail()
}

function handlePackageDeleteRequest() {
  deleteConfirmOpen.value = true
}

function closeDeleteConfirm() {
  deleteConfirmOpen.value = false
}

async function confirmPackageDelete() {
  if (!selectedPackage.value) return
  const packageId = selectedPackage.value.packageId ?? selectedPackage.value.id
  if (!packageId) return
  try {
    await deletePackageApi(packageId)
    packagesData.value = packagesData.value.filter((p) => (p.packageId ?? p.id) !== packageId)
    success('패키지가 삭제되었습니다.')
    closeDeleteConfirm()
    closePackageDetail()
  } catch {
    toastError('패키지 삭제에 실패했습니다.')
    closeDeleteConfirm()
  }
}
</script>

<template>
  <div class="fade-in space-y-6">
    <section class="grid gap-4" :class="summaryGridClass">
      <RouterLink
        v-for="card in summaryCards"
        :key="card.id"
        :to="card.to"
        class="min-h-[148px] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md sm:min-h-[168px]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
            <i
              class="fas text-sm text-slate-500"
              :class="card.iconClass"
            />
          </div>
          <div class="min-w-0">
            <div class="truncate text-right text-xs font-medium text-slate-500">{{ card.title }}</div>
            <div class="mt-0.5 text-right text-2xl font-bold text-slate-800">{{ card.count }}</div>
          </div>
        </div>
        <!--
          상태별 카운트 칩: "결재대기 2 · 초안 3 · 확정 11" 식으로 전체 현황을 한 눈에.
          최신 문서 한 건의 상태만 보여주던 이전 배지는 오인 여지 있어 제거.
        -->
        <div v-if="card.statusBuckets?.length" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="bucket in card.statusBuckets"
            :key="bucket.label"
            class="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
          >
            <StatusBadge :value="bucket.label" />
            <span class="font-semibold text-slate-800">{{ bucket.count }}</span>
          </span>
        </div>
        <div v-if="card.helper" class="mt-2 flex items-center justify-between gap-3">
          <div class="truncate text-xs text-slate-400">{{ card.helper }}</div>
          <i class="fas fa-chevron-right text-xs text-slate-300" />
        </div>
      </RouterLink>
    </section>

    <!-- 공유 활동기록 패키지 (생산/출하: 요약카드 바로 뒤) -->
    <BaseCard v-if="visiblePackages.length > 0 && (isProductionUser || isShippingUser)">
      <template #title>
        <h3 class="flex items-center gap-2 font-bold text-slate-800">
          <i class="fas fa-cube text-brand-500" />
          공유 활동기록 패키지
        </h3>
      </template>
      <div class="space-y-2">
        <div
          v-for="pkg in visiblePackages"
          :key="pkg.id"
          class="group flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2 text-sm transition hover:bg-slate-50/70"
          @click="openPackageDetail(pkg)"
        >
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500">
            <i class="fas fa-cube" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium text-slate-800 transition group-hover:text-brand-600">{{ pkg.title }}</div>
            <div class="truncate text-xs text-slate-400 sm:whitespace-normal">{{ pkg.creatorName }} · {{ pkg.createdAt }}</div>
          </div>
          <i class="fas fa-chevron-right text-xs text-slate-300 self-center" />
        </div>
      </div>
    </BaseCard>

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
        v-for="item in visibleRequestItems"
        :key="item.id"
        class="flex cursor-pointer flex-col items-start gap-3 px-5 py-3.5 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
        :class="item.isNew ? 'bg-amber-50/40 hover:bg-amber-50/60' : ''"
        @click="openRequestReview(item)"
      >
        <div class="flex min-w-0 items-center gap-3">
          <!-- NEW 표시 점: 24h 이내 요청된 대기 건에만 노출. 행 배경 강조와 함께 신규 유입 식별. -->
          <span
            v-if="item.isNew"
            class="relative flex h-2 w-2 flex-shrink-0"
            title="24시간 이내 신규 요청"
          >
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
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
            <div
              class="truncate text-sm text-slate-800"
              :class="item.isNew ? 'font-semibold' : 'font-medium'"
            >
              {{ item.docType }} {{ item.docId }} — {{ item.actionLabel }} 요청
            </div>
            <div class="truncate text-xs text-slate-400 sm:whitespace-normal">
              {{ item.company }} · 요청: {{ item.requester }} → 결재: {{ item.approver }}
            </div>
          </div>
        </div>
        <div class="flex flex-shrink-0 items-center gap-2 self-end sm:self-auto">
          <span
            v-if="item.isNew"
            class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700"
          >
            NEW
          </span>
          <span
            v-if="item.urgent"
            class="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600"
          >
            긴급
          </span>
          <StatusBadge :value="item.status" />
          <i class="fas fa-chevron-right text-xs text-slate-300" />
        </div>
      </div>
      <button
        v-if="hasMoreRequestItems"
        type="button"
        class="flex w-full items-center justify-center gap-2 px-5 py-3 text-xs font-medium text-slate-500 transition hover:bg-slate-50/70 hover:text-slate-700"
        @click="showMoreRequests"
      >
        <i class="fas fa-chevron-down text-[10px]" />
        더보기 ({{ visibleRequestItems.length }} / {{ requestItems.length }})
      </button>
      <button
        v-else-if="requestDisplayLimit > REQUEST_PAGE_STEP && requestItems.length > REQUEST_PAGE_STEP"
        type="button"
        class="flex w-full items-center justify-center gap-2 px-5 py-3 text-xs font-medium text-slate-400 transition hover:bg-slate-50/70 hover:text-slate-600"
        @click="resetRequestPagination"
      >
        <i class="fas fa-chevron-up text-[10px]" />
        접기
      </button>
    </BaseCard>

    <!-- 공유 활동기록 패키지 (생산/출하: 요약카드 바로 뒤에 표시됨, 영업: 결재 뒤에 표시) -->
    <BaseCard v-if="!isProductionUser && !isShippingUser">
      <template #title>
        <h3 class="flex items-center gap-2 font-bold text-slate-800">
          <i class="fas fa-cube text-brand-500" />
          공유 활동기록 패키지
        </h3>
      </template>
      <template #header-actions>
        <RouterLink to="/package" class="text-xs font-medium text-brand-500 hover:text-brand-700">
          전체보기 <i class="fas fa-chevron-right ml-0.5 text-[9px]" />
        </RouterLink>
      </template>
      <div v-if="visiblePackages.length === 0" class="py-6 text-center text-sm text-slate-400">
        공유된 활동기록 패키지가 없습니다.
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="pkg in visiblePackages"
          :key="pkg.id"
          class="group flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2 text-sm transition hover:bg-slate-50/70"
          @click="openPackageDetail(pkg)"
        >
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500">
            <i class="fas fa-cube" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium text-slate-800 transition group-hover:text-brand-600">
              {{ pkg.packageTitle ?? pkg.title ?? '-' }}
            </div>
            <div class="truncate text-xs text-slate-400 sm:whitespace-normal">
              {{ pkg.creatorName ?? '-' }} · {{ pkg.createdAt ?? '-' }}
            </div>
          </div>
          <i class="fas fa-chevron-right text-xs text-slate-300 self-center" />
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

      <BaseCard v-if="!isProductionUser">
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
      :loading="decisionSaving"
      @confirm="confirmDecision"
      @cancel="closeDecisionConfirm"
    >
      <div v-if="pendingDecision === 'reject'" class="space-y-1.5">
        <label class="text-sm font-semibold text-slate-700">반려 사유</label>
        <textarea
          v-model="rejectReason"
          rows="3"
          placeholder="반려 사유를 입력해주세요."
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </ConfirmModal>

    <PackageDetailModal
      :open="Boolean(selectedPackage)"
      :pkg="selectedPackage"
      :is-owner="isPackageOwner"
      :activities="activitiesData"
      @close="closePackageDetail"
      @edit="handlePackageEdit"
      @delete="handlePackageDeleteRequest"
    />

    <ConfirmModal
      :open="deleteConfirmOpen"
      title="패키지 삭제"
      :message="selectedPackage ? `'${selectedPackage.title}' 패키지를 삭제하시겠습니까?` : ''"
      confirm-label="삭제"
      confirm-variant="danger"
      helper-text="삭제 후 복구할 수 없습니다."
      :z-index="90"
      @confirm="confirmPackageDelete"
      @cancel="closeDeleteConfirm"
    />
  </div>
</template>
