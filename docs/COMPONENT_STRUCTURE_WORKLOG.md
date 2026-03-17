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
4. import 경로와 빌드 설정을 정리해 빌드가 깨지지 않도록 한다.

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

### 5-5. import 경로 및 빌드 설정 정리

- 이동 이후 경로가 바뀐 컴포넌트 import를 새 구조 기준으로 수정했다.
- 빌드가 정상 동작하도록 프로젝트 설정도 현재 구조에 맞게 정리했다.

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
3. import 경로와 빌드 설정이 새 구조 기준으로 정상인지 확인
4. `npm run build`가 통과하는지 확인

결과:

- `npm run build` 정상 통과
- Vite production build 정상 완료

즉 현재 구조 변경은 빌드 가능한 상태까지 반영되었다.

## 9. 이번 작업에서 배운 점

1. 폴더 구조를 바꿀 때는 파일 이동보다 import 경로와 빌드 설정 정리가 더 중요하다.
2. 공통 UI와 레이아웃은 둘 다 공통이지만 역할이 다르므로 폴더를 분리하는 편이 이해하기 쉽다.
3. `domain` 폴더는 설계상 필요하더라도 실제 컴포넌트가 생기기 전까지는 보류하는 것이 팀 입장에서 덜 복잡하다.
4. 구조 작업과 신규 컴포넌트 구현 작업은 분리하는 편이 리뷰하기 쉽다.

## 10. 현재 상태 요약

- 공통 컴포넌트 구조 기준 정리 완료
- `common`, `layout` 폴더 반영 완료
- 기존 레이아웃/카드 컴포넌트 이동 완료
- 기본 공통 컴포넌트 초안 파일 생성 완료
- import 경로 및 빌드 설정 정리 완료
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

---

## 13. 후속 작업: JavaScript 기준 통일

구조 정리 이후 실제 프로젝트 설정을 다시 점검하면서, 팀 기준이 JavaScript 기반이라는 점에 맞춰 아래 작업을 추가로 진행했다.

### 13-1. 적용 이유

- 프로젝트 소개 문서와 실제 파일 구성이 일치하지 않았다.
- 일부 파일과 설정이 TypeScript 기준으로 남아 있어 이후 공통 컴포넌트 구현 시 기준이 섞일 위험이 있었다.

### 13-2. 수행 내용

- `main.ts` -> `main.js`
- `stores/ui.ts` -> `stores/ui.js`
- `router/index.ts` -> `router/index.js`
- `lib/api.ts` -> `lib/api.js`
- `data/mock.ts` -> `data/mock.js`
- `data/navigation.ts` -> `data/navigation.js`
- `vite.config.ts` -> `vite.config.js`
- `env.d.ts`, `tsconfig.json` 제거
- `package.json`에서 `typescript`, `vue-tsc`, `@types/node` 제거
- `.vue` 파일의 `script setup lang="ts"` 제거

### 13-3. 검증 결과

- `npm run build` 정상 통과
- 현재 프로젝트는 JavaScript 기준으로 동작하는 상태로 정리되었다.

## 14. 후속 작업: 공통 컴포넌트 1차 구현

구조만 만들어둔 상태에서 끝내지 않고, 실제 화면에 바로 붙일 수 있는 1차 공통 컴포넌트 세트를 구현했다.

### 14-1. 구현한 컴포넌트

`src/components/common`

- `BaseButton.vue`
- `BaseTextField.vue`
- `BaseSelect.vue`
- `BaseTextarea.vue`
- `SearchInput.vue`
- `StatusBadge.vue`
- `InfoField.vue`
- `BaseTable.vue`
- `BaseModal.vue`

`src/components/layout`

- `PageTitleBar.vue`

### 14-2. 구현 목적

- 화면설계서에서 반복되는 기본 UI를 실제 공통 컴포넌트로 고정하기 위함
- 이후 목록, 상세, 등록/수정 화면을 조립 방식으로 빠르게 구현하기 위함
- 버튼, 입력, 상태 표시, 테이블, 모달의 기준을 코드 수준에서 통일하기 위함

### 14-3. 검증용 프리뷰 페이지 추가

- `src/views/CommonComponentsPage.vue` 추가
- `/common-preview` 라우트 추가
- 사이드바 메뉴에 `Common Preview` 항목 추가

이 페이지에서 1차 공통 컴포넌트의 기본 동작을 한 화면에서 직접 확인할 수 있게 했다.

### 14-4. 확인 가능한 항목

- 버튼 variant / size / disabled / block
- 텍스트 입력 / 셀렉트 / textarea / 검색 입력
- 상태 배지 색상
- 상세 정보 표시 형식
- 테이블 기본 렌더링 및 슬롯 셀
- 모달 열기 / 닫기 / footer slot
- 페이지 타이틀 바 액션 영역

### 14-5. 검증 결과

- `npm run build` 정상 통과
- 공통 컴포넌트 1차 세트가 최소 동작 가능한 상태로 반영되었다.

## 15. 현재 기준 다음 단계

현재는 공통 컴포넌트 1차 세트와 프리뷰 페이지까지 준비된 상태다.
다음 작업은 테스트 페이지가 아니라 실제 대표 화면에 공통 컴포넌트를 적용하는 단계로 넘어가면 된다.

우선 적용 추천:

1. 거래처 목록
2. 사용자 목록
3. PI 상세
4. 활동 기록 등록

## 16. 후속 작업: json-server 기준 데이터 구조 전환

1차 공통 컴포넌트 구현 이후, 기존 `src/data` 정적 import 방식 대신 json-server 기준으로 데이터를 관리하도록 구조를 변경했다.

