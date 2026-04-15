/**
 * 백엔드 PagedModel(HATEOAS) 응답 파서.
 *
 * 지원 shape:
 *   {
 *     _embedded: { <xxxList>: [...] },
 *     _links: {...},
 *     page: { size, number, totalElements, totalPages }
 *   }
 *
 * 추가로 레거시 `{ content: [...] }` (Spring PageImpl 직렬화) 와
 * 순수 배열 응답도 허용한다 (server/backend 가 size=1000 default 로 과거 호환을 유지하는 동안
 * 호출자 코드가 깨지지 않도록).
 *
 * `_embedded` 안의 키 이름은 spring-hateoas 가 Response record 클래스명에서 자동 생성한다
 * (예: ProformaInvoiceResponse → proformaInvoiceResponseList). key hint 없이도 안전하게
 * 동작하도록 첫 번째 배열 value 를 fallback 으로 선택한다.
 */
export function extractEmbedded(data, hintKey) {
  if (Array.isArray(data)) return data
  const embedded = data?._embedded
  if (embedded) {
    if (hintKey && Array.isArray(embedded[hintKey])) return embedded[hintKey]
    const first = Object.values(embedded).find((v) => Array.isArray(v))
    if (first) return first
  }
  if (Array.isArray(data?.content)) return data.content
  return []
}

/**
 * 페이지 메타데이터 추출. 백엔드가 page 메타데이터를 주지 않거나 배열만 주는 경우
 * content 길이 기반으로 싱글 페이지 메타를 합성한다.
 */
export function extractPageInfo(data, { page = 0, size = 20 } = {}) {
  if (data?.page && typeof data.page === 'object') {
    return {
      size: data.page.size ?? size,
      number: data.page.number ?? page,
      totalElements: data.page.totalElements ?? 0,
      totalPages: data.page.totalPages ?? 0,
    }
  }
  // 레거시 PageImpl 또는 배열 응답 → 메타 없음
  const content = Array.isArray(data) ? data : (data?.content ?? [])
  const total = Array.isArray(content) ? content.length : 0
  return {
    size: size || total || 0,
    number: page,
    totalElements: total,
    totalPages: total > 0 && size > 0 ? Math.max(1, Math.ceil(total / size)) : (total > 0 ? 1 : 0),
  }
}

/**
 * `{ content, page }` 형태로 unwrap.
 */
export function unwrapPaged(data, { page = 0, size = 20, hintKey } = {}) {
  return {
    content: extractEmbedded(data, hintKey),
    page: extractPageInfo(data, { page, size }),
  }
}
