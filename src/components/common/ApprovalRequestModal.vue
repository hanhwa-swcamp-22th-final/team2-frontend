<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '결재 요청',
  },
  message: {
    type: String,
    default: '',
  },
  requestRows: {
    type: Array,
    default: () => [],
  },
  documentRows: {
    type: Array,
    default: () => [],
  },
  helperText: {
    type: String,
    default: '요청 후 문서는 결재 대기 상태로 등록됩니다.',
  },
  width: {
    type: String,
    default: 'max-w-3xl',
  },
  zIndex: {
    type: Number,
    default: 60,
  },
  confirmLabel: {
    type: String,
    default: '결재 요청',
  },
  cancelLabel: {
    type: String,
    default: '취소',
  },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <BaseModal
    :open="open"
    :title="title"
    :width="width"
    :z-index="zIndex"
    @close="emit('cancel')"
  >
    <div class="space-y-4 text-sm text-slate-600">
      <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p class="leading-6 text-slate-700">{{ message }}</p>
      </div>

      <div
        v-if="requestRows.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">결재 요청 정보</p>
        </div>
        <dl class="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
          <div
            v-for="(row, index) in requestRows"
            :key="`${row.label}-${index}`"
            class="rounded-md border border-slate-200 bg-white px-4 py-3"
            :class="row.fullWidth ? 'md:col-span-2' : ''"
          >
            <dt class="text-xs font-medium text-slate-500">{{ row.label }}</dt>
            <dd class="mt-2 break-words text-sm font-medium text-slate-800">{{ row.value }}</dd>
          </div>
        </dl>
      </div>

      <div
        v-if="documentRows.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">문서 요약</p>
        </div>
        <dl class="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
          <div
            v-for="(row, index) in documentRows"
            :key="`${row.label}-${index}`"
            class="rounded-md border px-4 py-3"
            :class="[
              row.fullWidth ? 'md:col-span-2' : '',
              row.emphasis ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white',
            ]"
          >
            <dt class="text-xs font-medium text-slate-500">{{ row.label }}</dt>
            <dd
              class="mt-2 break-words text-slate-800"
              :class="row.emphasis ? 'text-base font-bold' : 'text-sm font-medium'"
            >
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </div>

      <div
        v-if="helperText"
        class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"
      >
        {{ helperText }}
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('cancel')">{{ cancelLabel }}</BaseButton>
      <BaseButton @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
    </template>
  </BaseModal>
</template>
