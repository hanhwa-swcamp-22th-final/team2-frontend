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
  block: {
    type: Boolean,
    default: false,
  },
})

const variantClasses = {
  primary: 'border-brand bg-brand text-white hover:bg-teal-700 focus-visible:ring-brand/30',
  secondary: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
  ghost: 'border-transparent bg-slate-100/70 text-slate-700 hover:bg-slate-200/80 focus-visible:ring-slate-300',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-200',
}

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-2xl border font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
  variantClasses[props.variant] || variantClasses.primary,
  sizeClasses[props.size] || sizeClasses.md,
  props.block ? 'w-full' : '',
].join(' '))
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="buttonClasses"
  >
    <slot name="leading" />
    <slot />
    <slot name="trailing" />
  </button>
</template>
