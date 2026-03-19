# Dashboard UI Guide

## 1. 문서 목적

이 문서는 메인 대시보드 화면에서 지금까지 진행한 UI 정리와 화면 이동 연결 작업을
코드 기준으로 설명하기 위해 작성했습니다.

이 문서에서 정리하는 내용은 아래와 같습니다.

- 대시보드 화면이 어떤 파일로 구성되어 있는가
- 어떤 부분이 공통 레이아웃 책임이고 어떤 부분이 대시보드 페이지 책임인가
- 왜 이런 방식으로 수정했는가
- 현재 어떤 액션이 연결되어 있고, 무엇이 아직 남아 있는가
- 코드리뷰 시 어떤 포인트를 보면 되는가

---

## 2. 관련 파일 구조

### 2.1 메인 대시보드 화면

```text
src/views/
  DashboardPage.vue
```

### 2.2 공통 레이아웃

```text
src/components/layout/
  AppHeader.vue
  AppSidebar.vue

src/layouts/
  AppLayout.vue

src/stores/
  ui.js
```

### 2.3 대시보드에서 직접 사용하는 공통 컴포넌트

```text
src/components/common/
  BaseCard.vue
  StatusBadge.vue
```

---

## 3. 이번 작업을 코드로 보면 무엇을 한 것인가

메인 대시보드 작업은 크게 두 단계였습니다.

1. **UI 구조와 정합성 정리**
2. **남아 있던 액션을 실제 화면 이동으로 연결**

즉, 단순히 카드와 리스트를 배치한 것이 아니라
레이아웃과 상호작용을 같이 정리한 작업입니다.

---

## 4. 파일별 책임

### 4.1 DashboardPage.vue

파일:

- [DashboardPage.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/views/DashboardPage.vue)

역할:

- 대시보드 본문 렌더링
- 문서 카드 3종 렌더링
- 결재란 렌더링
- 최근 활동 렌더링
- 출하 현황 렌더링
- 각 리스트 항목 클릭 시 이동 처리

현재 화면 구성:

- 상단 문서 카드 3종
  - `PI 문서`
  - `PO 문서`
  - `CI/PL 문서`
- 결재란
- 최근 활동
- 출하 현황

### 4.2 AppHeader.vue

파일:

- [AppHeader.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/layout/AppHeader.vue)

역할:

- 현재 페이지 제목 표시
- 사이드바 토글 버튼
- 알림 드롭다운
- 비밀번호 변경 모달 연결
- 우측 사용자 액션 영역 렌더링

이번에 정리한 핵심:

- 긴 제목이 작은 화면에서 튀어나오지 않도록 `min-w-0`, `truncate` 적용
- 알림 드롭다운 폭을 화면 너비 안에서만 열리도록 제한
- 알림 항목 클릭 시 관련 화면 이동 연결
- 바깥 클릭 시 드롭다운 닫힘 유지

### 4.3 AppSidebar.vue

파일:

- [AppSidebar.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/layout/AppSidebar.vue)

역할:

- 좌측 메뉴 렌더링
- 현재 메뉴 active 처리
- 접기/펼치기 핸들 제공
- 로고 클릭 시 메인 이동

이번에 정리한 핵심:

- 데스크톱에서도 사이드바 접기/펼치기 가능
- 접힌 상태에서도 일부가 보이도록 유지
- 사용자가 접힌 상태를 인지할 수 있게 우측 핸들 추가

### 4.4 AppLayout.vue

파일:

- [AppLayout.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/layouts/AppLayout.vue)

역할:

- 헤더, 사이드바, 본문을 하나의 공통 레이아웃으로 조합
- 사이드바 열림/닫힘 상태에 따라 본문 margin 처리
- 모바일 오버레이 처리

이번에 정리한 핵심:

- 사이드바가 접힌 상태일 때 작은 화면에서도 본문 시작선이 너무 붙지 않도록 `ml-[44px]` 유지
- 모바일에서 사이드바 외부 클릭 시 닫힘

### 4.5 ui.js

파일:

- [ui.js](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/stores/ui.js)

역할:

- `sidebarOpen` 상태 관리
- 열기/닫기/토글 함수 제공

초기값:

- 브라우저 폭이 `1024px` 이상이면 기본 열림
- 그보다 작으면 기본 닫힘

---

## 5. 화면 이동 연결 상태

### 5.1 이미 연결된 항목

#### 문서 카드 3종

- `PI 문서` → `/pi`
- `PO 문서` → `/po`
- `CI/PL 문서` → `/ci`

#### 전체보기

- `최근 활동` → `/activities`
- `출하 현황` → `/shipments`

#### 결재란 항목

- 항목 클릭 시 관련 문서 화면 이동
- `PO` 항목은 `/po`
- `PI` 항목은 `/pi`

#### 최근 활동 항목

- 항목 클릭 시 `/activities` 이동

