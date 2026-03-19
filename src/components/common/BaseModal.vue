<script setup>
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: 'max-w-2xl',
  },
  zIndex: {
    type: Number,
    default: 50,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

function closeModal() {
  emit('close')
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    closeModal()
  }
}
</script>

<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 flex items-center justify-center bg-slate-900/50 px-4 py-8"
      :style="{ zIndex: props.zIndex }"
      @click.self="handleBackdropClick"
    >
      <div
        class="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        :class="width"
      >
        <div class="flex flex-shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 class="text-lg font-bold text-ink">{{ title }}</h2>
            <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            @click="closeModal"
          >
            <span class="sr-only">닫기</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 0 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 1 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <slot />
        </div>

        <div v-if="$slots.footer" class="flex flex-shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>
