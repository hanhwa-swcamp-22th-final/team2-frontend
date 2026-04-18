// PI/PO 문서 수정·삭제 권한 판정 유틸.
// 서버가 이미 팀 스코프 필터를 강제하므로 목록에 나오는 행은 모두 같은 팀.
// 따라서 여기서는 "같은 팀" 조건을 별도 검사하지 않고 (admin || 본인 || 팀장) 만 본다.
//
// rules:
//  - admin: 전체 가능
//  - positionLevel === 1 (팀장): 목록의 모든 행 가능
//  - 그 외: row.managerId 가 본인일 때만
export function canMutateDocument(row, user) {
  if (!row || !user) return false
  if (user.role === 'admin') return true
  const uid = user.userId ?? user.id ?? null
  const mid = row.managerId ?? null
  if (uid != null && mid != null && String(uid) === String(mid)) return true
  if (user.positionLevel === 1) return true
  return false
}
