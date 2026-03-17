<script setup>
import BaseCard from '@/components/common/BaseCard.vue'
import InfoField from '@/components/common/InfoField.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

defineProps({
  title: {
    type: String,
    default: '기본 정보',
  },
  fields: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <BaseCard :title="title" subtitle="문서 기본 정보 요약">
    <div class="grid gap-4 md:grid-cols-2">
      <InfoField
        v-for="field in fields"
        :key="field.label"
        :label="field.label"
        :value="field.value"
      >
        <StatusBadge
          v-if="field.type === 'status'"
          :value="field.value"
        />
        <template v-else>
          {{ field.value || '-' }}
        </template>
      </InfoField>
    </div>
  </BaseCard>
</template>
