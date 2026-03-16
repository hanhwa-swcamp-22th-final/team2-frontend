# SalesBoost 공통 컴포넌트 가이드

## 1. 이 문서의 목적

- 이 문서는 `SalesBoost` 화면 구현 전에 팀이 공통 컴포넌트 범위를 같은 기준으로 이해하기 위한 문서다.
- 가장 중요한 목적은 세 가지다.
  - 무엇을 공통으로 만들지 빠르게 합의한다.
  - 무엇을 공통으로 만들면 안 되는지 미리 구분한다.
  - 3명이 동시에 작업해도 충돌이 적게 나도록 기준을 맞춘다.

## 2. 공통 컴포넌트란 무엇인가

- 공통 컴포넌트는 여러 화면에서 반복해서 쓰이는 UI 조각이다.
- 공통 컴포넌트는 특정 서비스 규칙에 종속되면 안 된다.
- 공통 컴포넌트는 화면을 예쁘게 만드는 용도보다, 화면 구현 속도와 일관성을 높이는 용도가 더 크다.

쉽게 말하면:

- `버튼`, `입력창`, `상태 배지`, `테이블`, `모달`은 공통이 될 가능성이 높다.
- `인코텀즈 선택`, `PI 문서 전용 화면`, `활동 기록 상세 내용`은 도메인 전용일 가능성이 높다.

## 3. SalesBoost에서 반복되는 화면 패턴

피그마 기준으로 현재 반복되는 패턴은 아래와 같다.

1. 좌측 사이드바 + 상단 헤더 + 본문 구조
2. 페이지 제목 + 우측 액션 버튼
3. 조회 조건 영역 + 검색/초기화 버튼
4. 목록 테이블
5. 상태 표시 배지
6. 등록/수정 모달
7. 상세 화면의 정보 섹션
8. 문서형 화면의 품목 테이블
9. 활동 기록 목록/상세
10. 인쇄/PDF 버튼이 포함된 상세 액션 영역

즉 공통 컴포넌트는 이 반복 패턴을 기준으로 먼저 만든다.

## 4. 공통 컴포넌트 분류

### 4-1. 레이아웃 공통

- `AppShell`
  - 사이드바, 헤더, 본문 전체 레이아웃
- `SideNav`
  - 좌측 메뉴
- `TopHeader`
  - 상단 검색, 알림, 사용자 정보
- `PageTitleBar`
  - 페이지명과 우측 액션 버튼 영역

### 4-2. 폼 공통

- `FormField`
  - 라벨 + 필수 표시 + 입력 컴포넌트 묶음
- `BaseTextField`
  - 일반 텍스트 입력
- `BaseSelect`
  - 드롭다운 선택
- `BaseDateField`
  - 날짜 입력
- `BaseDateRangeField`
  - 기간 입력
- `BaseTextarea`
  - 여러 줄 입력
- `SearchInput`
  - 검색용 입력창

### 4-3. 버튼 공통

- `BaseButton`
  - 기본 버튼 컴포넌트
- 권장 variant
  - `primary`
  - `secondary`
  - `ghost`
  - `danger`
  - `text`

### 4-4. 상태/표시 공통

- `StatusBadge`
  - 활성, 비활성, 확정, 초안, 발송, 생산중, 준비중, 완료 등 상태 표시
- `InfoField`
  - 라벨 + 값 표시
- `SectionCard`
  - 제목이 있는 정보 섹션 박스
- `MetricCard`
  - 대시보드 KPI 카드

### 4-5. 테이블 공통

- `BaseTable`
  - 목록 테이블 기본 구조
- `TableActionCell`
  - 수정, 삭제, 미리보기 같은 행 액션 영역

### 4-6. 모달 공통

- `BaseModal`
  - 팝업 레이아웃
- `ModalFooter`
  - 취소/저장, 닫기/인쇄/PDF 같은 하단 버튼 영역

## 5. SalesBoost 도메인 공통 컴포넌트

이 컴포넌트들은 완전한 범용 공통은 아니지만, SalesBoost 안에서 여러 화면에 반복되므로 공통으로 관리하는 것이 맞다.

### 5-1. 문서 도메인 공통

- `DocumentHeaderActions`
  - 수정, 삭제, 미리보기, 인쇄, PDF 다운로드
