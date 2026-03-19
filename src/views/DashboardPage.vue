<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import BaseCard from '@/components/common/BaseCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const summaryCards = ref([
  {
    id: 'pi',
    title: 'PI 문서',
    count: '3',
    status: '확정',
    helper: '최근 발행 2026/03/10',
    to: '/pi',
  },
  {
    id: 'po',
    title: 'PO 문서',
    count: '3',
    status: '발송',
    helper: '최근 발행 2026/03/03',
    to: '/po',
  },
  {
    id: 'cipl',
    title: 'CI/PL 문서',
    count: '1',
    status: '준비완료',
    helper: '최근 발행 2026/03/12',
    to: '/ci',
  },
])

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
</script>

<template>
  <div class="fade-in space-y-6">
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              :class="card.id === 'pi' ? 'fa-file-invoice' : card.id === 'po' ? 'fa-file-contract' : 'fa-file-pdf'"
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

    <BaseCard body-class="-mx-5 -mb-5 max-h-[400px] divide-y divide-slate-100 overflow-y-auto">
      <template #title>
        <h3 class="flex items-center gap-2 font-bold text-slate-800">
          <i class="fas fa-stamp text-brand-500" />
          결재란
        </h3>
      </template>
      <template #header-actions>
        <span class="text-xs font-medium text-slate-400">{{ requestItems.length }}건</span>
      </template>
      <div
        v-for="item in requestItems"
        :key="item.id"
        class="flex cursor-pointer flex-col items-start gap-3 px-5 py-3.5 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
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
              {{ item.docType }} {{ item.docId }} — {{ item.actionLabel }} 결재
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
  </div>
</template>
