# Frontend Code Convention

## 1. 목적

- 이 문서는 `team2-frontend`의 화면 기능 구현 단계에서 공통 기준을 맞추기 위한 규칙이다.
- 목표는 세 가지다.
  - 서비스별 병렬 개발 시 충돌을 줄인다.
  - 파일 구조와 코드 스타일을 예측 가능하게 만든다.
  - 공통 UI와 도메인 로직의 경계를 명확히 한다.

## 2. 기본 원칙

- 화면은 서비스별로 분리하고, 공통은 최소 범위로만 공유한다.
- 한 파일이 여러 서비스 요구사항을 동시에 품지 않게 한다.
- 공통 컴포넌트는 재사용성이 명확할 때만 만든다.
- 더미 데이터 기반 화면 구현이라도 실제 API 연동을 고려한 타입과 구조를 유지한다.
- 라우터, 스토어, API 모듈은 서비스 단위로 분리한다.

## 3. 디렉터리 규칙

```text
src/
  api/
    auth/
    master/
    order/
  components/
    common/
    form/
    feedback/
  layouts/
  router/
    modules/
  stores/
  styles/
  types/
  utils/
  views/
    auth/
    master/
    order/
```

- `views`: 라우트에 직접 연결되는 페이지 컴포넌트
- `components/common`: 여러 서비스에서 공통으로 쓰는 UI
- `components/form`: 입력, 선택, 검증 관련 공통 컴포넌트
- `api`: 서버 통신 함수 모음
- `stores`: Pinia 전역 상태
- `router/modules`: 서비스별 라우트 정의
- `types`: API 응답, 폼 모델, 공통 타입

## 4. 파일 분리 기준

- 페이지 하나당 파일 하나를 기본으로 한다.
- 리스트, 상세, 등록/수정 화면은 분리한다.
- 모달이 복잡해지면 페이지 파일에서 분리한다.
- 같은 서비스에서만 쓰는 컴포넌트는 해당 서비스 폴더 아래에 둔다.
- 두 서비스 이상에서 반복되는 UI만 `components/common`으로 올린다.

예시:

```text
src/views/order/OrderListPage.vue
src/views/order/OrderDetailPage.vue
src/views/order/OrderCreatePage.vue
src/components/order/OrderStatusBadge.vue
src/components/common/BaseTable.vue
```

## 5. 네이밍 규칙

- 컴포넌트 파일명: `PascalCase`
- 페이지 컴포넌트: `도메인 + 기능 + Page.vue`
- 일반 컴포넌트: `역할명.vue`
- Store 파일: `useXxxStore`를 export 하고 파일명은 `xxx.ts`
- API 파일: `도메인명.ts` 또는 `기능명.ts`
- 타입 파일: `도메인명.ts`
- 상수 파일: `UPPER_SNAKE_CASE` 대신 의미 있는 `camelCase` export 사용

예시:

- `UserListPage.vue`
- `RoleMatrixPage.vue`
- `BaseButton.vue`
- `auth.ts`
- `order.ts`

## 6. Vue 컴포넌트 작성 규칙

- `script setup lang="ts"`를 기본으로 사용한다.
- Props는 `defineProps`로 선언하고 타입을 명시한다.
- Emits는 `defineEmits`로 선언한다.
- 라우트 메타에 의존하는 값은 `computed`로 파생한다.
- 템플릿에서 복잡한 조건식은 직접 쓰지 말고 `computed` 또는 함수로 분리한다.
- 한 컴포넌트가 너무 커지면 표시 영역 단위로 분리한다.

권장 순서:

1. import
2. props / emits
3. route / store / 외부 의존성
4. state
5. computed
6. methods
7. lifecycle

## 7. 상태관리 규칙

- 전역으로 공유되는 상태만 Pinia에 둔다.
- 페이지 내부에서만 쓰는 값은 컴포넌트 내부 `ref`, `reactive`로 관리한다.
- 서비스별 store를 분리한다.
- UI 상태와 비즈니스 상태를 한 store에 섞지 않는다.

예시:

- `ui.ts`: 사이드바, 토스트, 공통 로딩
- `auth.ts`: 로그인 사용자, 권한, 메뉴 접근
- `order.ts`: 주문 검색 조건, 선택된 주문, 목록 캐시

금지:

- 모든 상태를 하나의 store에 몰아넣기
- API 호출과 화면 포맷팅 로직을 구분 없이 섞기

## 8. Router 규칙

- 서비스별 route는 `router/modules` 아래로 분리한다.
- 메인 라우터 파일에서는 모듈만 조합한다.
- `meta`에는 최소한 다음 정보를 둔다.
  - `title`
  - `serviceName`
  - `requiresAuth`
  - `menuKey`

예시:

```ts
meta: {
  title: '사용자 목록',
  serviceName: 'Auth',
  requiresAuth: true,
  menuKey: 'auth.user',
}
```

- 권한 분기는 라우터 가드 또는 메뉴 렌더링 레벨에서 일관되게 처리한다.

## 9. API 규칙

- 모든 API 호출은 `src/api` 아래에서 관리한다.
- 컴포넌트에서 직접 `axios`를 호출하지 않는다.
- 공통 인스턴스는 `src/lib/api.ts`를 사용한다.
- 요청/응답 타입을 명시한다.
- 화면용 데이터 가공은 가능하면 API 함수가 아니라 컴포저블 또는 페이지에서 처리한다.

