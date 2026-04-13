/**
 * HATEOAS 응답(CollectionModel / PagedModel) 및 레거시 PagedResponse 에서
 * 배열 데이터를 안전하게 추출하는 유틸리티.
 *
 * 지원 형식:
 *  1. 이미 배열                     → 그대로 반환
 *  2. { _embedded: { xxxList: [] } } → 첫 번째 배열 반환 (key 힌트가 있으면 우선 사용)
 *  3. { content: [] }               → content 배열 반환 (레거시 PagedResponse)
 *  4. 그 외                         → 빈 배열
 */
export function unwrapCollection(data, key) {
  if (Array.isArray(data)) return data

  if (data?._embedded) {
    if (key && data._embedded[key]) return data._embedded[key]
    const first = Object.values(data._embedded)[0]
    if (Array.isArray(first)) return first
  }

  if (Array.isArray(data?.content)) return data.content

  return []
}
