<script setup>
defineProps({
  label: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  forId: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      :for="forId"
      class="block text-sm font-semibold text-slate-700"
    >
      {{ label }}
      <span v-if="required" class="ml-0.5 text-red-500">*</span>
    </label>

    <slot />

    <p
      v-if="error"
      class="text-xs font-medium text-red-500"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="text-xs text-slate-400"
    >
      {{ hint }}
    </p>
  </div>
</template>
