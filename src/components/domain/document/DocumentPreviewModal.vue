<script setup>
/**
 * DocumentPreviewModal.vue — 문서 미리보기 모달 (slot 기반 업그레이드)
 *
 * 기존: 단순 필드 나열 (label-value 카드)
 * 변경: slot 기반 → 각 페이지에서 문서별 템플릿 컴포넌트를 삽입 가능
 *
 * 하위 호환성 유지:
 *   - fields prop이 있으면 기존 방식(필드 카드)으로 렌더링
 *   - default slot이 있으면 slot 우선 (새 양식 템플릿 사용)
 */
import { computed, useSlots } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '문서 미리보기',
  },
  documentTitle: {
    type: String,
    default: '',
  },
  // 기존 하위 호환 — fields가 전달되면 레거시 모드로 동작
  fields: {
    type: Array,
    default: () => [],
  },
  previewBackground: {
    type: String,
    default: 'slate',
  },
})

const emit = defineEmits(['close', 'download'])

const slots = useSlots()

// slot이 있으면 새 양식 모드, 없으면 기존 필드 나열 모드
const useSlotMode = computed(() => Boolean(slots.default))
</script>

<template>
  <BaseModal
    :open="open"
    :title="title"
    width="max-w-4xl"
    @close="$emit('close')"
  >
    <!-- ── 새 양식 모드: slot에 문서 템플릿이 삽입됨 ── -->
    <template v-if="useSlotMode">
      <div
        class="doc-preview-container"
        :class="{ 'preview-white': previewBackground === 'white' }"
      >
        <slot />
      </div>
    </template>

    <!-- ── 레거시 모드: 기존 필드 카드 나열 (하위 호환) ── -->
    <template v-else>
      <div class="space-y-5">
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Document</div>
          <div class="mt-1 text-lg font-bold text-slate-900">{{ documentTitle || '-' }}</div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="field in fields"
            :key="field.label"
            class="rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div class="text-xs font-medium text-slate-400">{{ field.label }}</div>
            <div class="mt-1 text-sm font-semibold text-slate-800">{{ field.value || '-' }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 하단 버튼 영역 -->
    <template #footer>
      <BaseButton variant="secondary" @click="$emit('close')">닫기</BaseButton>
      <BaseButton variant="secondary" @click="$emit('download')">
        <template #leading>
          <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
        </template>
        PDF 다운로드
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
/* 미리보기 컨테이너 — 양식을 A4 비율로 표시. 스크롤 가능 */
.doc-preview-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.doc-preview-container.preview-white {
  background: #fff;
}
</style>
