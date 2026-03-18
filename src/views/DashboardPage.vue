<script setup>
import { onMounted, ref } from 'vue'
import { fetchDashboardKpis } from '@/api/dashboard'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const kpiCards = ref([])
const isLoading = ref(true)

const requestItems = [
  {
    id: 1,
    title: 'PO26002 수정 결재 요청',
    company: 'COOLSAY SDN BHD',
    requestedAt: '2026/03/15',
    status: '대기',
  },
  {
    id: 2,
    title: 'PO26004 삭제 결재 요청',
    company: 'TechBridge GmbH',
    requestedAt: '2026/03/14',
    status: '진행중',
  },
  {
    id: 3,
    title: 'CI26001 발행 승인 요청',
    company: 'Sakura Electronics',
    requestedAt: '2026/03/13',
    status: '완료',
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

onMounted(async () => {
  try {
    kpiCards.value = await fetchDashboardKpis()
  } catch (error) {
    console.error('Failed to fetch dashboard kpi data:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <BaseCard
        v-for="card in kpiCards"
        :key="card.id ?? card.title"
        :title="card.title"
      >
        <div class="flex items-end justify-between gap-4">
          <p class="text-3xl font-bold text-slate-900">{{ card.value }}</p>
          <span class="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {{ card.change }}
          </span>
        </div>
      </BaseCard>

      <BaseCard
        v-if="!isLoading && kpiCards.length === 0"
        title="요약 카드"
        subtitle="표시할 현황 데이터가 없습니다."
      >
        <p class="text-sm text-slate-400">대시보드 KPI 데이터가 준비되지 않았습니다.</p>
      </BaseCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <BaseCard title="결재 / 요청 목록" subtitle="문서 처리 흐름에서 먼저 확인해야 할 항목">
        <div class="space-y-3">
          <div
            v-for="item in requestItems"
            :key="item.id"
            class="flex items-start justify-between gap-4 rounded-lg border border-slate-200 px-4 py-4"
          >
            <div class="min-w-0 space-y-1">
              <p class="truncate text-sm font-semibold text-slate-800">{{ item.title }}</p>
              <p class="text-sm text-slate-500">{{ item.company }}</p>
              <p class="text-xs text-slate-400">요청일 {{ item.requestedAt }}</p>
            </div>
            <StatusBadge :value="item.status" />
          </div>
        </div>
      </BaseCard>

      <BaseCard title="화면 액션" subtitle="대시보드 내 섹션별 이동 버튼 영역">
        <div class="space-y-3">
          <BaseButton block variant="secondary">전체보기</BaseButton>
          <BaseButton block>문서 현황 보기</BaseButton>
          <BaseButton block variant="ghost">출하 현황 보기</BaseButton>
        </div>
      </BaseCard>
    </section>

    <BaseCard title="출하 현황" subtitle="출하 진행 건을 한 눈에 확인하는 리스트 영역">
      <div class="space-y-3">
        <div
          v-for="item in shipmentItems"
          :key="item.id"
          class="grid gap-3 rounded-lg border border-slate-200 px-4 py-4 md:grid-cols-[1.1fr_1fr_auto]"
        >
          <div class="space-y-1">
            <p class="text-sm font-semibold text-slate-800">{{ item.shipmentNo }}</p>
            <p class="text-sm text-slate-500">{{ item.company }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-sm text-slate-600">원천 PO {{ item.sourcePo }}</p>
            <p class="text-xs text-slate-400">납기일 {{ item.dueDate }}</p>
          </div>
          <div class="flex items-center md:justify-end">
            <StatusBadge :value="item.status" />
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
