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

export function fetchAllUsers() {
  // 뷰어 선택용 최소 정보 엔드포인트. ADMIN 외 사용자도 조회 가능.
  return api.get('/users/viewable').then((r) => {
    const data = r.data
    if (Array.isArray(data)) return data
    return unwrapCollection(data)
  })
}
