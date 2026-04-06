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
  return api.get('/users').then((r) => r.data)
}
