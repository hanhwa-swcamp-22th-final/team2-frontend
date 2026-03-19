import { api } from '@/lib/api'

export async function fetchBuyers() {
  const { data } = await api.get('/buyers')
  return data
}

export async function createBuyer(buyer) {
  const { data } = await api.post('/buyers', buyer)
  return data
}

export async function updateBuyer(id, buyer) {
  const { data } = await api.put(`/buyers/${id}`, buyer)
  return data
}

export async function deleteBuyer(id) {
  await api.delete(`/buyers/${id}`)
}
