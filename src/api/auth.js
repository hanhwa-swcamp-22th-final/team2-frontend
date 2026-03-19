import { api } from '@/lib/api'

export async function login(email, pw) {
  // TODO: [SECURITY] 백엔드 연동 시 POST /auth/login { email, password } 방식으로 교체
  // json-server v1 beta는 복수 쿼리 파라미터 필터링을 지원하지 않아 email로만 조회 후 pw 비교
  const { data } = await api.get('/users', { params: { email } })
  const user = data[0]
  if (!user || user.pw !== pw) return null
  return user
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

export async function fetchUserById(id) {
  const { data } = await api.get(`/users/${id}`)
  return data
}

export async function deleteUser(id) {
  return api.delete(`/users/${id}`)
}