- `DocumentSummarySection`
  - PI/PO/CI/PL 기본 정보 영역
- `LinkedDocumentList`
  - 연결 문서 목록
- `LineItemTable`
  - 품목 / 수량 / 단가 / 금액 테이블

### 5-2. 활동 기록 도메인 공통

- `FilterPanel`
  - 조회 조건 박스 전체
- `ActivityTypeBadge`
  - 미팅/협의, 메모/노트, 이슈, 코멘트, 일정
- `ActivityDetailModal`
  - 활동 상세 모달

## 6. 공통으로 만들지 말아야 하는 것

아래는 현재 기준으로 너무 이르게 공통화하면 안 되는 것들이다.

### 6-1. 인코텀즈 선택 UI

- PI 등록 화면의 인코텀즈 선택은 일반 드롭다운이 아니다.
- 전용 시각화와 설명이 포함되어 있어서 `pi` 도메인 전용 컴포넌트로 두는 것이 맞다.

### 6-2. 수주건 선택 패널

- 활동 기록 등록에서 사용하는 `PO 검색`, `선택`, `연결` 흐름은 일반 입력 컴포넌트가 아니다.
- 전용 선택 패널로 관리하는 것이 안전하다.

### 6-3. 사용자 아바타 + 이름 셀

- 사용자 목록의 원형 이니셜 + 이름 조합은 당장은 `user` 도메인 전용으로 두는 편이 낫다.

### 6-4. 문서 미리보기 전체 화면

- 문서 미리보기는 일반 공통 UI가 아니라 출력용 템플릿에 가깝다.
- 공통 컴포넌트가 아니라 문서 전용 화면으로 본다.

## 7. 1차 구현 우선순위

처음부터 모든 공통 컴포넌트를 만들면 오히려 느려진다. 아래 순서로 먼저 만든다.

1. `AppShell`
   - 화면 전체의 기본 틀이다. 좌측 사이드바, 상단 헤더, 본문 영역 배치를 공통으로 잡는다.
2. `SideNav`
   - 서비스 메뉴를 보여주는 좌측 네비게이션이다.
3. `TopHeader`
   - 상단 검색, 알림, 사용자 정보 영역이다.
4. `BaseButton`
   - 저장, 취소, 등록, 수정, 삭제처럼 반복되는 버튼 공통 컴포넌트다.
5. `BaseTextField`
   - 일반 텍스트 입력창이다. 이름, 제목, 코드, 이메일 입력 등에 사용한다.
6. `BaseSelect`
   - 상태, 역할, 부서, 거래처 같은 선택형 입력에 사용한다.
7. `FormField`
   - 라벨, 필수 표시, 입력 컴포넌트를 한 묶음으로 보여주는 폼 단위 컴포넌트다.
8. `SearchInput`
   - 목록 조회나 상단 검색에 사용하는 검색 전용 입력창이다.
9. `StatusBadge`
   - 활성, 비활성, 확정, 초안, 발송, 완료 같은 상태를 공통 스타일로 보여준다.
10. `BaseTable`
   - 목록 화면의 표 구조를 공통으로 처리하는 컴포넌트다.
11. `SectionCard`
   - 상세 화면에서 제목이 있는 박스형 섹션을 공통으로 처리한다.
12. `InfoField`
   - 라벨과 값을 한 세트로 보여주는 상세 정보 표시 컴포넌트다.
13. `BaseModal`
   - 등록, 수정, 상세 보기 팝업의 기본 틀을 담당한다.

이 1차 세트만 있어도 아래 화면 대부분을 시작할 수 있다.

- 거래처 목록
- 사용자 목록
- PI 목록
- 기록 관리
- 사용자 등록/수정 모달

## 8. 2차 구현 우선순위

1차 공통이 안정되면 다음을 만든다.

1. `LineItemTable`
   - 문서 화면에서 반복되는 품목 / 수량 / 단가 / 금액 테이블이다.
2. `DocumentHeaderActions`
   - 문서 상세 상단의 수정, 삭제, 미리보기, 인쇄, PDF 다운로드 버튼 묶음이다.
3. `DocumentSummarySection`
   - PI, PO, CI, PL 같은 문서의 기본 정보를 보여주는 요약 영역이다.
