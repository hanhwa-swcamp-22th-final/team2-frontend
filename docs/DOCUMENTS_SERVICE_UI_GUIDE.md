# Documents Service UI Guide

## 1. 문서 목적

이 문서는 Documents Service 화면 구현을 코드 기준으로 설명하기 위한 문서입니다.

즉, 아래 질문에 답하기 위해 작성했습니다.

- 현재 문서 화면은 어떤 파일 구조로 되어 있는가
- 왜 공통 컴포넌트를 추가했는가
- 각 컴포넌트는 어떤 책임을 가지는가
- 어떤 상태를 화면에서 관리하는가
- 지금 단계에서 구현된 것과 아직 안 한 것은 무엇인가
- 코드리뷰할 때 무엇을 중점적으로 봐야 하는가

대상 화면:

- PI 관리
- PO 관리
- CI 관리
- PL 관리
- 출하지시서
- 생산지시서
- 출하 현황
- 매출·수금 현황

---

## 2. 이번 작업의 목표를 코드로 해석하면

이번 작업은 “문서 서비스 화면을 그렸다”가 아니라, 코드 관점에서는 아래 세 가지를 한 작업입니다.

1. **각 문서 화면의 반복 구조를 찾았다**
2. **반복되는 구조를 공통 컴포넌트로 분리했다**
3. **각 화면은 공통 컴포넌트를 조합하는 방식으로 다시 만들었다**

즉, 목표는 화면 하나를 예쁘게 만드는 것이 아니라
여러 문서 화면이 같은 규칙으로 유지되게 만드는 것이었습니다.

---

## 3. 현재 파일 구조

### 3.1 문서 화면 파일

문서 화면은 아래 파일들로 나뉘어 있습니다.

```text
src/views/documents/
  PIPage.vue
  POPage.vue
  CIPage.vue
  PLPage.vue
  ShipmentOrderPage.vue
  ProductionOrderPage.vue
  ShipmentsPage.vue
  CollectionsPage.vue
```

### 3.2 이번 작업에서 핵심으로 쓴 공통 컴포넌트

```text
src/components/common/
  BaseButton.vue
  BaseCard.vue
  BaseTable.vue
  FormField.vue
  DateField.vue
  SearchableCombobox.vue
  SearchTriggerField.vue
  StatusBadge.vue
  FilterToolbarCard.vue
  CollapsibleFilterCard.vue
  DocumentPageHeader.vue
```

### 3.3 라우트 연결

문서 화면은 화면 확인이 가능해야 하므로 라우터에 연결되어 있습니다.

관련 파일:

- [index.js](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/router/index.js)

중요:

- 현재 라우트 연결은 **화면 진입용**
- 저장, 삭제, 상세 이동 같은 내부 동작 연결은 아직 아님

---

## 4. 왜 공통 컴포넌트를 추가했는가

### 4.1 문제

처음에는 각 화면에 직접 마크업을 넣어도 UI는 빠르게 나옵니다.

하지만 문서 서비스 화면은 거의 항상 아래 구조를 반복합니다.

- 제목 + 아이콘 + 액션 버튼
- 키워드 검색 + 상세검색 버튼
- 상세검색 카드
- 목록 테이블
- 상태 배지

이걸 페이지마다 직접 쓰면:

- 클래스가 조금씩 달라짐
- spacing이 안 맞음
- 나중에 한 군데 수정할 때 파일 8개를 다 건드려야 함
- “기준 화면과 동일하게 유지”가 점점 어려워짐

### 4.2 해결

그래서 반복되는 구조는 공통 컴포넌트로 뺐습니다.

대표 예시는 아래입니다.

- `DocumentPageHeader`
- `FilterToolbarCard`
- `CollapsibleFilterCard`

---

## 5. 각 공통 컴포넌트의 역할

### 5.1 DocumentPageHeader

파일:

- [DocumentPageHeader.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/common/DocumentPageHeader.vue)

역할:

- 문서 화면 상단 제목 영역 렌더링
- 좌측 아이콘 + 제목
- 우측 액션 버튼 슬롯
- 모바일에서는 세로 정렬, 데스크톱에서는 가로 정렬

