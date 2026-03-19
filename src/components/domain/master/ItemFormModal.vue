<script setup>
import { ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FormField from '@/components/common/FormField.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  item: { type: Object, default: null },
  allItems: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const form = ref(getInitialForm())
const errors = ref({})

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

const categoryOptions = [
  { label: 'Steel', value: 'Steel' },
  { label: 'Pipe', value: 'Pipe' },
  { label: 'Oil', value: 'Oil' },
  { label: 'Machinery', value: 'Machinery' },
]

const statusOptions = [
  { label: '활성', value: '활성' },
  { label: '비활성', value: '비활성' },
]

function generateNextCode() {
  const codes = props.allItems.map((i) => i.code)
  let maxNum = 0
  for (const code of codes) {
    const match = code.match(/^ITM(\d+)$/)
    if (match) maxNum = Math.max(maxNum, Number(match[1]))
  }
  return `ITM${String(maxNum + 1).padStart(3, '0')}`
}

function getInitialForm() {
  return {
    code: '',
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
    status: '활성',
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

watch(
  () => props.open,
  (isOpen) => {
    errors.value = {}
    if (isOpen && props.mode === 'edit' && props.item) {
      const spec = parseSpec(props.item.spec)
      form.value = {
        code: props.item.code ?? '',
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
        status: props.item.status ?? '활성',
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = getInitialForm()
      form.value.code = generateNextCode()
    }
  },
)

function validate() {
  const e = {}

  if (!form.value.code?.trim()) {
    e.code = '코드를 입력하세요.'
  } else if (props.mode === 'create') {
    const duplicate = props.allItems.some(
      (i) => i.code.toLowerCase() === form.value.code.trim().toLowerCase(),
    )
    if (duplicate) e.code = '이미 사용 중인 코드입니다.'
  }

  if (!form.value.name?.trim()) {
    e.name = '품목명을 입력하세요.'
  }

  if (!form.value.unit) {
    e.unit = '단위를 선택하세요.'
  }

  if (form.value.unitPrice === '' || form.value.unitPrice === null || form.value.unitPrice === undefined) {
    e.unitPrice = '단가를 입력하세요.'
  } else {
    const price = Number(form.value.unitPrice)
    if (Number.isNaN(price) || price <= 0) {
      e.unitPrice = '단가는 유효한 양수를 입력하세요.'
    }
  }

  if (form.value.weight !== '' && form.value.weight !== null && form.value.weight !== undefined) {
    const w = Number(form.value.weight)
    if (Number.isNaN(w) || w < 0) {
      e.weight = '중량은 0 이상의 유효한 숫자를 입력하세요.'
    }
  }

  if (form.value.hsCode?.trim() && !/^[\d.]+$/.test(form.value.hsCode.trim())) {
    e.hsCode = 'HS Code는 숫자와 점(.)만 입력 가능합니다.'
  }

  const dimFields = [
    { key: 'specWidth', label: '너비(W)' },
    { key: 'specDepth', label: '깊이(D)' },
    { key: 'specHeight', label: '높이(H)' },
  ]
  for (const { key, label } of dimFields) {
    const val = form.value[key]
    if (val !== '' && val !== null && val !== undefined) {
      const num = Number(val)
      if (Number.isNaN(num) || num <= 0) {
        e[key] = `${label}는 양수를 입력하세요.`
      }
    }
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function handleSave() {
  if (!validate()) return

  const spec = [form.value.specWidth, form.value.specDepth, form.value.specHeight]
    .filter(Boolean)
    .join(' × ')
  const specStr = spec ? `${spec} mm` : ''

  const payload = {
    code: form.value.code,
    name: form.value.name,
    nameKr: form.value.nameKr,
    category: form.value.category,
    spec: specStr,
    unit: form.value.unit,
    packUnit: form.value.packUnit,
    unitPrice: Number(form.value.unitPrice),
    weight: form.value.weight !== '' ? Number(form.value.weight) : null,
    hsCode: form.value.hsCode,
    status: form.value.status,
  }

  emit('save', payload)
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
        <FormField label="코드" required>
          <BaseTextField v-model="form.code" placeholder="예) ITM011" />
          <p v-if="errors.code" class="mt-1 text-xs text-red-500">{{ errors.code }}</p>
        </FormField>

        <FormField label="품목명 (영문)" required>
          <BaseTextField v-model="form.name" placeholder="영문 품목명을 입력하세요" />
          <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
        </FormField>

        <FormField label="한글명">
          <BaseTextField v-model="form.nameKr" placeholder="한글 품목명을 입력하세요" />
        </FormField>

        <FormField label="카테고리">
          <BaseSelect v-model="form.category" :options="categoryOptions" placeholder="카테고리를 선택하세요" />
        </FormField>

        <FormField label="규격 (W × D × H)" class="md:col-span-2">
          <div class="flex items-center gap-2">
            <BaseTextField v-model="form.specWidth" placeholder="W" />
            <span class="text-xs text-slate-400">×</span>
            <BaseTextField v-model="form.specDepth" placeholder="D" />
            <span class="text-xs text-slate-400">×</span>
            <BaseTextField v-model="form.specHeight" placeholder="H" />
            <span class="text-xs text-slate-500">mm</span>
          </div>
          <p v-if="errors.specWidth" class="mt-1 text-xs text-red-500">{{ errors.specWidth }}</p>
          <p v-if="errors.specDepth" class="mt-1 text-xs text-red-500">{{ errors.specDepth }}</p>
          <p v-if="errors.specHeight" class="mt-1 text-xs text-red-500">{{ errors.specHeight }}</p>
        </FormField>

        <FormField label="단위" required>
          <BaseSelect v-model="form.unit" :options="unitOptions" placeholder="단위를 선택하세요" />
          <p v-if="errors.unit" class="mt-1 text-xs text-red-500">{{ errors.unit }}</p>
        </FormField>

        <FormField label="포장단위">
          <BaseSelect v-model="form.packUnit" :options="packUnitOptions" placeholder="포장단위를 선택하세요" />
        </FormField>

        <FormField label="단가 (KRW)" required>
          <BaseTextField v-model="form.unitPrice" type="number" placeholder="단가를 입력하세요" />
          <p v-if="errors.unitPrice" class="mt-1 text-xs text-red-500">{{ errors.unitPrice }}</p>
        </FormField>

        <FormField label="중량 (kg)">
          <BaseTextField v-model="form.weight" type="number" placeholder="중량을 입력하세요" />
          <p v-if="errors.weight" class="mt-1 text-xs text-red-500">{{ errors.weight }}</p>
        </FormField>

        <FormField label="HS Code">
          <BaseTextField v-model="form.hsCode" placeholder="HS Code를 입력하세요" />
          <p v-if="errors.hsCode" class="mt-1 text-xs text-red-500">{{ errors.hsCode }}</p>
        </FormField>

        <FormField label="상태">
          <BaseSelect v-model="form.status" :options="statusOptions" placeholder="상태를 선택하세요" />
        </FormField>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" :disabled="saving" @click="handleSave">{{ saving ? '저장 중...' : '저장' }}</BaseButton>
    </template>
  </BaseModal>
</template>
