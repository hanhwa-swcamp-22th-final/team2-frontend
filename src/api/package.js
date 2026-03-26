import { api } from '@/lib/api'

export function fetchPackages() {
  return api.get('/activityPackages').then((r) => r.data)
}

export function fetchPackageById(id) {
  return api.get(`/activityPackages/${id}`).then((r) => r.data)
}

export function createPackage(data) {
  return api.post('/activityPackages', data).then((r) => r.data)
}

export function updatePackage(id, data) {
  return api.put(`/activityPackages/${id}`, data).then((r) => r.data)
}

export function deletePackage(id) {
  return api.delete(`/activityPackages/${id}`)
}

export function fetchAllUsers() {
  return api.get('/users').then((r) => r.data)
}
