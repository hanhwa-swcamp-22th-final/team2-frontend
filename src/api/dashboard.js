import { api } from '@/lib/api'

export async function fetchDashboardKpis() {
  const { data } = await api.get('/dashboardKpis')
  return data
}

export async function fetchDashboardChartPoints() {
  const { data } = await api.get('/dashboardChartPoints')
  return data.map((item) => item.value)
}

export async function fetchDashboardTableRows() {
  const { data } = await api.get('/dashboardTableRows')
  return data
}

export async function fetchDashboardData() {
  const [kpiCards, chartPoints, tableRows] = await Promise.all([
    fetchDashboardKpis(),
    fetchDashboardChartPoints(),
    fetchDashboardTableRows(),
  ])

  return {
    kpiCards,
    chartPoints,
    tableRows,
  }
}
