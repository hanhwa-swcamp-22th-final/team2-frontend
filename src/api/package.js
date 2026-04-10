import { api } from '@/lib/api'

export function fetchPackages() {
  return api.get('/activity-packages').then((r) => r.data)
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
  // /api/users 는 PagedResponse { content: [...], totalElements, ... } 반환.
  // 전체 목록이 필요하므로 size=1000 으로 단일 페이지 조회.
  return api.get('/users', { params: { size: 1000 } }).then((r) => r.data?.content ?? r.data ?? [])
}
