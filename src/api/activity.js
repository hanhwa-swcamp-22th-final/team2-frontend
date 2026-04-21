import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

function unwrapEntity(data) {
  if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
    return data.content
  }
  return data
}

function normalizeActivity(row) {
  const activity = unwrapEntity(row)
  if (!activity) return activity
  return {
    ...activity,
    id: activity.id ?? activity.activityId,
    type: activity.type ?? activity.activityType,
    title: activity.title ?? activity.activityTitle,
    date: activity.date ?? activity.activityDate,
    author: activity.author ?? activity.authorName,
    content: activity.content ?? activity.activityContent,
    priority: activity.priority ?? activity.activityPriority,
    scheduleFrom: activity.scheduleFrom ?? activity.activityScheduleFrom,
    scheduleTo: activity.scheduleTo ?? activity.activityScheduleTo,
  }
}

// ── 거래처 ─────────────────────────────────────────────────
// master 의 /api/clients/all 은 HATEOAS PagedModel 로 응답한다. unwrapCollection 으로
// 배열만 꺼내야 호출자(활동기록 드롭다운 등)의 .map 이 정상 동작.
export async function fetchActivityClients() {
  const { data } = await api.get('/clients/all', { params: { size: 1000 } })
  return unwrapCollection(data)
}

// ── 활동기록 ───────────────────────────────────────────────
export async function fetchActivities(params = {}) {
  const { data } = await api.get('/activities', {
    params: { size: 1000, _ts: Date.now(), ...params },
  })
  return unwrapCollection(data).map(normalizeActivity)
}

export async function fetchActivity(id) {
  const { data } = await api.get(`/activities/${id}`)
  return normalizeActivity(data)
}

export async function createActivity(activity) {
  const { data } = await api.post('/activities', activity)
  return normalizeActivity(data)
}

export async function updateActivity(id, activity) {
  const { data } = await api.put(`/activities/${id}`, activity)
  return normalizeActivity(data)
}

export async function deleteActivity(id) {
  await api.delete(`/activities/${id}`)
}

// ── PO 검색 ────────────────────────────────────────────────
// documents 의 /api/purchase-orders 는 clientId 쿼리 파라미터를 지원하지 않는다.
// 전체 목록을 가져와 클라이언트 사이드에서 필터. 활동기록은 소량 PO 대상이라 허용.
export async function fetchPOsByClient(clientId) {
  const pos = await fetchAllActivityPOs()
  const target = Number(clientId)
  if (!Number.isFinite(target)) return pos
  return (pos ?? []).filter((po) => Number(po.clientId) === target)
}

export async function fetchAllActivityPOs() {
  const { data } = await api.get('/purchase-orders', { params: { size: 1000 } })
  return unwrapCollection(data)
}
