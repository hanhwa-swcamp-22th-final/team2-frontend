<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'

defineProps({
  keyword: {
    type: String,
    default: '',
  },
  typeValue: {
    type: [String, Number],
    default: '',
  },
  dateFrom: {
    type: String,
    default: '',
  },
  dateTo: {
    type: String,
    default: '',
  },
  typeOptions: {
    type: Array,
    default: () => [],
  },
})

defineEmits([
  'update:keyword',
  'update:typeValue',
  'update:dateFrom',
  'update:dateTo',
  'reset',
  'search',
])
</script>

<template>
  <BaseCard title="조회 조건" subtitle="유형, 기간, 키워드 기준으로 활동 내역을 필터링합니다.">
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-600">유형</p>
        <BaseSelect
          :model-value="typeValue"
          :options="typeOptions"
          placeholder="유형 선택"
          @update:model-value="$emit('update:typeValue', $event)"
        />
      </div>
      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-600">시작일</p>
        <BaseTextField
          :model-value="dateFrom"
          type="date"
          @update:model-value="$emit('update:dateFrom', $event)"
        />
      </div>
      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-600">종료일</p>
        <BaseTextField
          :model-value="dateTo"
          type="date"
          @update:model-value="$emit('update:dateTo', $event)"
        />
      </div>
      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-600">키워드</p>
        <BaseTextField
          :model-value="keyword"
          placeholder="제목, 거래처, 작성자 검색"
          @update:model-value="$emit('update:keyword', $event)"
        />
      </div>
    </div>
    <div class="mt-4 flex justify-end gap-3">
      <BaseButton variant="secondary" @click="$emit('reset')">초기화</BaseButton>
      <BaseButton @click="$emit('search')">검색</BaseButton>
    </div>
  </BaseCard>
</template>
