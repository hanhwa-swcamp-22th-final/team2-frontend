import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function refreshToken() {
  // body 없음 — HttpOnly 쿠키(sb_refresh_token)가 withCredentials로 자동 전송됨
  const { data } = await api.post('/auth/refresh')
  return data
}

export async function logoutApi(userId) {
  await api.post('/auth/logout', { userId })
}

export async function fetchUsers() {
  const { data } = await api.get('/users', { params: { size: 1000 } })
  const result = unwrapCollection(data)
  if (!result.length) {
    console.warn('[fetchUsers] 0건 반환. raw response:', JSON.stringify(data).slice(0, 500))
  }
  return result
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
  return unwrapCollection(data)
}

export async function fetchDepartments() {
  const { data } = await api.get('/departments')
  return unwrapCollection(data)
}

export async function createDepartment(department) {
  const { data } = await api.post('/departments', department)
  return data
}

export async function updateDepartment(id, department) {
  const { data } = await api.put(`/departments/${id}`, department)
  return data
}

export async function deleteDepartment(id) {
  await api.delete(`/departments/${id}`)
}

export async function fetchTeams(departmentId = null) {
  const params = departmentId != null ? { departmentId } : {}
  const { data } = await api.get('/teams', { params })
  return Array.isArray(data) ? data : unwrapCollection(data)
}

export async function createTeam(team) {
  const { data } = await api.post('/teams', team)
  return data
}

export async function updateTeam(id, team) {
  const { data } = await api.put(`/teams/${id}`, team)
  return data
}

export async function deleteTeam(id) {
  await api.delete(`/teams/${id}`)
}

export async function fetchCompany() {
  const { data } = await api.get('/company')
  return data
}

export async function updateCompany(company) {
  const { data } = await api.put('/company', company)
  return data
}

export async function changePassword(userId, currentPw, newPw) {
  const { data } = await api.put(`/users/${userId}/password`, { currentPw, newPw })
  return data
}

export async function fetchUserById(id) {
  const { data } = await api.get(`/users/${id}`)
  return data
}

export async function resetPassword(userId) {
  const { data } = await api.post(`/users/${userId}/password/reset`)
  return data
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function changeUserStatus(id, status) {
  const { data } = await api.patch(`/users/${id}/status`, { status })
  return data
}

export async function fetchAllUsers() {
  const { data } = await api.get('/users', { params: { size: 1000 } })
  return unwrapCollection(data)
}
