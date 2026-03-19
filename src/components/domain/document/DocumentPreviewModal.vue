<script setup>
import BaseModal from '@/components/common/BaseModal.vue'

defineProps({
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
  fields: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['close'])
</script>

<template>
  <BaseModal
    :open="open"
    :title="title"
    width="max-w-2xl"
    @close="$emit('close')"
  >
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
  </BaseModal>
</template>
