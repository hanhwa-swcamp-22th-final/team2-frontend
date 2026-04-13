import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

export async function fetchDashboardKpis() {
  try {
    const { data } = await api.get('/purchase-orders', { params: { page: 0, size: 1 } })
    const totalOrders = data?.page?.totalElements ?? data?.totalElements ?? 0
    return [
      { title: '총 발주건수', value: totalOrders, unit: '건' },
    ]
  } catch {
    return []
  }
}

export async function fetchDashboardChartPoints() {
  return []
}

export async function fetchDashboardTableRows() {
  try {
    const { data } = await api.get('/purchase-orders', { params: { page: 0, size: 5 } })
    return unwrapCollection(data)
  } catch {
    return []
  }
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
