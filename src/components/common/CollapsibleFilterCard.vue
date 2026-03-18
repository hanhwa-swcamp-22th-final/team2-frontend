<script setup>
import BaseCard from '@/components/common/BaseCard.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '상세검색',
  },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <BaseCard body-class="p-0">
    <button
      type="button"
      class="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50"
      @click="emit('toggle')"
    >
      <span class="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <i class="fas fa-filter text-xs text-brand-500" aria-hidden="true"></i>
        {{ title }}
      </span>
      <i
        class="fas fa-chevron-up text-xs text-slate-400 transition-transform"
        :class="open ? '' : 'rotate-180'"
        aria-hidden="true"
      ></i>
    </button>

    <div v-if="open" class="border-t border-slate-100 px-5 pb-3 pt-3">
      <slot />
    </div>
  </BaseCard>
</template>
