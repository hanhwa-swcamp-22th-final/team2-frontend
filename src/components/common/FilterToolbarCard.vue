<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  advancedOpen: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '검색어 입력...',
  },
})

const emit = defineEmits(['update:modelValue', 'toggleAdvanced'])
</script>

<template>
  <BaseCard body-class="flex flex-wrap items-center justify-between gap-3">
    <div class="relative w-full sm:max-w-[320px]">
      <i class="fas fa-search absolute left-3 top-2.5 text-xs text-slate-400" aria-hidden="true"></i>
      <BaseTextField
        :model-value="modelValue"
        :placeholder="placeholder"
        class="pl-9"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>

    <BaseButton
      variant="secondary"
      size="sm"
      class="shrink-0"
      :class="advancedOpen ? 'border-brand-200 bg-slate-50 text-brand-600' : ''"
      @click="emit('toggleAdvanced')"
    >
      <template #leading>
        <i class="fas fa-sliders-h text-xs" aria-hidden="true"></i>
      </template>
      상세검색
    </BaseButton>
  </BaseCard>
</template>
