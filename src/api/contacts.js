import { api } from '@/lib/api'

/**
 * master 백엔드 `/buyers` 는 HATEOAS CollectionModel 형식
 * (`{ _embedded: { buyerResponseList: [...] }, _links: {...} }`) 으로 응답한다.
 * 빈 리스트의 경우 `_embedded` 키가 없으므로 빈 배열 fallback 을 둔다.
 */
export async function fetchBuyers() {
  const { data } = await api.get('/buyers')
  if (Array.isArray(data)) return data
  return data?._embedded?.buyerResponseList ?? []
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
