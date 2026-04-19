<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  size: {
    type: String,
    default: 'md',
  },
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  // 제출 중일 때 연타 방지 + 스피너 노출. :disabled 를 따로 묶지 않아도
  // loading=true 면 자동으로 비활성화됨.
  loading: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
})

const isDisabled = computed(() => props.disabled || props.loading)

const variantClasses = {
  primary: 'border-brand bg-brand text-white shadow-sm hover:border-brand-600 hover:bg-brand-600 focus-visible:ring-brand/30',
  secondary: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-slate-300',
  ghost: 'border-slate-100 bg-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-200 focus-visible:ring-slate-300',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-200',
}

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
  variantClasses[props.variant] || variantClasses.primary,
  sizeClasses[props.size] || sizeClasses.md,
  props.block ? 'w-full' : '',
].join(' '))
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :class="buttonClasses"
    :aria-busy="loading || null"
  >
    <span v-if="loading" class="inline-flex h-3.5 w-3.5 animate-spin items-center justify-center" aria-hidden="true">
      <i class="fas fa-spinner text-[11px]"></i>
    </span>
    <slot v-else name="leading" />
    <slot />
    <slot name="trailing" />
  </button>
</template>
