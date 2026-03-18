# Troubleshooting

## 1. Vite / Vue 슬롯 에러

### 증상

개발 서버 실행 중 아래와 같은 에러가 발생할 수 있습니다.

```text
Internal server error: Extraneous children found when component already has explicitly named default slot.
```

예시 위치:

- `src/views/DashboardPage.vue`
- `BaseCard` 같은 공통 컴포넌트 사용 구간

### 원인

Vue 컴포넌트 내부에서 `named slot`을 사용한 상태로 일반 children을 함께 넣었거나,
이전 충돌 해결 과정에서 `template #default`, `v-slot:default`, 불필요한 슬롯 흔적이 남아 있을 때 발생합니다.

즉 아래 상황이 겹치면 에러가 납니다.

- 같은 컴포넌트 안에 명시적 default slot이 있음
- 동시에 일반 자식 요소(`<div>...</div>`)도 함께 들어감

### 확인 방법

1. 에러가 난 `.vue` 파일을 열어 `template #default`, `v-slot:default`, `#default`가 남아 있는지 확인
2. 충돌 마커가 남아 있는지 확인

```bash
rg -n "#default|v-slot:default|<template #default|<<<<<<<|=======|>>>>>>>" src/views src/components -S
```

3. 해당 컴포넌트 사용부에서 불필요한 `<template #default />` 또는 슬롯 블록이 없는지 확인

### 해결 방법

- 불필요한 default slot 선언 제거
- 충돌 마커 제거
- 일반 children만 사용할 경우 기본 슬롯만 유지

예:

```vue
<BaseCard title="결재 / 요청 목록">
  <div class="space-y-3">
    ...
  </div>
</BaseCard>
```

### 재확인

```bash
npm run build
```

---

## 2. Vite proxy / json-server 연결 에러

### 증상

개발 서버 실행 중 아래와 같은 에러가 발생할 수 있습니다.

```text
[vite] http proxy error: /navigationItems
AggregateError [ECONNREFUSED]
```

또는:

```text
[vite] http proxy error: /dashboardKpis
AggregateError [ECONNREFUSED]
```

### 원인

Vite 개발 서버는 `/api` 요청을 `json-server`로 프록시하도록 설정되어 있습니다.
하지만 `json-server`가 실행 중이지 않으면 프록시 대상이 없어서 연결이 거부됩니다.

즉 아래 둘 중 하나입니다.

- `json-server`가 꺼져 있음
- 다른 포트 충돌로 정상 실행되지 않음

### 확인 방법

1. 현재 위치가 `team2-frontend`인지 확인

```bash
pwd
```

2. `json-server` 실행

```bash
npm run api
```

3. 3001 포트 응답 확인

```bash
curl http://127.0.0.1:3001/navigationItems
curl http://127.0.0.1:3001/dashboardKpis
```

4. 이미 포트를 쓰는 프로세스가 있는지 확인

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN
```

### 해결 방법

#### 방법 1. json-server 실행

```bash
cd team2-frontend
npm run api
```

별도 터미널에서 프론트 실행:

```bash
cd team2-frontend
npm run dev
```

#### 방법 2. 포트 충돌 정리

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN
kill -9 <PID>
npm run api
```

### 재확인

브라우저 또는 curl로 확인:

```bash
curl http://127.0.0.1:3001/navigationItems
curl http://127.0.0.1:3000/api/navigationItems
```

---

## 3. 작업 시 권장 순서

대시보드/문서 화면 작업 시 아래 순서를 권장합니다.

1. `npm run api`
2. `npm run dev`
3. UI 수정
4. `npm run build`
5. 에러 발생 시 슬롯 구조와 프록시 연결 상태를 우선 확인

---

## 4. 상세검색 드롭다운 목록 잘림

### 증상

문서/현황 화면 상세검색에서 `영업담당자`, `상태`, `국가` 같은 드롭다운을 열었을 때
목록이 아래로 펼쳐지지 않고 잘려 보일 수 있습니다.

대표 위치:

- `src/views/documents/CollectionsPage.vue`
- `src/views/documents/ShipmentsPage.vue`
- `CollapsibleFilterCard`를 사용하는 상세검색 영역 전반

### 원인

드롭다운 컴포넌트 자체 문제가 아니라, 상세검색 카드 래퍼에 `overflow-hidden`이 걸려 있으면
아래로 펼쳐지는 목록이 부모 영역에 의해 잘립니다.

이번 케이스에서는 아래 공통 컴포넌트가 원인이었습니다.

- `src/components/common/CollapsibleFilterCard.vue`

기존:

```vue
<BaseCard body-class="overflow-hidden p-0">
```

이 구조 때문에 `SearchableCombobox`의 옵션 목록이 카드 밖으로 나가지 못했습니다.

### 확인 방법

1. 드롭다운이 들어 있는 부모 컴포넌트에 `overflow-hidden`이 있는지 확인
2. 특히 `BaseCard`, `CollapsibleFilterCard`, `BaseModal` 같은 래퍼 컴포넌트의 `bodyClass`를 확인

```bash
rg -n "overflow-hidden" src/components src/views -S
```

### 해결 방법

드롭다운이 열리는 영역에서는 부모 래퍼의 `overflow-hidden`을 제거합니다.

수정 예:

```vue
<BaseCard body-class="p-0">
```

즉, 목록이 밖으로 펼쳐져야 하는 영역에서는 `overflow-hidden`을 기본으로 두면 안 됩니다.

### 재확인

1. 상세검색 열기
2. `영업담당자`, `상태`, `국가` 드롭다운 열기
3. 목록이 잘리지 않고 아래로 정상 표시되는지 확인

```bash
npm run build
```
