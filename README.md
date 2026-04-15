# team2-frontend

SalesBoost SPA. Vue 3 Composition API + Vite + Tailwind + Pinia.
4개 백엔드(Auth/Master/Activity/Documents) HATEOAS 응답을 단일 인터셉터로 처리.

## Stack

| 영역 | 기술 |
|---|---|
| Framework | Vue 3 (`<script setup>`), Vue Router 4 |
| Build | Vite 6 |
| Style | Tailwind CSS 3 |
| State | Pinia (auth · 도메인 store) |
| HTTP | Axios — Bearer 자동 주입 + 401 → /auth/refresh → 원 요청 재시도 |
| 환율 | fawazahmed0/currency-api (CDN) — PI 환율 자동 적용 |

## Run

```bash
npm install
npm run dev    # vite dev server
npm run build  # vite build → dist/
```

## Directory

```
src/
├── api/           ← 백엔드 호출 (auth, master, documents, activity, package, contacts, ...)
├── components/
│   ├── common/    ← BaseTable, BaseModal, ConfirmModal, SearchableCombobox, ToastContainer 등
│   ├── domain/    ← 도메인별 (activity / auth / document / master)
│   └── layout/    ← AppSidebar 등
├── composables/   ← useToast / useDocumentFilter / usePagination / useMasterLookup 등
├── constants/     ← 도메인 상수 (NUM_RANGE, INCOTERMS 등)
├── layouts/       ← AppLayout / AuthLayout
├── lib/           ← api.js (Axios 인스턴스 + 인터셉터), token, documentOutput
├── router/        ← Vue Router (역할 가드 — main.js beforeEach)
├── stores/        ← Pinia (auth, piDocuments, poDocuments, ciDocuments, plDocuments,
│                          productionOrderDocuments, shipmentStatusDocuments,
│                          shipmentOrderDocuments, ui)
├── styles/        ← tailwind.css
├── utils/         ← apiResponse(unwrapCollection), enumLabels, validators,
│                    documentApproval, documentOutput, referenceDocumentStatus, roleAccess
└── views/         ← 페이지
    ├── DashboardPage.vue    ← 역할별 위젯 (sales 결재함 / production 생산 / shipping 출하)
    ├── auth/                ← LoginPage, ForgotPasswordPage, UserManagementPage(5탭)
    ├── master/              ← ClientList/Detail, ItemList/Detail
    ├── documents/           ← PI/PO/CI/PL/생산지시서/출하지시서/출하현황/수금 + 상세
    ├── activity/            ← 활동기록 List/Create/Edit
    ├── contacts/            ← ContactListPage (개인 주소록 — flat, 거래처 무관)
    ├── emails/              ← EmailListPage (메일 이력)
    └── package/             ← ActivityPackagePage (좌:메타 / 우:활동기록 + 키워드 + 팀 단위 열람권한)
```

## 인증 / 세션

- `stores/auth.js` — accessToken (memory) + user (Pinia)
- `lib/api.js` — request 인터셉터: Bearer 자동 주입 / response 인터셉터: 401 → `/auth/refresh` (HttpOnly RT 쿠키) → 큐잉 후 원 요청 재시도
- `main.js` `router.beforeEach` — `meta.requiredRole` + `canAccessRouteByRole(user, routeName)` 가드. 거부 시 sessionStorage flash → `router.afterEach` 에서 amber toast 노출 + 역할 홈 리다이렉트

## 도메인 / 역할 정책

| Role | 메뉴 |
|---|---|
| ADMIN | 전체 (사용자관리 포함) |
| SALES | 사용자관리 외 전부 (생산지시서 · 출하지시서 · 출하현황 read-only — 본인 PO 진행 추적용) |
| PRODUCTION | 대시보드 + 생산지시서 (생산완료 처리 버튼 노출) |
| SHIPPING | 대시보드 + 출하지시서 + 출하현황 (출하완료 처리 버튼 노출) |

- 상태 변경 액션 (생산완료/출하완료 처리) 은 백엔드 `@PreAuthorize` + 프론트 `v-if` 이중 가드
- 컨택리스트는 작성자(writerId) 기준 개인 주소록 — 거래처 무관. 같은 팀 buyer 등록 시 sync 가 팀원 각각에게 별도 row 생성

## HATEOAS 응답 처리

| 응답 형식 | unwrap |
|---|---|
| `PagedModel<EntityModel<T>>` (페이징) | `unwrapCollection(data)` → `data._embedded.xxxList` |
| `CollectionModel<EntityModel<T>>` (전체) | 동일 |
| `EntityModel<T>` (단건) | 그대로 사용 (`_links` 무시) |
| 백엔드 raw `List<T>` | `Array.isArray(data) ? data : ...` 분기 |

`utils/apiResponse.js` 의 `unwrapCollection()` 한 번 호출로 모든 형식 정규화.

## 빌드 / 배포

- **Container**: `Dockerfile` multi-stage (vite build → nginx alpine)
- **CI**: GitHub Actions → `ghcr.io/.../team2-frontend:latest` + `:SHA`
- **CD**: ArgoCD Image Updater 가 ghcr.io watch → k8s rolling update
- **외부 노출**: nginx-ingress NodePort `:8001` (`/api/*` → gateway, `/*` → 정적 SPA)

## PR 정책

CLAUDE.md 참조 — 프론트는 **메인 직접 푸시 금지**. 이슈 발행 → 컨벤션 브랜치 (`fix/{issue#}/{slug}` 또는 `feat/...`) → 코드 작업 → PR 템플릿 작성 → 머지.
