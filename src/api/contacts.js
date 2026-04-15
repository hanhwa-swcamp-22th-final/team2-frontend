import { api } from '@/lib/api'
import { unwrapCollection } from '@/utils/apiResponse'

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

/**
 * activity 백엔드 `/api/contacts` — 작성자(writerId) 기준 본인 컨택 (admin 은 전체).
 * 같은 팀이 buyer 등록 시 sync 가 각 팀원에게 별도 row 를 만들어주므로 자동으로 보임.
 * 응답: PagedModel HATEOAS — `{ _embedded: { contactResponseList: [...] }, page: {...} }`
 */
export async function fetchContacts({ size = 200 } = {}) {
  const { data } = await api.get('/contacts', { params: { size } })
  return unwrapCollection(data)
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

/**
 * 자유 컨택 등록 (activity). payload 의 clientId 는 optional.
 * { clientId?, contactName, contactPosition?, contactEmail?, contactTel? }
 */
export async function createContact(payload) {
  const { data } = await api.post('/contacts', payload)
  return data
}

export async function updateContact(id, payload) {
  const { data } = await api.put(`/contacts/${id}`, payload)
  return data
}

export async function deleteContact(id) {
  await api.delete(`/contacts/${id}`)
}
