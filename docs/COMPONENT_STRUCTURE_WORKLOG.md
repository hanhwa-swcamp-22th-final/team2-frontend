# Component Structure Worklog

## 1. 문서 목적

- 이 문서는 `team2-frontend`에서 공통 컴포넌트 구조를 정리한 작업 기록이다.
- 목적은 두 가지다.
  - 나중에 왜 이런 구조로 바꿨는지 다시 이해하기 위함
  - 다음 작업자가 현재 상태를 빠르게 파악하기 위함

## 2. 작업 배경

- 화면 설계가 완료된 뒤 실제 화면 기능 구현을 시작하기 전에 공통 컴포넌트 기준이 필요했다.
- 기존 구조에서는 `AppHeader.vue`, `AppSidebar.vue`, `BaseCard.vue`가 모두 `src/components` 아래에 섞여 있었다.
- 이 상태로 개발을 시작하면 공통 UI와 레이아웃의 경계가 모호해지고, 팀원 간 파일 위치 기준도 흔들릴 수 있었다.

## 3. 작업 목표

이번 구조 작업의 목표는 아래와 같았다.

1. `layout`과 `common`의 역할을 분리한다.
2. 기존 컴포넌트를 새 구조에 맞게 이동한다.
3. 향후 공통 컴포넌트를 추가할 수 있는 기반을 만든다.
4. import 경로와 TypeScript 설정을 정리해 빌드가 깨지지 않도록 한다.

## 4. 적용한 구조

최종적으로 현재 기준은 아래와 같다.

```text
src/components/
  common/
  layout/
```

현재는 `domain/` 폴더를 아직 만들지 않았다.

이유:

- 지금 단계에서는 공통 기반을 먼저 안정화하는 것이 우선이었다.
- 도메인 전용 컴포넌트는 실제로 필요해질 때 생성하는 것이 팀 입장에서 더 이해하기 쉽다.

## 5. 이번에 수행한 작업

### 5-1. 폴더 구조 생성

- `src/components/common` 생성
- `src/components/layout` 생성

### 5-2. 기존 파일 이동

- `src/components/AppHeader.vue` -> `src/components/layout/AppHeader.vue`
- `src/components/AppSidebar.vue` -> `src/components/layout/AppSidebar.vue`
- `src/components/BaseCard.vue` -> `src/components/common/BaseCard.vue`

### 5-3. 신규 공통 컴포넌트 초안 파일 생성

`src/components/common`

- `BaseButton.vue`
- `BaseModal.vue`
- `BaseSelect.vue`
- `BaseTable.vue`
- `BaseTextField.vue`
- `BaseTextarea.vue`
- `InfoField.vue`
- `SearchInput.vue`
- `StatusBadge.vue`

`src/components/layout`

- `AppShell.vue`
- `PageTitleBar.vue`

### 5-4. import 경로 수정

- 이동된 파일을 참조하는 기존 import 경로를 새 위치 기준으로 수정했다.
- 특히 `AppLayout.vue`, `DashboardPage.vue`, `ServicePage.vue`의 경로를 정리했다.

### 5-5. TypeScript 경로 설정 수정

- `tsconfig.json`의 `baseUrl`을 `./frontend`에서 `.`로 변경했다.

수정 이유:

- 현재 `tsconfig.json`은 `team2-frontend` 루트에 존재한다.
- 기존 값인 `./frontend`는 실제 폴더 구조와 맞지 않아 `@/` alias 해석이 실패했다.

## 6. 구조 분리 기준

### `layout`

- 페이지 전체 구조를 담당하는 컴포넌트
- 예: 사이드바, 상단 헤더, 페이지 상단 타이틀 바

포함 파일:

- `AppHeader.vue`
- `AppSidebar.vue`
- `AppShell.vue`
- `PageTitleBar.vue`

### `common`

- 여러 화면 내부에서 반복해서 쓰는 범용 UI 컴포넌트
- 예: 버튼, 입력창, 모달, 테이블, 배지, 카드

포함 파일:

- `BaseCard.vue`
- `BaseButton.vue`
- `BaseTextField.vue`
- `BaseSelect.vue`
- `BaseTextarea.vue`
- `SearchInput.vue`
- `StatusBadge.vue`
- `BaseTable.vue`
- `BaseModal.vue`
- `InfoField.vue`

## 7. 왜 `domain`은 아직 만들지 않았는가

- 문서 설계 단계에서는 `domain` 폴더도 후보로 검토했다.
- 하지만 현재 시점에서는 도메인 전용 컴포넌트가 충분히 쌓이지 않았다.
- 폴더를 먼저 만들어두기보다, 실제로 `IncotermsSelector`, `LineItemTable`, `ActivityDetailModal` 같은 전용 컴포넌트가 생길 때 추가하는 편이 더 자연스럽다고 판단했다.

현재 기준:

- 지금은 `common`, `layout`만 운영
- 도메인 전용 컴포넌트가 실제로 생기면 `domain` 추가

## 8. 검증 결과

구조 반영 이후 아래를 확인했다.

1. 이동된 파일이 새 경로에 존재하는지 확인
2. import 경로가 새 구조를 참조하는지 확인
3. `tsconfig.json` alias 설정이 정상인지 확인
4. `npm run build`가 통과하는지 확인

결과:

- `npm run build` 정상 통과
- Vite production build 정상 완료

즉 현재 구조 변경은 빌드 가능한 상태까지 반영되었다.

## 9. 이번 작업에서 배운 점

1. 폴더 구조를 바꿀 때는 파일 이동보다 import 경로와 TypeScript alias 설정이 더 중요하다.
2. 공통 UI와 레이아웃은 둘 다 공통이지만 역할이 다르므로 폴더를 분리하는 편이 이해하기 쉽다.
3. `domain` 폴더는 설계상 필요하더라도 실제 컴포넌트가 생기기 전까지는 보류하는 것이 팀 입장에서 덜 복잡하다.
4. 구조 작업과 신규 컴포넌트 구현 작업은 분리하는 편이 리뷰하기 쉽다.

## 10. 현재 상태 요약

- 공통 컴포넌트 구조 기준 정리 완료
- `common`, `layout` 폴더 반영 완료
- 기존 레이아웃/카드 컴포넌트 이동 완료
- 기본 공통 컴포넌트 초안 파일 생성 완료
- TypeScript alias 설정 수정 완료
- 빌드 검증 완료

## 11. 다음 작업 추천

다음 단계에서는 구조 작업이 아니라 실제 공통 컴포넌트 구현과 화면 적용으로 넘어가면 된다.

우선순위 추천:

1. `BaseButton` 구현
2. `BaseTextField` 구현
3. `BaseSelect` 구현
4. `StatusBadge` 구현
5. `BaseModal` 구현
6. `BaseTable` 구현
7. 거래처 목록 / 사용자 목록 / PI 상세에 우선 적용

## 12. 한 줄 정리

- 이번 작업은 공통 컴포넌트를 많이 만드는 작업이 아니라, 공통 컴포넌트를 만들 수 있는 구조를 프로젝트 안에 안정적으로 심는 작업이었다.