예시:

```ts
export interface OrderListItem {
  id: number
  orderCode: string
  status: string
}

export async function fetchOrders(params: OrderSearchParams) {
  const { data } = await api.get<OrderListResponse>('/orders', { params })
  return data
}
```

## 10. 타입 규칙

- `any` 사용은 금지한다.
- API 응답 타입, 폼 모델 타입, 테이블 row 타입을 분리한다.
- 동일한 도메인 타입은 한 파일에 모은다.
- 화면에서 임시로 쓰는 타입이라도 이름을 붙여 export 가능한 구조로 만든다.

권장 예시:

- `UserSummary`
- `UserDetail`
- `CreateOrderRequest`
- `OrderStatus`

## 11. 스타일 규칙

- Tailwind utility class를 기본으로 사용한다.
- 반복되는 스타일 패턴은 공통 컴포넌트로 승격한다.
- 색상, 그림자, 폰트는 `tailwind.config.js`의 토큰을 우선 사용한다.
- 인라인 스타일은 차트, 동적 크기 계산 같은 불가피한 경우만 허용한다.
- 한 템플릿에서 class가 지나치게 길어지면 컴포넌트 분리를 우선 검토한다.

## 12. 공통 컴포넌트 규칙

- 공통 컴포넌트는 서비스 문맥 없이도 이해 가능해야 한다.
- 공통 컴포넌트는 도메인 API를 import 하지 않는다.
- 공통 컴포넌트 Props 이름은 최대한 일반화한다.
- 공통 컴포넌트 변경 시 영향 범위를 PR 설명에 반드시 적는다.

좋은 예:

- `BaseButton`
- `BaseInput`
- `BaseTable`
- `StatusBadge`

주의:

- 특정 서비스 요구사항 때문에 억지로 공통 컴포넌트를 복잡하게 만들지 않는다.

## 13. 서비스별 컴포넌트 규칙

- 특정 서비스에서만 사용하는 컴포넌트는 해당 서비스 아래에 둔다.
- 서비스 로직이 포함된 컴포넌트는 `components/common`으로 올리지 않는다.
- 서비스별 배지, 필터, 요약 카드 등은 먼저 도메인 내부에서 닫는다.

## 14. 더미 데이터와 실제 API 전환 규칙

- 화면 설계용 mock 데이터는 `src/data` 또는 서비스별 mock 파일에 둔다.
- mock 데이터 구조는 실제 API 응답 형태와 최대한 비슷하게 유지한다.
- 기능 구현이 시작되면 mock 상수를 직접 템플릿에서 쓰지 말고 API 함수 또는 store를 통해 주입한다.

## 15. import 규칙

- `@` alias를 기본으로 사용한다.
- 상대경로 `../../../` 사용은 지양한다.
- import 순서는 다음 순서를 따른다.
  1. Vue, Vue Router, Pinia
  2. 외부 라이브러리
  3. `@/` 내부 모듈
  4. 타입 import

## 16. 주석 규칙

- 주석은 이유를 설명할 때만 작성한다.
- 코드만 봐도 알 수 있는 설명 주석은 금지한다.
- 임시 처리라면 제거 조건이나 배경을 남긴다.

좋은 예:

- 권한 정책상 서버 응답이 올 때까지 버튼을 숨기지 않고 비활성화만 유지한다.

## 17. Git / 브랜치 규칙

- `main`: 안정 브랜치
- `develop`: 통합 개발 브랜치
- `feature/{service}-{task}`: 기능 개발 브랜치

예시:

- `feature/auth-user-list`
- `feature/order-create-page`
- `feature/common-base-table`

- 공통 컴포넌트 작업은 작은 단위로 자주 merge 한다.
- 한 PR에는 하나의 목적만 담는다.
- 공통 파일 수정이 포함되면 영향 범위를 PR 본문에 적는다.

## 18. 3인 협업 권장 방식

- 1명은 공통 기반 담당
- 2명은 서비스 구현 담당

권장 분배:

1. 공통 담당
   - router 구조
   - pinia 공통 정책
   - axios 인터셉터
   - 공통 컴포넌트
   - 레이아웃
2. 서비스 담당 A
   - Auth, Notification
3. 서비스 담당 B
   - Master, Order, Sales, Document, PDF

- 공통 담당이 없는 상태에서 모두가 공통 파일을 건드리기 시작하면 충돌이 급증한다.
- 서비스 담당자는 원칙적으로 자기 서비스 폴더 안에서 작업한다.

## 19. PR 체크리스트

- 파일 위치가 규칙에 맞는가
- 공통과 서비스 전용 경계가 명확한가
- 타입이 빠지지 않았는가
- 컴포넌트가 과도하게 커지지 않았는가
- 템플릿에 복잡한 로직이 들어가 있지 않은가
- API 호출이 컴포넌트에 직접 박혀 있지 않은가
- mock 구조와 실제 데이터 구조가 크게 어긋나지 않는가
- 공통 컴포넌트 수정 시 영향 범위를 설명했는가

## 20. 초기 적용 우선순위

1. `tsconfig.json` 경로 설정 정리
2. `router/modules` 분리
3. `views` 서비스별 폴더 분리
4. `api`, `stores`, `types` 서비스 단위 분리
5. `BaseButton`, `BaseInput`, `BaseTable`, `StatusBadge` 공통화
6. 라우트 메타 표준화

