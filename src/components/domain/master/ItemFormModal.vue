<script setup>
import { ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FormField from '@/components/common/FormField.vue'
import { MAX_LEN, NUM_RANGE } from '@/utils/validators'

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
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

function generateNextCode() {
  const codes = props.allItems.map((i) => i.itemCode ?? i.code)
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
    status: 'active',
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
      const specFallback = parseSpec(props.item.itemSpec ?? props.item.spec)
      form.value = {
        code: props.item.itemCode ?? props.item.code ?? '',
        name: props.item.itemName ?? props.item.name ?? '',
        nameKr: props.item.itemNameKr ?? props.item.nameKr ?? '',
        category: props.item.itemCategory ?? props.item.category ?? '',
        specWidth: props.item.itemWidth ?? specFallback.width,
        specDepth: props.item.itemDepth ?? specFallback.depth,
        specHeight: props.item.itemHeight ?? specFallback.height,
        unit: props.item.itemUnit ?? props.item.unit ?? '',
        packUnit: props.item.itemPackUnit ?? props.item.packUnit ?? '',
        unitPrice: props.item.itemUnitPrice ?? props.item.unitPrice ?? '',
        weight: props.item.itemWeight ?? props.item.weight ?? '',
        hsCode: props.item.itemHsCode ?? props.item.hsCode ?? '',
        status: props.item.itemStatus ?? props.item.status ?? 'active',
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = getInitialForm()
      // 코드는 백엔드 auto-generate
    }
  },
)

function validate() {
  const e = {}

  // 코드는 백엔드 auto-generate (create 모드), 수정 모드는 disabled

  if (!form.value.name?.trim()) {
    e.name = '품목명을 입력하세요.'
  } else if (form.value.name.length > MAX_LEN.NAME) {
    e.name = `품목명은 ${MAX_LEN.NAME}자 이내로 입력하세요.`
  }

  if (!form.value.unit) {
    e.unit = '단위를 선택하세요.'
  }

  if (!form.value.packUnit) {
    e.packUnit = '포장단위를 선택하세요.'
  }

  if (form.value.unitPrice === '' || form.value.unitPrice === null || form.value.unitPrice === undefined) {
    e.unitPrice = '단가를 입력하세요.'
  } else {
    const price = Number(form.value.unitPrice)
    if (Number.isNaN(price) || price <= 0) {
      e.unitPrice = '단가는 유효한 양수를 입력하세요.'
    } else if (price > NUM_RANGE.UNIT_PRICE_MAX) {
      e.unitPrice = `단가는 ${NUM_RANGE.UNIT_PRICE_MAX.toLocaleString()} 이하로 입력하세요.`
    }
  }

  if (form.value.weight !== '' && form.value.weight !== null && form.value.weight !== undefined) {
    const w = Number(form.value.weight)
    if (Number.isNaN(w) || w < 0) {
      e.weight = '중량은 0 이상의 유효한 숫자를 입력하세요.'
    } else if (w > NUM_RANGE.WEIGHT_MAX) {
      e.weight = `중량은 ${NUM_RANGE.WEIGHT_MAX.toLocaleString()}kg 이하로 입력하세요.`
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
    if (val === '' || val === null || val === undefined) {
      e[key] = `${label}를 입력하세요.`
      continue
    }
    const num = Number(val)
    if (Number.isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      e[key] = `${label}는 양의 정수를 입력하세요.`
    } else if (num > NUM_RANGE.DIMENSION_MAX) {
      e[key] = `${label}는 ${NUM_RANGE.DIMENSION_MAX.toLocaleString()}mm 이하로 입력하세요.`
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
    // 생성 시 code는 백엔드 auto-generate, 수정 시만 기존 code 유지
    ...(props.mode === 'edit' ? { itemCode: form.value.code } : {}),
    itemName: form.value.name,
    itemNameKr: form.value.nameKr,
    itemCategory: form.value.category,
    itemSpec: specStr,
    itemWidth: Number(form.value.specWidth),
    itemDepth: Number(form.value.specDepth),
    itemHeight: Number(form.value.specHeight),
    itemUnit: form.value.unit,
    itemPackUnit: form.value.packUnit,
    itemUnitPrice: Number(form.value.unitPrice),
    itemWeight: form.value.weight !== '' ? Number(form.value.weight) : null,
    itemHsCode: form.value.hsCode,
    itemStatus: form.value.status,
  }

  emit('save', payload)
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? '품목 등록' : `품목 수정 – ${item?.itemName ?? item?.name ?? ''}`"
    width="max-w-2xl"
    @close="emit('close')"
  >
    <form class="space-y-6" @submit.prevent="handleSave">
      <!-- 기본 정보 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">기본 정보</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField v-if="mode === 'edit'" label="코드">
            <BaseTextField v-model="form.code" disabled />
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
        </div>
      </div>

      <!-- 규격 / 단위 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">규격 / 단위</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="규격 (W × D × H)" required class="md:col-span-2">
            <div class="flex items-center gap-2">
              <BaseTextField v-model="form.specWidth" type="number" placeholder="W" min="1" :max="NUM_RANGE.DIMENSION_MAX" inputmode="numeric" />
              <span class="text-xs text-slate-400">×</span>
              <BaseTextField v-model="form.specDepth" type="number" placeholder="D" min="1" :max="NUM_RANGE.DIMENSION_MAX" inputmode="numeric" />
              <span class="text-xs text-slate-400">×</span>
              <BaseTextField v-model="form.specHeight" type="number" placeholder="H" min="1" :max="NUM_RANGE.DIMENSION_MAX" inputmode="numeric" />
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
          <FormField label="포장단위" required>
            <BaseSelect v-model="form.packUnit" :options="packUnitOptions" placeholder="포장단위를 선택하세요" />
            <p v-if="errors.packUnit" class="mt-1 text-xs text-red-500">{{ errors.packUnit }}</p>
          </FormField>
        </div>
      </div>

      <!-- 가격 / 기타 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">가격 / 기타</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <!-- 상태 필드는 UI 에서 숨김 — 신규 = active, 삭제 버튼이 soft-delete(inactive) 담당.
               ADMIN 이 재활성화 필요하면 별도 REST API (PATCH /api/items/{id}/status) 호출. -->
        </div>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" :disabled="saving" @click="handleSave">{{ saving ? '저장 중...' : '저장' }}</BaseButton>
    </template>
  </BaseModal>
</template>
