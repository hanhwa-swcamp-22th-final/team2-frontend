<script setup>
import { ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  item: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])
const { success } = useToast()

const form = ref(getInitialForm())

const unitOptions = [
  { label: 'EA', value: 'EA' },
  { label: 'KG', value: 'KG' },
  { label: 'MT', value: 'MT' },
  { label: 'SET', value: 'SET' },
]

const packUnitOptions = [
  { label: 'BUNDLE', value: 'BUNDLE' },
  { label: 'PALLET', value: 'PALLET' },
  { label: 'CASE', value: 'CASE' },
  { label: 'LOOSE', value: 'LOOSE' },
]

function getInitialForm() {
  return {
    name: '',
    nameKr: '',
    category: '',
    specWidth: '',
    specDepth: '',
    specHeight: '',
    unit: '',
    packUnit: '',
    unitPrice: '',
    weight: '',
    hsCode: '',
  }
}

function parseSpec(spec) {
  if (!spec) return { width: '', depth: '', height: '' }
  const parts = spec.replace(/mm/gi, '').split('×').map((s) => s.trim())
  return {
    width: parts[0] ?? '',
    depth: parts[1] ?? '',
    height: parts[2] ?? '',
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'edit' && props.item) {
    const spec = parseSpec(props.item.spec)
    form.value = {
      name: props.item.name ?? '',
      nameKr: props.item.nameKr ?? '',
      category: props.item.category ?? '',
      specWidth: spec.width,
      specDepth: spec.depth,
      specHeight: spec.height,
      unit: props.item.unit ?? '',
      packUnit: props.item.packUnit ?? '',
      unitPrice: props.item.unitPrice ?? '',
      weight: props.item.weight ?? '',
      hsCode: props.item.hsCode ?? '',
    }
  } else if (isOpen && props.mode === 'create') {
    form.value = getInitialForm()
  }
})

function handleSave() {
  const spec = [form.value.specWidth, form.value.specDepth, form.value.specHeight]
    .filter(Boolean)
    .join(' × ')
  const specStr = spec ? `${spec} mm` : ''

  success(props.mode === 'create' ? '품목이 등록되었습니다.' : '품목 정보가 수정되었습니다.')
  emit('save', { ...form.value, spec: specStr })
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? '품목 등록' : `품목 수정 – ${item?.name ?? ''}`"
    width="max-w-2xl"
    @close="emit('close')"
  >
    <form class="space-y-6" @submit.prevent="handleSave">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="품목명 (영문)" required>
          <BaseTextField v-model="form.name" placeholder="영문 품목명을 입력하세요" />
        </FormField>

        <FormField label="한글명">
          <BaseTextField v-model="form.nameKr" placeholder="한글 품목명을 입력하세요" />
        </FormField>

        <FormField label="카테고리">
          <BaseTextField v-model="form.category" placeholder="카테고리를 입력하세요" />
        </FormField>

        <FormField label="규격 (W × D × H)">
          <div class="flex items-center gap-2">
            <BaseTextField v-model="form.specWidth" placeholder="W" />
            <span class="text-xs text-slate-400">×</span>
            <BaseTextField v-model="form.specDepth" placeholder="D" />
            <span class="text-xs text-slate-400">×</span>
            <BaseTextField v-model="form.specHeight" placeholder="H" />
            <span class="text-xs text-slate-500">mm</span>
          </div>
        </FormField>

        <FormField label="단위">
          <BaseSelect v-model="form.unit" :options="unitOptions" placeholder="단위를 선택하세요" />
        </FormField>

        <FormField label="포장단위">
          <BaseSelect v-model="form.packUnit" :options="packUnitOptions" placeholder="포장단위를 선택하세요" />
        </FormField>

        <FormField label="단가 (KRW)">
          <BaseTextField v-model="form.unitPrice" type="number" placeholder="단가를 입력하세요" />
        </FormField>

        <FormField label="중량 (kg)">
          <BaseTextField v-model="form.weight" type="number" placeholder="중량을 입력하세요" />
        </FormField>

        <FormField label="HS Code" class="md:col-span-2">
          <BaseTextField v-model="form.hsCode" placeholder="HS Code를 입력하세요" />
        </FormField>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
