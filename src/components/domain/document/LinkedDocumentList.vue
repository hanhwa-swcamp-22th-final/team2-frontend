<script setup>
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

defineProps({
  documents: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select'])
</script>

<template>
  <BaseCard title="연결 문서" subtitle="문서 간 연결 관계를 빠르게 확인하는 영역">
    <div v-if="documents.length" class="space-y-3">
      <button
        v-for="document in documents"
        :key="document.id || document.code"
        type="button"
        class="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-brand/30 hover:bg-brand/5"
        @click="$emit('select', document)"
      >
        <div>
          <p class="text-sm font-semibold text-ink">{{ document.code }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ document.label }}</p>
        </div>
        <StatusBadge :value="document.status" />
      </button>
    </div>
    <div v-else class="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
      연결된 문서가 없습니다.
    </div>
  </BaseCard>
</template>