4. `LinkedDocumentList`
   - 문서 간 연결 관계를 보여주는 목록 컴포넌트다.
5. `FilterPanel`
   - 조회 조건, 기간, 드롭다운, 검색/초기화 버튼을 묶은 필터 영역이다.
6. `ActivityTypeBadge`
   - 활동 유형을 공통 색상과 형태로 보여주는 배지 컴포넌트다.
7. `ActivityDetailModal`
   - 활동 기록 상세 내용을 팝업 형태로 보여주는 컴포넌트다.

이 단계부터는 문서 화면과 활동 기록 화면 구현 속도가 빨라진다.

## 9. 추천 폴더 구조

```text
src/components/
  common/
    layout/
      AppShell.vue
      SideNav.vue
      TopHeader.vue
      PageTitleBar.vue
    form/
      FormField.vue
      BaseTextField.vue
      BaseSelect.vue
      BaseDateField.vue
      BaseDateRangeField.vue
      BaseTextarea.vue
      SearchInput.vue
    button/
      BaseButton.vue
    data-display/
      StatusBadge.vue
      InfoField.vue
      SectionCard.vue
      MetricCard.vue
    table/
      BaseTable.vue
      TableActionCell.vue
    overlay/
      BaseModal.vue
      ModalFooter.vue
  domain/
    document/
      DocumentHeaderActions.vue
      DocumentSummarySection.vue
      LinkedDocumentList.vue
      LineItemTable.vue
    activity/
      FilterPanel.vue
      ActivityTypeBadge.vue
      ActivityDetailModal.vue
    pi/
      IncotermsSelector.vue
    user/
      UserFormModal.vue
      UserAvatarNameCell.vue
```

## 10. 3인 작업 기준

### A. 공통 담당

- `AppShell`
- `SideNav`
- `TopHeader`
- `BaseButton`
- `BaseTextField`
- `BaseSelect`
- `BaseTable`
- `BaseModal`
- `StatusBadge`

### B. 문서 도메인 담당

- PI / PO / CI / PL 관련 화면
- `LineItemTable`
- `LinkedDocumentList`
- `DocumentHeaderActions`

### C. 관리 / 활동 도메인 담당

- 기록 관리
- 사용자 관리
- `FilterPanel`
- `ActivityDetailModal`
- `UserFormModal`

## 11. 팀이 꼭 지켜야 할 원칙

1. 공통 컴포넌트는 특정 서비스 로직을 넣지 않는다.
2. 공통 컴포넌트는 Props로 제어하고, API 호출을 직접 하지 않는다.
3. 공통 컴포넌트 수정은 영향 범위를 꼭 공유한다.
4. 애매하면 일단 도메인 컴포넌트로 만들고, 나중에 공통으로 올린다.
5. 한 번에 크게 만들지 말고, 실제 화면 2~3개에 붙여보고 확정한다.

## 12. 빠른 판단 기준

### 공통으로 올려도 되는 경우

- 2개 이상의 서비스에서 같은 형태로 반복된다.
- 이름을 서비스 문맥 없이 지을 수 있다.
- Props만으로 동작 설명이 가능하다.

### 공통으로 올리면 안 되는 경우

- 특정 업무 규칙이 붙는다.
- 화면 하나만 보고 억지로 일반화했다.
- Props가 서비스 조건 때문에 복잡하게 늘어난다.

## 13. 지금 바로 팀이 합의해야 할 것

1. 1차 공통 컴포넌트 목록
2. 공통 폴더 구조
3. 공통 담당자 1명 지정
4. `LineItemTable`를 문서 도메인 공통으로 볼지 여부
5. 인코텀즈 선택 UI를 전용 컴포넌트로 유지할지 여부

## 14. 한 줄 정리

- 공통 컴포넌트는 `여러 화면에서 반복되는 단순 UI`만 먼저 만든다.
- `문서 전용`, `활동 전용`, `인코텀즈 전용` 같은 것은 도메인 컴포넌트로 분리한다.
- 먼저 작은 공통 세트를 고정하고, 그 위에서 각 서비스 화면을 조립하는 방식으로 가야 팀이 가장 이해하기 쉽고 충돌도 적다.
