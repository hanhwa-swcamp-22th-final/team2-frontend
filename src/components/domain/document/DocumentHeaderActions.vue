<script setup>
import BaseButton from '@/components/common/BaseButton.vue'

defineProps({
  showPreview: {
    type: Boolean,
    default: true,
  },
  showPrint: {
    type: Boolean,
    default: true,
  },
  showPdf: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['edit', 'delete', 'preview', 'print', 'download'])
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <BaseButton variant="secondary" @click="$emit('edit')">수정</BaseButton>
    <BaseButton variant="danger" @click="$emit('delete')">삭제</BaseButton>
    <BaseButton v-if="showPreview" variant="ghost" @click="$emit('preview')">미리보기</BaseButton>
    <BaseButton v-if="showPrint" variant="ghost" @click="$emit('print')">인쇄</BaseButton>
    <BaseButton v-if="showPdf" variant="ghost" @click="$emit('download')">PDF 다운로드</BaseButton>
  </div>
</template>
