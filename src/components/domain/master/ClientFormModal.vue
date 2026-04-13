<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import { isValidEmail, isValidTel, MAX_LEN } from '@/utils/validators'
import { getPhoneInfoByCountry, formatPhoneInput } from '@/utils/phoneFormat'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  client: { type: Object, default: null },
  countries: { type: Array, default: () => [] },
  ports: { type: Array, default: () => [] },
  currencies: { type: Array, default: () => [] },
  paymentTerms: { type: Array, default: () => [] },
  allClients: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const form = ref(getInitialForm())
const errors = ref({})

const countryOptions = computed(() =>
  props.countries.map((c) => ({ label: `${c.countryNameKr} (${c.countryName})`, value: c.countryId })),
)

const portOptions = computed(() => {
  if (!form.value.countryId) return []
  const cid = String(form.value.countryId)
  return props.ports
    .filter((p) => String(p.countryId) === cid)
    .map((p) => ({ label: p.portName, value: p.id }))
})

const paymentTermsOptions = computed(() =>
  props.paymentTerms.map((p) => ({ label: `${p.paymentTermCode} (${p.paymentTermDescription})`, value: p.paymentTermId })),
)

const currencyOptions = computed(() =>
  props.currencies.map((c) => ({ label: `${c.currencyCode} (${c.currencySymbol})`, value: c.currencyId })),
)

