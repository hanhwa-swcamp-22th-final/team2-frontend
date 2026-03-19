<script setup>
/**
 * DocumentPrintLayout.vue — 문서 출력 공통 레이아웃
 *
 * 목적: A4 비율의 용지 컨테이너를 제공하고,
 *       @media print 시 사이드바/헤더를 숨기고 양식만 출력합니다.
 *
 * 왜 별도 컴포넌트로 분리하는가?
 *   → 모든 문서 템플릿(PI, PO, CI, PL, 지시서)이 동일한 A4 용지 프레임을 공유하므로
 *     중복 코드를 제거하고 일관성을 보장하기 위함입니다.
 */
defineProps({
  // 문서 제목 — 양식 최상단에 표시 (예: "PROFORMA INVOICE", "PURCHASE ORDER")
  title: {
    type: String,
    required: true,
  },
  // 문서 번호 — 제목 아래 부제로 표시 (예: "PI26001")
  documentId: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <!-- A4 용지 비율 컨테이너 — 인쇄 시 깔끔한 출력을 위해 max-width 제한 -->
  <div class="doc-print-layout">
    <!-- 문서 상단 헤더: 제목 + 문서번호 -->
    <div class="doc-header">
      <h1 class="doc-title">{{ title }}</h1>
    </div>

    <!-- 문서 본문 — 각 템플릿 컴포넌트가 이 slot에 들어갑니다 -->
    <div class="doc-content">
      <slot />

      <!-- 문서 하단 — 서명란 등 푸터 영역 -->
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
/* ── A4 용지 스타일 ── */
.doc-print-layout {
  max-width: 794px;          /* A4 가로 210mm ≈ 794px (96dpi 기준) */
  margin: 0 auto;
  padding: 38px 42px 44px;
  background: white;
  border: 1px solid #cbd5e1;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  font-family: 'Noto Sans KR', 'Arial', sans-serif;
  font-size: 12px;
  color: #0f172a;
  line-height: 1.6;
  box-sizing: border-box;
}

/* 문서 제목 영역 */
.doc-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 1.5px solid #0f172a;
}

.doc-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.28em;
  margin: 0;
  text-transform: uppercase;
}

.doc-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── 인쇄 전용 스타일 ── */
@media print {
  .doc-print-layout {
    padding: 18px 20px;
    max-width: none;
    border: 0;
    box-shadow: none;
  }
}
</style>
