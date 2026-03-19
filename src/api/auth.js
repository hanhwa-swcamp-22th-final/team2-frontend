import { api } from '@/lib/api'

export async function login(email, pw) {
  // TODO: [SECURITY] GET 요청으로 비밀번호를 쿼리 파라미터에 포함하면 URL이 서버 로그,
  // 브라우저 히스토리, 프록시 등에 평문으로 노출됩니다.
  // 백엔드 연동 시 반드시 POST /auth/login { email, password } 방식으로 교체해야 합니다.
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

export async function fetchUserById(id) {
  const { data } = await api.get(`/users/${id}`)
  return data
}

export async function deleteUser(id) {
  return api.delete(`/users/${id}`)
}
