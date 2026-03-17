<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative">
    <input
      :value="modelValue"
      type="date"
      :disabled="disabled"
      class="h-11 w-full rounded-2xl border border-white/70 bg-white/90 px-4 pr-10 text-sm text-ink shadow-sm transition duration-200 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M6 2.75A.75.75 0 0 1 6.75 2h6.5a.75.75 0 0 1 .75.75V4h1.25A1.75 1.75 0 0 1 17 5.75v8.5A1.75 1.75 0 0 1 15.25 16h-10.5A1.75 1.75 0 0 1 3 14.25v-8.5A1.75 1.75 0 0 1 4.75 4H6V2.75ZM4.5 8v6.25c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V8h-11Z"
          clip-rule="evenodd"
        />
      </svg>
    </span>
  </div>
</template>
