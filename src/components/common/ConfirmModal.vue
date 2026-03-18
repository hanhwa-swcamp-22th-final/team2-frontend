<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '확인',
  },
  message: {
    type: String,
    default: '',
  },
  detail: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: '확인',
  },
  cancelLabel: {
    type: String,
    default: '취소',
  },
  confirmVariant: {
    type: String,
    default: 'primary',
  },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <BaseModal
    :open="open"
    :title="title"
    width="max-w-sm"
    @close="emit('cancel')"
  >
    <div class="space-y-4 text-sm text-slate-600">
      <p class="leading-6 text-slate-700">{{ message }}</p>
      <div
        v-if="detail"
        class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800"
      >
        {{ detail }}
      </div>
      <p class="text-xs text-slate-400">이 작업은 되돌릴 수 없습니다.</p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('cancel')">{{ cancelLabel }}</BaseButton>
      <BaseButton :variant="confirmVariant" @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
    </template>
  </BaseModal>
</template>
