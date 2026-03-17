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
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm"
      @click.self="handleBackdropClick"
    >
      <div
        class="w-full rounded-[28px] border border-white/70 bg-white p-6 shadow-panel"
        :class="width"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-ink">{{ title }}</h2>
            <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
          </div>
          <button
            type="button"
            class="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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

        <div class="mt-6">
          <slot />
        </div>

        <div v-if="$slots.footer" class="mt-6 flex justify-end gap-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>