### 16-1. 적용 이유

- 화면이 정적 mock 파일 import에 직접 의존하고 있었다.
- 이후 실제 API 연동 흐름과 최대한 비슷한 구조로 개발 기준을 맞출 필요가 있었다.

### 16-2. 수행 내용

- `db.json` 추가
- `src/api/dashboard.js`, `src/api/navigation.js` 추가
- `DashboardPage.vue`, `AppSidebar.vue`가 직접 mock 파일을 import하지 않도록 수정
- `vite.config.js`에 `/api` 프록시 설정 추가
- `package.json`에 `npm run api` 스크립트 추가
- 기존 `src/data/mock.js`, `src/data/navigation.js` 제거

### 16-3. 검증 결과

- `npm run build` 정상 통과
- `json-server` 응답 확인
- `/api` 프록시 경로 기준 동작 확인

즉 현재는 정적 import 구조가 아니라 `db.json -> src/api -> view/component` 흐름으로 정리된 상태다.

## 17. 후속 작업: 도메인 공통 컴포넌트 2차 구현

기본 UI 공통 세트 이후, 문서/활동 화면에서 반복되는 패턴을 도메인 공통 컴포넌트로 추가 구현했다.

### 17-1. 구현한 컴포넌트

`src/components/domain/document`

- `LineItemTable.vue`
- `DocumentHeaderActions.vue`
- `DocumentSummarySection.vue`
- `LinkedDocumentList.vue`

`src/components/domain/activity`

- `FilterPanel.vue`
- `ActivityTypeBadge.vue`
- `ActivityDetailModal.vue`

### 17-2. 구현 목적

- 문서 상세 상단 액션, 품목 테이블, 연결 문서 목록 같은 반복 패턴을 공통으로 관리하기 위함
- 활동기록 화면의 유형 배지, 조회 조건 패널, 상세 모달을 공통화하기 위함
- 이후 실제 문서/활동 화면 적용 시 중복 구현을 줄이기 위함

### 17-3. 검증용 프리뷰 페이지 추가

- `src/views/DomainComponentsPage.vue` 추가
- `/domain-preview` 라우트 추가
- 사이드바 메뉴에 `Domain Preview` 항목 반영

이 페이지에서 2차 공통 컴포넌트의 기본 조합과 동작을 한 화면에서 확인할 수 있게 했다.

### 17-4. 검증 결과

- `npm run build` 정상 통과
- `/domain-preview` 응답 확인

현재 2차 공통 컴포넌트는 기본 동작 가능한 상태이며, 실제 화면 연결 전 단계까지 정리된 상태다.

## 18. demo 4 확인 후 추가로 보인 공통 후보

최신 데모 화면(`demo 4`)을 확인한 결과, 기존 1차/2차 공통 컴포넌트 외에 추가 후보가 더 분명해졌다.

### 우선순위

1. `SearchableCombobox`
- 거래처, 담당자, 발송자, 부서 선택처럼 검색 가능한 선택 입력 패턴이 반복된다.

2. `SearchModal`
- 상세검색, PO 검색, 항목 선택용 모달 패턴이 반복된다.

3. `DateField / DateRangeField`
- 캘린더 아이콘, 포맷 처리, 기간 검색 패턴이 반복된다.

4. `FileUploadField`
- 도장/서명 이미지 업로드 UI가 여러 화면에 반복된다.

### 판단

- 기존 공통 컴포넌트를 전면 수정해야 하는 상태는 아니다.
- 다만 최신 데모 기준으로는 위 4개가 다음 공통화 우선 후보로 보인다.
- `IncotermsSelector`는 계속 `pi` 도메인 전용으로 두는 것이 맞다.

## 19. 후속 작업: demo 4 반영 추가 공통 컴포넌트 구현

`demo 4` 확인 후 우선순위로 정리했던 후보 4개를 실제 공통 컴포넌트로 추가 구현했다.

### 19-1. 구현한 컴포넌트

`src/components/common`

- `SearchableCombobox.vue`
- `SearchModal.vue`
- `DateField.vue`
- `DateRangeField.vue`
- `FileUploadField.vue`

### 19-2. 구현 목적

- 검색 가능한 선택 입력 패턴을 공통화하기 위함
- 상세검색 / PO 검색 같은 검색 모달 패턴을 공통화하기 위함
- 날짜 단일 선택 및 기간 선택 입력을 공통화하기 위함
- 도장/서명 이미지 업로드 UI를 공통화하기 위함

### 19-3. 프리뷰 반영

- 기존 `DomainComponentsPage.vue`에 위 5개 컴포넌트를 추가로 연결
- `/domain-preview` 한 화면에서 2차 도메인 공통 + 추가 공통 후보까지 함께 확인 가능하도록 구성

### 19-4. 검증 결과

- `npm run build` 정상 통과
- 추가 공통 컴포넌트가 프리뷰 페이지 기준으로 최소 동작 가능한 상태로 반영되었다.

## 20. 현재 기준 상태 정리

현재까지 공통 컴포넌트 작업은 아래 흐름으로 정리된 상태다.

1. 구조 정리
2. JavaScript 기준 통일
3. 1차 기본 공통 컴포넌트 구현
4. json-server 기준 데이터 구조 전환
5. 2차 도메인 공통 컴포넌트 구현
6. `demo 4` 반영 추가 공통 컴포넌트 구현

즉 지금은 공통 컴포넌트 추가 구현 단계가 일단락되었고, 다음 중심 작업은 실제 화면 적용과 연결 로직 반영이다.