const statusOptions = [
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

const selectedCountryName = computed(() => {
  if (!form.value.countryId) return ''
  const c = props.countries.find((c) => c.countryId === form.value.countryId)
  return c?.countryName ?? ''
})

const phoneInfo = computed(() => getPhoneInfoByCountry(selectedCountryName.value))

function handleTelInput(event) {
  const raw = event.target.value
  if (phoneInfo.value.code) {
    form.value.tel = formatPhoneInput(raw, phoneInfo.value.code, phoneInfo.value.format)
  }
}

function generateNextCode() {
  const codes = props.allClients.map((c) => c.clientCode ?? c.code)
  let maxNum = 0
  for (const code of codes) {
    const match = code.match(/^CLI(\d+)$/)
    if (match) maxNum = Math.max(maxNum, Number(match[1]))
  }
  return `CLI${String(maxNum + 1).padStart(3, '0')}`
}

function getInitialForm() {
  return {
    code: '',
    name: '',
    nameKr: '',
    countryId: null,
    city: '',
    portId: null,
    address: '',
    tel: '',
    email: '',
    paymentTermsId: null,
    currencyId: null,
    manager: '',
    status: 'active',
    sealImage: null,
  }
}

watch(
  () => props.open,
  (isOpen) => {
    errors.value = {}
    if (isOpen && props.mode === 'edit' && props.client) {
      form.value = {
        code: props.client.clientCode ?? '',
        name: props.client.clientName ?? '',
        nameKr: props.client.clientNameKr ?? '',
        countryId: props.client.countryId ?? null,
        city: props.client.clientCity ?? '',
        portId: props.client.portId ?? null,
        address: props.client.clientAddress ?? '',
        tel: props.client.clientTel ?? '',
        email: props.client.clientEmail ?? '',
        paymentTermsId: props.client.paymentTermId ?? props.client.paymentTermsId ?? null,
        currencyId: props.client.currencyId ?? null,
        manager: props.client.clientManager ?? '',
        status: props.client.clientStatus ?? 'active',
        sealImage: null,
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = getInitialForm()
      form.value.code = generateNextCode()
    }
  },
)

watch(
  () => form.value.countryId,
  (newId, oldId) => {
    if (oldId == null || newId === oldId) return
    // 국가 변경 시 해당 국가에 속하지 않는 항구·통화 초기화
    const cid = String(newId)
    const portBelongs = props.ports.some((p) => String(p.countryId) === cid && String(p.id) === String(form.value.portId))
    if (!portBelongs) form.value.portId = null

    // 국가 변경 시 전화번호 prefix 자동 세팅
    const info = phoneInfo.value
    if (info.code && !form.value.tel) {
      form.value.tel = `${info.code} `
    }
  },
)

function validate() {
  const e = {}

  if (!form.value.code?.trim()) {
    e.code = '코드를 입력하세요.'
  } else if (
    props.allClients.some(
      (c) => c.clientCode.toLowerCase() === form.value.code.trim().toLowerCase() && (c.clientId ?? c.id) !== (props.client?.clientId ?? props.client?.id),
    )
  ) {
    e.code = '이미 사용 중인 코드입니다.'
  }

  if (!form.value.name?.trim()) {
    e.name = '영문 거래처명을 입력하세요.'
  } else if (form.value.name.length > MAX_LEN.NAME) {
    e.name = `거래처명은 ${MAX_LEN.NAME}자 이내로 입력하세요.`
  }

  if (form.value.nameKr && form.value.nameKr.length > MAX_LEN.NAME_KR) {
    e.nameKr = `한글 거래처명은 ${MAX_LEN.NAME_KR}자 이내로 입력하세요.`
  }

  if (!form.value.countryId) {
    e.countryId = '국가를 선택하세요.'
  }

  if (!form.value.tel?.trim()) {
    e.tel = '전화번호를 입력하세요.'
  } else if (!isValidTel(form.value.tel)) {
    e.tel = '올바른 전화번호 형식을 입력하세요. (예: +82 02-1234-5678)'
  }

  if (form.value.email?.trim()) {
    if (!isValidEmail(form.value.email)) {
      e.email = '올바른 이메일 형식을 입력하세요.'
    }
  }

  if (form.value.address && form.value.address.length > MAX_LEN.ADDRESS) {
    e.address = `주소는 ${MAX_LEN.ADDRESS}자 이내로 입력하세요.`
  }

  if (form.value.manager && form.value.manager.length > MAX_LEN.MANAGER) {
    e.manager = `담당자명은 ${MAX_LEN.MANAGER}자 이내로 입력하세요.`
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function handleSave() {
  if (!validate()) return
  const payload = {
    clientCode: form.value.code,
    clientName: form.value.name,
    clientNameKr: form.value.nameKr,
    countryId: form.value.countryId,
    clientCity: form.value.city,
    portId: form.value.portId,
    clientAddress: form.value.address,
    clientTel: form.value.tel,
    clientEmail: form.value.email,
    paymentTermId: form.value.paymentTermsId,
    currencyId: form.value.currencyId,
    clientManager: form.value.manager,
  }
  emit('save', payload)
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? '거래처 등록' : `거래처 수정 – ${client?.name ?? ''}`"
    width="max-w-3xl"
    @close="emit('close')"
  >
    <form class="space-y-6" @submit.prevent="handleSave">
      <!-- 기본 정보 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">기본 정보</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="코드" required>
            <BaseTextField v-model="form.code" placeholder="예) CLI011" :disabled="mode === 'edit'" />
            <p v-if="errors.code" class="mt-1 text-xs text-red-500">{{ errors.code }}</p>
          </FormField>
          <FormField label="영문 거래처명" required>
            <BaseTextField v-model="form.name" placeholder="영문 거래처명을 입력하세요" />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
          </FormField>
          <FormField label="한글 거래처명">
            <BaseTextField v-model="form.nameKr" placeholder="한글 거래처명을 입력하세요" />
          </FormField>
        </div>
      </div>

      <!-- 위치 정보 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">위치 정보</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="국가" required>
            <SearchableCombobox v-model="form.countryId" :options="countryOptions" placeholder="국가를 검색하세요" />
            <p v-if="errors.countryId" class="mt-1 text-xs text-red-500">{{ errors.countryId }}</p>
          </FormField>
          <FormField label="도시">
            <BaseTextField v-model="form.city" placeholder="도시를 입력하세요" />
          </FormField>
          <FormField label="도착항">
            <SearchableCombobox v-model="form.portId" :options="portOptions" :disabled="!form.countryId" :placeholder="form.countryId ? '도착항을 검색하세요' : '국가를 먼저 선택하세요'" />
          </FormField>
          <FormField label="주소">
            <BaseTextField v-model="form.address" placeholder="영문 주소를 입력하세요" />
          </FormField>
        </div>
      </div>

      <!-- 연락처 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">연락처</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="담당자">
            <BaseTextField v-model="form.manager" placeholder="담당자명을 입력하세요" />
          </FormField>
          <FormField label="TEL" required>
            <BaseTextField
              v-model="form.tel"
              :placeholder="phoneInfo.placeholder"
              :maxlength="MAX_LEN.TEL"
              @input="handleTelInput"
            />
            <p v-if="errors.tel" class="mt-1 text-xs text-red-500">{{ errors.tel }}</p>
          </FormField>
          <FormField label="Email">
            <BaseTextField v-model="form.email" type="email" placeholder="이메일을 입력하세요" />
            <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
          </FormField>
        </div>
      </div>

      <!-- 거래 조건 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">거래 조건</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="결제조건">
            <BaseSelect v-model="form.paymentTermsId" :options="paymentTermsOptions" placeholder="결제조건을 선택하세요" />
          </FormField>
          <FormField label="통화">
            <BaseSelect v-model="form.currencyId" :options="currencyOptions" :disabled="!form.countryId" :placeholder="form.countryId ? '통화를 선택하세요' : '국가를 먼저 선택하세요'" />
          </FormField>
          <FormField label="상태">
            <BaseSelect v-model="form.status" :options="statusOptions" placeholder="상태를 선택하세요" />
          </FormField>
        </div>
      </div>

      <FileUploadField
        v-model="form.sealImage"
        label="거래처 도장 이미지"
        accept="image/*"
        helper-text="거래처 도장 이미지를 업로드하세요. (PNG, JPG 권장)"
      />
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" :disabled="saving" @click="handleSave">{{ saving ? '저장 중...' : '저장' }}</BaseButton>
    </template>
  </BaseModal>
</template>
