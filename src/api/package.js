import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

export function fetchPackages() {
  return api.get('/activity-packages').then((r) => unwrapCollection(r.data))
}

export function fetchPackageById(id) {
  return api.get(`/activity-packages/${id}`).then((r) => r.data)
}

export function createPackage(data) {
  return api.post('/activity-packages', data).then((r) => r.data)
}

export function updatePackage(id, data) {
  return api.put(`/activity-packages/${id}`, data).then((r) => r.data)
}

export function deletePackage(id) {
  return api.delete(`/activity-packages/${id}`)
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
