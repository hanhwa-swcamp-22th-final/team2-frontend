import { api } from '@/lib/api'

export async function login(email, pw) {
  const { data } = await api.get('/users', { params: { email, pw } })
  return data[0] ?? null
}

export async function fetchUsers() {
  const { data } = await api.get('/users')
  return data
}

export async function createUser(user) {
  const { data } = await api.post('/users', user)
  return data
}

export async function updateUser(id, user) {
  const { data } = await api.put(`/users/${id}`, user)
  return data
}

export async function fetchPositions() {
  const { data } = await api.get('/positions')
  return data
}

export async function fetchDepartments() {
  const { data } = await api.get('/departments')
  return data
}

export async function fetchCompany() {
  const { data } = await api.get('/company/1')
  return data
}

export async function updateCompany(company) {
  const { data } = await api.put('/company/1', company)
  return data
}

export async function changePassword(userId, pw) {
  const { data } = await api.patch(`/users/${userId}`, { pw })
  return data
}
