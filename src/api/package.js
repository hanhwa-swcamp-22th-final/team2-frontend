import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

function unwrapEntity(data) {
  if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
    return data.content
  }
  return data
}

function normalizeIdList(value, idKey) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (item && typeof item === 'object' ? item[idKey] ?? item.id : item))
    .filter((item) => item != null)
}

function normalizePackage(pkg) {
  const source = unwrapEntity(pkg)
  if (!source) return source
  return {
    ...source,
    id: source.id ?? source.packageId,
    title: source.title ?? source.packageTitle,
    activityIds: source.activityIds ?? normalizeIdList(source.items, 'activityId'),
    viewerIds: source.viewerIds ?? normalizeIdList(source.viewers, 'userId'),
  }
}

export function fetchPackages() {
  return api
    .get('/activity-packages', { params: { size: 1000, _ts: Date.now() } })
    .then((r) => unwrapCollection(r.data).map(normalizePackage))
}

export function fetchPackageById(id) {
  return api.get(`/activity-packages/${id}`).then((r) => normalizePackage(r.data))
}

export function createPackage(data) {
  return api.post('/activity-packages', data).then((r) => normalizePackage(r.data))
}

export function updatePackage(id, data) {
  return api.put(`/activity-packages/${id}`, data).then((r) => normalizePackage(r.data))
}

export function deletePackage(id) {
  return api.delete(`/activity-packages/${id}`)
}

export function downloadPackageReport(id) {
  return api.get(`/activity-packages/${id}/report`, { responseType: 'blob' }).then((r) => r.data)
}

export async function fetchAllUsers() {
  // 뷰어 선택용 최소 정보 엔드포인트. ADMIN 외 사용자도 조회 가능.
  // /users/viewable 미배포 구간에서는 /users 로 2단 fallback.
  const normalize = (data) => (Array.isArray(data) ? data : unwrapCollection(data))
  try {
    const r = await api.get('/users/viewable')
    return normalize(r.data)
  } catch (e) {
    const status = e?.response?.status
    if ([401, 403, 404].includes(status)) {
      try {
        const r2 = await api.get('/users', { params: { size: 1000 } })
        return normalize(r2.data)
      } catch (e2) {
        const status2 = e2?.response?.status
        // /users 도 ADMIN 전용이라 영업 계정은 403 받음. 빈 배열로 degrade.
        if ([401, 403, 404].includes(status2)) return []
        throw e2
      }
    }
    throw e
  }
}
