<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip } from 'chart.js'
import { fetchDashboardData } from '@/api/dashboard'
import BaseCard from '@/components/common/BaseCard.vue'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip)

const chartRef = ref(null)
const chartInstance = ref(null)
const kpiCards = ref([])
const tableRows = ref([])
const isLoading = ref(true)

function renderChart(chartPoints) {
  if (!chartRef.value) {
    return
  }

  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  chartInstance.value = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels: ['월', '화', '수', '목', '금', '토', '일'],
      datasets: [
        {
          data: chartPoints,
          borderColor: '#0F766E',
          backgroundColor: 'rgba(15, 118, 110, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: { border: { display: false } },
      },
    },
  })
}

onMounted(async () => {
  try {
    const dashboardData = await fetchDashboardData()
    kpiCards.value = dashboardData.kpiCards
    tableRows.value = dashboardData.tableRows
    renderChart(dashboardData.chartPoints)
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <BaseCard
        v-for="card in kpiCards"
        :key="card.title"
        :title="card.title"
      >
        <div class="flex items-end justify-between">
          <p class="text-4xl font-semibold text-ink">{{ card.value }}</p>
          <span class="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">{{ card.change }}</span>
        </div>
      </BaseCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <BaseCard title="화면 진행 추이" subtitle="서비스별 주요 화면 수와 검토 속도">
        <div class="h-72">
          <canvas ref="chartRef" />
        </div>
      </BaseCard>

      <BaseCard title="이번 주 기준" subtitle="공통 설계 원칙">
        <ul class="space-y-3 text-sm text-slate-600">
          <li>목록, 상세, 등록/수정 화면의 그리드 폭을 공통화</li>
          <li>상태 배지와 버튼 우선순위는 전 서비스 동일 규칙 사용</li>
          <li>백엔드 없이도 검토 가능한 더미 데이터와 라우트 유지</li>
        </ul>
      </BaseCard>
    </section>

    <BaseCard title="우선 설계 화면" subtitle="이번 주 우선순위가 높은 화면 예시">
      <div class="overflow-hidden rounded-2xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-slate-500">
            <tr>
              <th class="px-4 py-3">화면</th>
              <th class="px-4 py-3">서비스</th>
              <th class="px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="isLoading">
              <td colspan="3" class="px-4 py-6 text-center text-slate-400">데이터를 불러오는 중입니다.</td>
            </tr>
            <tr v-else-if="tableRows.length === 0">
              <td colspan="3" class="px-4 py-6 text-center text-slate-400">표시할 데이터가 없습니다.</td>
            </tr>
            <tr v-for="row in tableRows" :key="row.name">
              <td class="px-4 py-3 font-medium text-ink">{{ row.name }}</td>
              <td class="px-4 py-3">{{ row.owner }}</td>
              <td class="px-4 py-3">{{ row.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>