핵심 props:

- `title`
- `iconClass`

구조:

```vue
<DocumentPageHeader title="PI 관리" icon-class="fas fa-file-invoice">
  <template #actions>
    <BaseButton>PI 작성</BaseButton>
  </template>
</DocumentPageHeader>
```

이 컴포넌트가 필요한 이유:

- PI/PO/CI/PL/지시서/현황 화면의 헤더 패턴이 사실상 동일하기 때문입니다.

### 5.2 FilterToolbarCard

파일:

- [FilterToolbarCard.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/common/FilterToolbarCard.vue)

역할:

- 상단 키워드 검색창
- 상세검색 버튼
- 모바일에서 버튼이 전체폭, 데스크톱에서 자동폭

핵심 props / emits:

- `modelValue`
- `advancedOpen`
- `placeholder`
- `update:modelValue`
- `toggleAdvanced`

구조:

```vue
<FilterToolbarCard
  v-model="filters.keyword"
  :advanced-open="isAdvancedOpen"
  @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
/>
```

이 컴포넌트가 필요한 이유:

- 문서 화면 8개가 같은 검색바 구조를 반복하기 때문입니다.

### 5.3 CollapsibleFilterCard

파일:

- [CollapsibleFilterCard.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/common/CollapsibleFilterCard.vue)

역할:

- 상세검색 카드의 접기/펼치기
- 상단 제목행
- 하단 필터 영역 슬롯 렌더링

핵심 props / emits:

- `open`
- `title`
- `toggle`

구조:

```vue
<CollapsibleFilterCard
  :open="isAdvancedOpen"
  @toggle="isAdvancedOpen = !isAdvancedOpen"
>
  <!-- 상세검색 필드 -->
</CollapsibleFilterCard>
```

이 컴포넌트가 필요한 이유:

- 접기/펼치기 패턴이 반복되기 때문입니다.

중요한 트러블슈팅:

- 처음에는 `overflow-hidden`이 있어 콤보박스 목록이 잘렸습니다.
- 그래서 현재는 `overflow-hidden`을 제거한 상태입니다.

### 5.4 SearchTriggerField

파일:

- [SearchTriggerField.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/common/SearchTriggerField.vue)

역할:

- readonly 검색 필드 + 오른쪽 검색 아이콘 버튼

사용 위치:

- 거래처명 검색
- 코드 검색
- 품목명 검색

이 컴포넌트가 필요한 이유:

- 기준 화면에서 일반 입력이 아니라 “검색 열기용 필드” 패턴이 반복되었기 때문입니다.

### 5.5 BaseTable

파일:

- [BaseTable.vue](/Users/gangseonghun/be22-final-team2-project/team2-frontend/src/components/common/BaseTable.vue)

역할:

- 공통 테이블 컨테이너
- 헤더/바디 렌더링
- 컬럼 width/align 처리
- 셀 슬롯 처리
- 실제 `<tfoot>` 슬롯 처리

중요한 변경:

- 판매현황 합계 행을 위해 `footer` 슬롯이 테이블 내부 `<tfoot>`으로 렌더링되도록 수정함

즉 지금은 아래처럼 실제 합계 행을 넣을 수 있습니다.

```vue
<BaseTable :columns="columns" :rows="rows">
  <template #footer>
    <tr>
      <td>합계</td>
      ...
    </tr>
  </template>
</BaseTable>
```

---

## 6. 화면 파일의 공통 상태 구조

문서 화면은 대부분 같은 상태 패턴을 사용합니다.

예:

```js
const isAdvancedOpen = ref(true)

const filters = ref({
  keyword: '',
  registeredFrom: '',
  registeredTo: '',
  manager: '',
  clientName: '',
  code: '',
  productName: '',
  country: '',
  status: '',
  deliveryFrom: '',
  deliveryTo: '',
})
```

의미:

- `isAdvancedOpen`
  - 상세검색 카드 열림/닫힘 상태
- `filters`
  - 현재 화면의 검색 조건 모델

지금 단계에서는 실제 검색 API 호출이 없으므로,
이 상태는 **UI 바인딩용**입니다.

