<script setup>
defineProps({
  showEdit: {
    type: Boolean,
    default: true,
  },
  showDelete: {
    type: Boolean,
    default: true,
  },
  editLabel: {
    type: String,
    default: '수정',
  },
  deleteLabel: {
    type: String,
    default: '삭제',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="flex items-center justify-center gap-3">
    <button
      v-if="showEdit"
      type="button"
      class="text-xs transition"
      :class="disabled
        ? 'cursor-not-allowed text-slate-300'
        : 'text-brand-500 hover:text-brand-700'"
      :disabled="disabled"
      @click.stop="!disabled && $emit('edit')"
    >
      {{ editLabel }}
    </button>

    <button
      v-if="showDelete"
      type="button"
      class="text-xs transition"
      :class="disabled
        ? 'cursor-not-allowed text-slate-300'
        : 'text-slate-400 hover:text-red-500'"
      :disabled="disabled"
      @click.stop="!disabled && $emit('delete')"
    >
      {{ deleteLabel }}
    </button>

    <!-- 추가 액션 슬롯 (미리보기, 인쇄 등) -->
    <slot />
  </div>
</template>
