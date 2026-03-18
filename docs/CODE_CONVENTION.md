# SalesBoost 컨벤션 가이드

> 팀 닥트리오의 협업 효율과 코드 가독성을 위한 표준 규칙

---

## Part 1. 코드 컨벤션

### 1.1 공통 명명 규칙

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 클래스 / 인터페이스 | PascalCase | `OrderController`, `DocumentService` |
| 메서드 / 변수 | camelCase | `generatePdf()`, `totalAmount` |
| 상수 | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE`, `DEFAULT_TIMEOUT` |
| 패키지 | 소문자, 구분자 없음 | `com.salesboost.order` |
| DB 테이블 / 컬럼 | snake_case | `purchase_order`, `created_at` |

### 1.2 프론트엔드 (Vue 3)

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트 파일명 | PascalCase | `OrderDashboard.vue` |
| 템플릿 내 컴포넌트 호출 | PascalCase | `<OrderDashboard />` |
| CSS 클래스명 | kebab-case | `btn-primary`, `status-badge` |

#### 페이지 / 파일 네이밍

- 페이지 컴포넌트: `도메인 + 기능 + Page.vue`
- Store 파일: `useXxxStore`를 export, 파일명은 `xxx.js`
- API 파일: `도메인명.js`

예시:

- `ActivityListPage.vue`, `ActivityCreatePage.vue`
- `BaseButton.vue`, `StatusBadge.vue`
- `activity.js`, `auth.js`

---

### 1.3 Vue 컴포넌트 작성 규칙

- `<script setup>` 필수
- Props는 `defineProps`로 선언하고 필요한 기본값과 제약을 명시한다.
- Emits는 `defineEmits`로 선언한다.
- 템플릿에서 복잡한 조건식은 직접 쓰지 말고 `computed` 또는 함수로 분리한다.
- 한 컴포넌트가 너무 커지면 표시 영역 단위로 분리한다.

권장 작성 순서:

1. import
2. props / emits
3. route / store / 외부 의존성
4. state
5. computed
6. methods
7. lifecycle

---

### 1.4 디렉터리 규칙

```text
src/
  api/
    auth/
    master/
    activity/
    order/
  components/
    common/
    domain/
      activity/
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
    activity/
    order/