#### 출하 현황 항목

- 항목 클릭 시 `/shipments` 이동

#### 헤더 알림 항목

- 결재 요청 → `/po`
- 출하 상태 변경 → `/shipments`
- 완납 처리 → `/collections`

### 5.2 아직 하지 않은 것

현재 단계에서 연결하지 않은 것은 아래입니다.

- 알림 읽음 처리
- 실제 API 기반 데이터 조회
- 로그아웃 토큰 처리
- 상세 화면에서 query 기반 자동 선택/강조 처리

즉, 현재는 **화면 이동까지 연결된 상태**이고,
실제 데이터 연동은 다음 단계입니다.

---

## 6. 왜 이런 방식으로 구현했는가

### 6.1 대시보드에서 바로 상세로 들어가지 않은 이유

현재 문서/현황 화면은 상세 기능보다 목록/조회 UI 구현이 먼저 진행된 상태입니다.

따라서 대시보드 항목 클릭도 다음처럼 처리했습니다.

- 바로 상세 페이지 이동 X
- 먼저 해당 목록 화면으로 이동 O
- 필요한 식별값은 query로 전달 O

이 방식의 장점:

- 현재 구현 수준과 잘 맞음
- 라우트 구조를 과도하게 만들지 않음
- 나중에 상세 화면이 붙으면 query 해석만 추가하면 됨

### 6.2 헤더 알림을 RouterLink가 아니라 함수로 처리한 이유

알림은 항목마다 이동 경로가 다릅니다.

예:

- 결재 요청 → 문서 화면
- 출하 상태 변경 → 출하현황
- 완납 처리 → 매출·수금 현황

그래서 고정 링크보다
`notification.to + notification.query`를 사용하는 함수형 처리로 두는 편이 유지보수에 유리합니다.

---

## 7. 반응형에서 실제로 해결한 문제

### 7.1 헤더 제목 overflow

증상:

- `매출·수금 현황` 같은 긴 제목이 좁은 화면에서 바깥으로 튀어나감

원인:

- 제목 영역이 flex 안에서 수축 조건 없이 놓여 있었음

해결:

- `min-w-0`
- `flex-1`
- `truncate`

적용 파일:

- [AppHeader.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/layout/AppHeader.vue)

### 7.2 접힌 사이드바와 본문 간격

증상:

- 화면이 줄어든 상태에서 사이드바가 접혀 있어도 본문이 너무 붙어 보임

원인:

- 작은 화면에서는 본문 margin-left가 적용되지 않았음

해결:

- 접힌 상태에서는 화면 크기와 무관하게 `ml-[44px]` 적용

적용 파일:

- [AppLayout.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/layouts/AppLayout.vue)

### 7.3 알림 드롭다운 폭 초과

증상:

- 작은 화면에서 알림 드롭다운이 화면 밖으로 밀릴 수 있음

해결:

- 폭을 `w-[min(20rem,calc(100vw-2rem))]``로 제한

적용 파일:

- [AppHeader.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/layout/AppHeader.vue)

### 7.4 대시보드 카드/리스트 텍스트 넘침

증상:

- 카드 helper 문구, 결재란 설명, 최근 활동 보조 텍스트가 좁은 화면에서 넘침

해결:

- `min-w-0`
- `truncate`
- `flex-shrink-0`

적용 파일:

- [DashboardPage.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/views/DashboardPage.vue)

---

## 8. 코드리뷰 포인트

리뷰할 때는 아래를 보면 됩니다.

### 8.1 DashboardPage.vue

- 클릭 가능한 항목이 실제로 올바른 화면으로 이동하는가
- query 파라미터 이름이 일관적인가
- 카드/리스트 데이터 구조가 이후 API 응답 구조로 바뀌기 쉬운가

### 8.2 AppHeader.vue

- 헤더 제목이 작은 화면에서도 안전하게 잘리는가
- 알림 드롭다운이 화면폭을 넘지 않는가
- 알림 항목 클릭 후 이동과 닫힘 흐름이 자연스러운가

### 8.3 AppSidebar.vue / AppLayout.vue

- 접힌 상태에서 본문 간격이 자연스러운가
- 접기/펼치기 핸들이 과하게 튀지 않는가
- 모바일 오버레이와 데스크톱 접힘 동작이 충돌하지 않는가

---

## 9. 현재 단계와 다음 단계

### 현재 완료 상태

- 메인 대시보드 UI 구조 완료
- 반응형 보정 완료
- 카드/리스트/알림 이동 연결 완료
- 사이드바/헤더 공통 레이아웃 정리 완료

### 다음 단계

- 실제 백엔드 데이터 연결
- 알림 읽음 처리
- query 기반 강조/자동 필터링 연결
- 로그아웃 인증 흐름 구현

즉 현재 메인 대시보드는
**UI와 화면 이동 연결까지 완료된 상태**로 보면 됩니다.
