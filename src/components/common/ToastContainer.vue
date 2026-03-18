<script setup>
import { computed } from 'vue'
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const variantClasses = {
  success: 'border-teal-200 bg-teal-50 text-teal-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-brand-200 bg-brand-100 text-brand-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
}

function getVariantClass(type) {
  return variantClasses[type] || variantClasses.info
}

function getTitle(type) {
  if (type === 'success') return '완료'
  if (type === 'error') return '오류'
  if (type === 'warning') return '안내'
  return '알림'
}
</script>

<template>
  <teleport to="body">
    <div class="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto rounded-xl border px-4 py-3 shadow-lg"
          :class="getVariantClass(toast.type)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-bold">{{ toast.title || getTitle(toast.type) }}</p>
              <p class="mt-1 text-sm leading-6">{{ toast.message }}</p>
            </div>
            <button
              type="button"
              class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-current/60 transition hover:bg-white/50 hover:text-current"
              @click="removeToast(toast.id)"
            >
              <span class="sr-only">닫기</span>
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 0 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 1 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