즉 현재는:

- 필드가 보이고
- 값이 바인딩되고
- 레이아웃이 유지되지만
- 실제 검색 로직은 아직 없음

---

## 7. 화면 구현 패턴

문서 화면 대부분은 아래 순서로 작성되었습니다.

```vue
<template>
  <div class="fade-in space-y-5">
    <DocumentPageHeader />
    <FilterToolbarCard />
    <CollapsibleFilterCard>
      <FormField />
      <DateField />
      <SearchTriggerField />
      <SearchableCombobox />
    </CollapsibleFilterCard>
    <BaseTable />
  </div>
</template>
```

이 패턴의 장점:

- 파일 구조가 비슷해서 새 화면 추가가 쉬움
- 공통 컴포넌트 수정 효과가 여러 화면에 동시에 반영됨
- 리뷰할 때 화면 간 차이를 빠르게 볼 수 있음

---

## 8. 화면별 차이는 어디서 관리하는가

공통 패턴이 같아도 화면별 차이는 각 페이지 파일에서 관리합니다.

예를 들면:

### 8.1 컬럼 차이

- PI: `PI번호`, `발행일`, `총액`
- PO: `PO번호`, `발행일`, `총액`
- CI: `CI번호`, `국가`
- PL: `PL번호`, `총중량(kg)`
- 출하지시서: `지시서번호`, `출하지시일`, `PO`
- 생산지시서: `지시서번호`, `생산지시일`, `PO`

즉 공통은 테이블 렌더링 방식이고,
실제 컬럼 정의는 각 화면의 `columns` 배열이 담당합니다.

### 8.2 필터 차이

예:

- 출하현황은 `출하요청일`, `출하번호`, `납기일`, `상태`
- 매출·수금 현황은 `발행일`, `수금일`, `국가`, `통화`, `상태`

즉 공통은 필터 카드 구조이고,
실제 필드 순서와 라벨은 각 화면 템플릿이 담당합니다.

---

## 9. 왜 라우트를 지금 연결했는가

문서 화면 작업에서 라우트 연결은 “기능 구현”처럼 보일 수 있습니다.

하지만 이번 문맥에서 라우트 연결은 기능 구현이 아니라 **화면 확인 수단**입니다.

현재 라우트 연결의 의미:

- `/pi`, `/po`, `/ci`, `/pl` 등으로 바로 진입 가능
- 사용자가 브라우저에서 화면을 확인할 수 있음

현재 라우트 연결이 아직 하지 않는 것:

- 버튼 클릭 후 상세 이동
- 작성 버튼 클릭 후 등록화면 이동
- 검색 조건 실제 반영
- 저장/삭제/수정 로직

즉, 라우트 연결은 UI 확인용이고, 비즈니스 기능 연결은 아직 아닙니다.

---

## 10. 이번 작업에서 해결한 실제 코드 문제

### 10.1 판매현황 합계 행 문제

문제:

- 합계가 테이블 마지막 행이 아니라 바깥 문장형 푸터처럼 보였음

원인:

- `BaseTable`의 footer 슬롯이 실제 `<tfoot>`이 아니라 바깥 `div`에 렌더링되고 있었음

해결:

- `BaseTable`에서 실제 `<tfoot>` 슬롯 지원 추가

### 10.2 상세검색 드롭다운 잘림

문제:

- `영업담당자`, `상태` 드롭다운 목록이 카드 밖으로 펼쳐지지 않음

원인:

- `CollapsibleFilterCard`에 `overflow-hidden`이 있었음

해결:

- `overflow-hidden` 제거

### 10.3 상세검색 하단 액션 영역 스타일 불일치

문제:

- 문서 화면과 현황 화면의 `초기화 / 검색` 영역 구분선이 달랐음

원인:

- 페이지별 클래스가 서로 다르게 남아 있었음

해결:

- 하단 액션 영역을 아래 패턴으로 맞춤

```html
mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3
```

---

## 11. 사용 기술

### 11.1 Vue 3 Composition API

사용 이유:

- 화면별 상태가 단순함
- `ref`, `computed`로 충분함
- 폼/토글/샘플 데이터 관리가 쉬움

