import { api } from '@/lib/api'

// ── 거래처 ─────────────────────────────────────────────────
export async function fetchActivityClients() {
  const { data } = await api.get('/activityClients')
  return data
}

// ── 활동기록 ───────────────────────────────────────────────
export async function fetchActivities() {
  const { data } = await api.get('/activities')
  return data
}

export async function createActivity(activity) {
  const { data } = await api.post('/activities', activity)
  return data
}

export async function updateActivity(id, activity) {
  const { data } = await api.put(`/activities/${id}`, activity)
  return data
}

export async function deleteActivity(id) {
  await api.delete(`/activities/${id}`)
}

// ── PO 검색 ────────────────────────────────────────────────
export async function fetchPOsByClient(clientId, userId) {
  const params = { clientId }
  if (userId != null) params.userId = userId
  const { data } = await api.get('/activityPOs', { params })
  return data
}

export async function fetchAllActivityPOs() {
  const { data } = await api.get('/activityPOs')
  return data
}
