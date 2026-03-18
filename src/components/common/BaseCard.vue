<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  bodyClass: {
    type: String,
    default: '',
  },
})

const slots = useSlots()

const hasHeader = computed(() => (
  Boolean(props.title)
  || Boolean(props.subtitle)
  || Boolean(slots.title)
  || Boolean(slots['header-actions'])
))
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div v-if="hasHeader" class="mb-4 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <slot name="title">
          <p v-if="title" class="text-sm font-semibold text-slate-800">{{ title }}</p>
        </slot>
        <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
      </div>
      <slot name="header-actions" />
    </div>
    <div :class="bodyClass">
      <slot />
    </div>
  </section>
</template>