### 11.2 Vue Router

사용 이유:

- 각 화면을 주소 단위로 확인할 수 있어야 함

### 11.3 Tailwind CSS

사용 이유:

- 기준 화면과 미세하게 맞추기 쉬움
- 반복 spacing/size 조절이 빠름
- 공통 컴포넌트와 화면 파일 모두 같은 방식으로 스타일 관리 가능

### 11.4 Slot 패턴

특히 많이 사용한 곳:

- `BaseButton` leading icon
- `BaseTable` cell slot / footer slot
- `DocumentPageHeader` actions slot

사용 이유:

- 공통 구조는 유지하고, 화면별 내용만 바꿀 수 있기 때문입니다.

---

## 12. 코드리뷰에서 봐야 할 포인트

### 12.1 공통 컴포넌트 책임이 적절한가

질문:

- `DocumentPageHeader`가 문서 화면 공통으로 보기 적절한가
- `FilterToolbarCard`가 너무 특정 화면에 종속되지는 않는가
- `CollapsibleFilterCard`가 다른 도메인에서도 재사용 가능한가

### 12.2 페이지가 공통 컴포넌트를 제대로 사용하고 있는가

질문:

- 같은 버튼을 직접 `<button>`으로 다시 만들지 않았는가
- 검색용 readonly 필드를 직접 만들지 않고 `SearchTriggerField`를 쓰고 있는가
- 상태 뱃지를 직접 span으로 만들지 않고 `StatusBadge`를 쓰고 있는가

### 12.3 공통 컴포넌트 수정의 파급효과를 봤는가

예:

- `BaseTable` 수정 시 판매현황 외 다른 화면 영향
- `CollapsibleFilterCard` 수정 시 모든 상세검색 카드 영향

### 12.4 현재 단계와 다음 단계가 섞이지 않았는가

현재 단계는 UI 중심입니다.

리뷰 시 아래가 들어가면 범위가 섞인 것입니다.

- 실제 API 호출
- 실제 검색 로직
- 삭제/저장 비즈니스 로직
- 상세 이동 로직

즉 지금은 “보이는 화면”이 기준이고,
“실제 동작”은 다음 단계입니다.

---

## 13. 지금 구현된 것 / 아직 안 된 것

### 구현된 것

- 문서 서비스 8개 화면 진입 가능
- 상단 헤더 공통화
- 검색바 공통화
- 상세검색 카드 공통화
- 목록 테이블 UI 구성
- 상태/컬럼/필드명 보정
- 판매현황 합계 행 구성
- 반응형 기본 대응

### 아직 안 된 것

- 실제 검색 조건 반영
- 작성/상세/수정/삭제 동작
- API / json-server 연동
- 인쇄/PDF 기능 연결
- 실제 모달 연동

---

## 14. 왜 AI에게 이렇게 지시했는가

이 부분도 코드 관점으로 정리하면 아래와 같습니다.

### 14.1 지시 원칙

- 기준 화면을 우선
- 공통이면 공통부터 수정
- 라우트는 화면 확인 목적까지 허용
- 기능 연결은 나중
- 커밋은 단계별 분리

### 14.2 이유

AI는 범위를 넓게 주면 아래를 한 번에 섞어버릴 가능성이 큽니다.

- UI
- 공통화
- 기능 연결
- 데이터 연동
- 리팩토링

그래서 이번 작업은 일부러 제약을 강하게 걸었습니다.

즉,

- 화면은 먼저 보이게 만들고
- 반복되는 패턴은 공통화하고
- 실제 동작은 다음 단계로 미루는 방식으로

AI가 잘하는 “반복 UI 작업 자동화”에 집중시킨 것입니다.

---

## 15. 한 줄 요약

이번 문서 서비스 작업은

**기준 화면을 그대로 따르면서, 반복되는 UI 패턴을 공통 컴포넌트로 흡수한 화면 구현 단계**

입니다.

코드리뷰 시 핵심은 두 가지입니다.

1. 공통화가 적절한가
2. 아직 UI 단계와 기능 단계가 섞이지 않았는가