```

- `views`: 라우트에 직접 연결되는 페이지 컴포넌트 (서비스별 폴더 분리)
- `components/common`: 2개 이상 서비스에서 공통으로 쓰는 UI만
- `components/domain/{서비스}`: 해당 서비스 전용 컴포넌트
- `api`: 서버 통신 함수 모음 (`axios` 직접 호출 금지, `src/lib/api.js` 경유)
- `stores`: Pinia 전역 상태 (UI 상태와 비즈니스 상태 분리)
- `router/modules`: 서비스별 라우트 정의

예시:

```text
src/views/activity/ActivityListPage.vue
src/views/activity/ActivityCreatePage.vue
src/components/domain/activity/ActivityTypeBadge.vue
src/components/common/BaseTable.vue
```

---

### 1.5 파일 분리 기준

- 페이지 하나당 파일 하나를 기본으로 한다.
- 리스트, 상세, 등록/수정 화면은 분리한다.
- 모달이 복잡해지면 페이지 파일에서 분리한다.
- 같은 서비스에서만 쓰는 컴포넌트는 해당 서비스 폴더 아래에 둔다.

---

### 1.6 상태관리 규칙

- 전역으로 공유되는 상태만 Pinia에 둔다.
- 페이지 내부에서만 쓰는 값은 컴포넌트 내부 `ref`, `reactive`로 관리한다.
- 서비스별 store를 분리한다.
- UI 상태와 비즈니스 상태를 한 store에 섞지 않는다.

예시:

- `ui.js`: 사이드바, 토스트, 공통 로딩
- `auth.js`: 로그인 사용자, 권한, 메뉴 접근
- `activity.js`: 활동기록 검색 조건, 목록 캐시

---

### 1.7 API 규칙

- 모든 API 호출은 `src/api` 아래에서 관리한다.
- 컴포넌트에서 직접 `axios`를 호출하지 않는다.
- 공통 인스턴스는 `src/lib/api.js`를 사용한다.
- 화면용 데이터 가공은 API 함수가 아니라 컴포저블 또는 페이지에서 처리한다.

예시:

```js
export async function fetchActivities(params) {
  const { data } = await api.get('/activities', { params })
  return data
}
```

---

### 1.8 스타일 규칙

- Tailwind utility class를 기본으로 사용한다.
- 색상, 그림자, 폰트는 `tailwind.config.js`의 토큰을 우선 사용한다. (`brand-*`, `ink`, `mist`, `sand`, `ember`)
- 인라인 스타일은 차트, 동적 크기 계산 같은 불가피한 경우만 허용한다.
- 반복되는 스타일 패턴은 공통 컴포넌트로 승격한다.

---

### 1.9 공통 컴포넌트 규칙

- 공통 컴포넌트는 서비스 문맥 없이도 이해 가능해야 한다.
- 공통 컴포넌트는 도메인 API를 import 하지 않는다.
- 공통 컴포넌트 변경 시 영향 범위를 PR 설명에 반드시 적는다.
- 특정 서비스 요구사항 때문에 억지로 공통 컴포넌트를 복잡하게 만들지 않는다.

---

### 1.10 더미 데이터와 실제 API 전환 규칙

- 화면 설계용 mock 데이터는 `src/data` 또는 서비스별 mock 파일에 둔다.
- mock 데이터 구조는 실제 API 응답 형태와 최대한 비슷하게 유지한다.
- 기능 구현이 시작되면 mock 상수를 직접 템플릿에서 쓰지 말고 API 함수 또는 store를 통해 주입한다.

---

### 1.11 import 규칙

- `@` alias를 기본으로 사용한다. (상대경로 `../../../` 지양)
- import 순서:
  1. Vue, Vue Router, Pinia
  2. 외부 라이브러리
  3. `@/` 내부 모듈
  4. 타입 import

---

### 1.12 주석 규칙

- 주석은 이유를 설명할 때만 작성한다.
- 코드만 봐도 알 수 있는 설명 주석은 금지한다.
- 임시 처리라면 제거 조건이나 배경을 남긴다.

---

## Part 2. Git 컨벤션

### 2.1 브랜치 전략

```
main                              ← 배포 브랜치 (PR만 허용, 직접 push 금지)
├── feat/이슈번호-설명             ← 기능 개발
├── fix/이슈번호-설명              ← 버그 수정
├── refactor/이슈번호-설명        ← 리팩토링
├── infra/이슈번호-설명           ← 인프라 작업
└── hotfix/이슈번호-설명          ← 긴급 수정
```

예시:

```
feat/12-activity-list-page
fix/25-filter-reset-bug
refactor/30-extract-common-modal
infra/8-github-actions-ci
hotfix/42-production-500-error
```

---

### 2.2 커밋 메시지

**형식:** `타입: 설명 (#이슈번호)`

| 타입 | 용도 | 예시 |
| --- | --- | --- |
| `feat` | 새 기능 | `feat: 활동기록 목록 페이지 구현 (#12)` |
| `fix` | 버그 수정 | `fix: 필터 초기화 시 날짜 미리셋 수정 (#25)` |
| `refactor` | 코드 개선 | `refactor: ActivityFilterPanel 컴포넌트 분리 (#30)` |
| `infra` | 인프라 | `infra: GitHub Actions CI 파이프라인 구성 (#8)` |
| `docs` | 문서 | `docs: 코드 컨벤션 문서 업데이트` |
| `style` | 포맷팅 | `style: 코드 포맷팅` |
| `test` | 테스트 | `test: ActivityService 단위 테스트 추가` |
| `chore` | 기타 | `chore: 의존성 업데이트` |

---

### 2.3 작업 플로우

```
이슈 생성 → 브랜치 생성 → 작업 & 커밋 → Push → PR 생성 → 리뷰(1명) → Merge → 브랜치 삭제
```

---

### 2.4 Merge 방식

- **Squash Merge만 허용** (PR 단위로 커밋 로그 정리)
- Merge Commit, Rebase Merge는 사용하지 않는다.
- Merge 후 feature 브랜치는 자동 삭제된다.

```
main: ── X ── Y ── S (squashed: feat/12-activity-list-page)
feat: ── A ── B ── C  →  하나의 커밋으로 압축
```

---

### 2.5 협업 규칙

- 한 PR에는 하나의 목적만 담는다.
- 공통 컴포넌트 수정이 포함되면 영향 범위를 PR 본문에 적는다.
- 서비스 담당자는 원칙적으로 자기 서비스 폴더 안에서 작업한다.

---

## Part 3. GitHub 레포 설정

### 3.1 라벨

#### 타입 라벨

| 라벨 | 색상 | 설명 |
| --- | --- | --- |
| `feature` | `#1D76DB` | 새 기능 추가 |
| `bug` | `#E11D48` | 버그 수정 |
| `refactor` | `#8B5CF6` | 코드 개선/리팩토링 |
| `infra` | `#F97316` | CI/CD, Docker 등 |
| `docs` | `#6B7280` | 문서 작업 |
| `hotfix` | `#DC2626` | 긴급 수정 |

#### 상태 라벨

| 라벨 | 색상 | 설명 |
| --- | --- | --- |
| `in-progress` | `#FBBF24` | 작업 중 |
| `in-review` | `#A78BFA` | 리뷰 요청 |
| `done` | `#22C55E` | 완료 |
| `blocked` | `#EF4444` | 블로커 있음 |

#### 도메인 라벨 (프론트 레포 전용)

| 라벨 | 색상 | 설명 |
| --- | --- | --- |
| `domain:auth` | `#0EA5E9` | 인증 |
| `domain:master` | `#14B8A6` | 기준정보 |
| `domain:document` | `#8B5CF6` | 문서 |
| `domain:activity` | `#F59E0B` | 활동 |
| `domain:common` | `#6B7280` | 공통 컴포넌트 |

---

### 3.2 레포 Settings

#### Pull Requests

| 설정 | 값 |
| --- | --- |
| Allow merge commits | ❌ OFF |
| Allow squash merging | ✅ ON |
| Allow rebase merging | ❌ OFF |
| Always suggest updating PR branches | ✅ ON |
| Automatically delete head branches | ✅ ON |

#### Branch Protection (main)

| 설정 | 값 |
| --- | --- |
| Require a pull request before merging | ✅ |
| Required approvals | `1` |
| Require status checks to pass | ✅ (CI 세팅 후) |
| Do not allow bypassing | ✅ |

---

## PR 체크리스트

- [ ] 파일 위치가 규칙에 맞는가
- [ ] 공통과 서비스 전용 경계가 명확한가
- [ ] 템플릿에 복잡한 로직이 들어가 있지 않은가
- [ ] API 호출이 컴포넌트에 직접 박혀 있지 않은가
- [ ] mock 구조와 실제 데이터 구조가 크게 어긋나지 않는가
- [ ] 공통 컴포넌트 수정 시 영향 범위를 설명했는가
- [ ] 불필요한 코드/주석이 없는가
- [ ] 충돌(conflict)이 해결되었는가