<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  modelValue: {
    type: [File, Object, String, null],
    default: null,
  },
  label: {
    type: String,
    default: '파일 업로드',
  },
  accept: {
    type: String,
    default: 'image/*',
  },
  helperText: {
    type: String,
    default: '파일을 선택하거나 드래그해 업로드할 수 있습니다.',
  },
})

const emit = defineEmits(['update:modelValue', 'remove'])

const objectUrl = ref('')

const fileName = computed(() => {
  if (!props.modelValue) {
    return ''
  }

  if (typeof props.modelValue === 'string') {
    return props.modelValue
  }

  return props.modelValue.name || ''
})

// File 첨부 시 즉시 미리보기. S3 연동 전 단계에서도 사용자에게 첨부 결과 확인 UX 제공.
// Blob URL 은 메모리 누수 방지를 위해 modelValue 변경/언마운트 시 명시적으로 revoke.
const previewUrl = computed(() => {
  if (!props.modelValue) return ''
  if (typeof props.modelValue === 'string') return props.modelValue
  if (props.modelValue instanceof File && props.modelValue.type.startsWith('image/')) {
    return objectUrl.value
  }
  return ''
})

const isImageField = computed(() => props.accept.includes('image'))

watch(
  () => props.modelValue,
  (newValue) => {
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value)
      objectUrl.value = ''
    }
    if (newValue instanceof File && newValue.type.startsWith('image/')) {
      objectUrl.value = URL.createObjectURL(newValue)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
  }
})

function handleChange(event) {
  const file = event.target.files?.[0] || null
  emit('update:modelValue', file)
}

function removeFile() {
  emit('update:modelValue', null)
  emit('remove')
}
</script>

<template>
  <div class="rounded-xl border border-dashed border-slate-300 bg-white p-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-sm font-semibold text-ink">{{ label }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ helperText }}</p>
        <p v-if="fileName" class="mt-2 text-sm font-medium text-brand">{{ fileName }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <label class="inline-flex cursor-pointer">
          <input type="file" class="hidden" :accept="accept" @change="handleChange" />
          <span class="inline-flex items-center justify-center rounded-lg border border-slate-500 bg-slate-500 px-4 py-2 text-sm font-medium text-white transition hover:border-brand-600 hover:bg-brand-600">
            파일 선택
          </span>
        </label>
        <BaseButton v-if="fileName" variant="secondary" @click="removeFile">삭제</BaseButton>
      </div>
    </div>
    <div v-if="isImageField && previewUrl" class="mt-4 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
      <img :src="previewUrl" :alt="label" class="max-h-40 max-w-full object-contain" />
    </div>
  </div>
</template>
