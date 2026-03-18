<script setup>
import { onMounted, ref } from 'vue'
import { fetchDashboardKpis } from '@/api/dashboard'
import StatusBadge from '@/components/common/StatusBadge.vue'

const summaryCards = ref([
  {
    id: 'pi',
    title: 'PI 문서',
    count: '3',
    status: '확정',
    helper: '진행중',
  },
  {
    id: 'po',
    title: 'PO 문서',
    count: '3',
    status: '생산중',
    helper: '진행중',
  },
  {
    id: 'cipl',
    title: 'CI/PL 문서',
    count: '1',
    status: '출하완료',
    helper: '완료',
  },
])
const isLoading = ref(true)

const requestItems = [
  {
    id: 1,
    docType: 'PO',
    docId: 'PO26002',
    actionLabel: '수정',
    company: 'COOLSAY SDN BHD',
    requester: '김영업(과장)',
    approver: '최관리(이사)',
    status: '대기',
    urgent: false,
  },
  {
    id: 2,
    docType: 'PO',
    docId: 'PO26004',
    actionLabel: '삭제',
    company: 'TechBridge GmbH',
    requester: '정영업(대리)',
    approver: '최관리(이사)',
    status: '진행중',
    urgent: true,
  },
  {
    id: 3,
    docType: 'PI',
    docId: 'PI26005',
    actionLabel: '수정',
    company: 'Sakura Electronics',
    requester: '정영업(대리)',
    approver: '최관리(이사)',
    status: '완료',
    urgent: false,
  },
]

const shipmentItems = [
  {
    id: 1,
    shipmentNo: 'SH26002',
    company: 'COOLSAY SDN BHD',
    sourcePo: 'PO26002',
    dueDate: '2026/04/10',
    status: '출하완료',
  },
  {
    id: 2,
    shipmentNo: 'SH26004',
    company: 'Viet Steel JSC',
    sourcePo: 'PO26004',
    dueDate: '2026/04/15',
    status: '준비중',
  },
  {
    id: 3,
    shipmentNo: 'SH26005',
    company: 'Pacific Trading Inc.',
    sourcePo: 'PO26005',
    dueDate: '2026/04/18',
    status: '준비완료',
  },
]

const recentActivities = [
  {
    id: 1,
    icon: 'fa-users',
    title: '초도 미팅 - 제품 사양 논의',
    company: 'COOLSAY SDN BHD',
    date: '2026/01/20',
  },
  {
    id: 2,
    icon: 'fa-sticky-note',
    title: '결제조건 특이사항',
    company: 'COOLSAY SDN BHD',
    date: '2026/01/25',
  },
  {
    id: 3,
    icon: 'fa-flag',
    title: '포장 규격 변경 요청',
    company: 'COOLSAY SDN BHD',
    date: '2026/02/05',
  },
  {
    id: 4,
    icon: 'fa-comment',
    title: 'PI 송부 완료',
    company: 'COOLSAY SDN BHD',
    date: '2026/02/01',
  },
  {
    id: 5,
    icon: 'fa-users',
    title: 'Hannover Messe 미팅',
    company: 'TechBridge GmbH',
    date: '2026/02/10',
  },
]

onMounted(async () => {
  try {
    await fetchDashboardKpis()
  } catch (error) {
    console.error('Failed to fetch dashboard kpi data:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 xl:grid-cols-3">
      <button
        v-for="card in summaryCards"
        :key="card.id"
        type="button"
        class="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
          <i
            class="fas text-sm text-slate-500"
            :class="card.id === 'pi' ? 'fa-file-invoice' : card.id === 'po' ? 'fa-file-contract' : 'fa-file-pdf'"
          />
        </div>
        <div>
          <div class="text-lg font-bold text-slate-800">{{ card.count }}</div>
          <div class="text-xs text-slate-500">{{ card.title }}</div>
        </div>
        <i class="fas fa-chevron-right ml-auto text-xs text-slate-300" />
      </button>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 class="flex items-center gap-2 font-bold text-slate-800">
          <i class="fas fa-stamp text-brand-500" />
          결재란
        </h3>
        <span class="text-xs font-medium text-slate-400">{{ requestItems.length }}건</span>
      </div>
      <div class="divide-y divide-slate-100">
        <div
          v-for="item in requestItems"
          :key="item.id"
          class="flex items-center justify-between px-5 py-3.5 transition hover:bg-slate-50/50"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg"
              :class="item.actionLabel === '삭제' ? 'bg-red-50' : 'bg-blue-50'"
            >
              <i
                class="fas text-xs"
                :class="item.actionLabel === '삭제' ? 'fa-trash text-red-400' : 'fa-edit text-blue-400'"
              />
            </div>
            <div>
              <div class="text-sm font-medium text-slate-800">
                {{ item.docType }} {{ item.docId }} — {{ item.actionLabel }} 결재
              </div>
              <div class="text-xs text-slate-400">
                {{ item.company }} · 요청: {{ item.requester }} → 결재: {{ item.approver }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
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
      </div>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-bold text-slate-800">최근 활동</h3>
        <button type="button" class="text-xs font-medium text-brand-500 hover:text-brand-700">
          전체보기 <i class="fas fa-chevron-right ml-0.5 text-[9px]" />
        </button>
      </div>
      <div class="space-y-3">
        <div
          v-for="item in recentActivities"
          :key="item.id"
          class="group flex cursor-pointer items-start gap-3 text-sm"
        >
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500">
            <i class="fas" :class="item.icon" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium text-slate-800 transition group-hover:text-brand-600">{{ item.title }}</div>
            <div class="text-xs text-slate-400">{{ item.company }} · {{ item.date }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
