/**
 * DB enum 코드 → 화면 한글 라벨 매핑
 * 백엔드에서 영문 코드 그대로 내려오고, 프론트에서만 한글 변환
 */

export const ROLE_LABEL = {
  admin: '관리자',
  sales: '영업',
  production: '생산',
  shipping: '출하',
}

export const USER_STATUS_LABEL = {
  active: '재직',
  on_leave: '휴직',
  retired: '퇴직',
}

export const CLIENT_STATUS_LABEL = {
  active: '활성',
  inactive: '비활성',
}

export const ITEM_STATUS_LABEL = {
  active: '활성',
  inactive: '비활성',
}

export const ACTIVITY_TYPE_LABEL = {
  meeting: '미팅/협의',
  issue: '이슈',
  memo: '메모/노트',
  schedule: '일정',
}

export const ACTIVITY_PRIORITY_LABEL = {
  high: '높음',
  normal: '보통',
}

export const PI_PO_STATUS_LABEL = {
  draft: '초안',
  confirmed: '확정',
  pending_approval: '결재대기',
  rejected: '반려',
  cancelled: '취소',
  registration_requested: '등록요청',
  modification_requested: '수정요청',
  deletion_requested: '삭제요청',
}

export const CI_PL_STATUS_LABEL = {
  pending: '발행대기',
  completed: '발행완료',
}

export const PRODUCTION_STATUS_LABEL = {
  in_progress: '진행중',
  completed: '생산완료',
}

export const SHIPMENT_STATUS_LABEL = {
  preparing: '출하준비',
  completed: '출하완료',
}

export const APPROVAL_STATUS_LABEL = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
}

export const COLLECTION_STATUS_LABEL = {
  unpaid: '미수금',
  paid: '수금완료',
}

export const EMAIL_STATUS_LABEL = {
  sent: '발송',
  failed: '실패',
}

/** 범용 라벨 변환 헬퍼 — 매핑에 없으면 코드 그대로 반환 */
export function label(map, code) {
  return map[code] ?? code
}
