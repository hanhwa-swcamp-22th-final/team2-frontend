<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'

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
  props.countries.map((c) => ({ label: `${c.nameKr} (${c.name})`, value: c.id })),
)

const portOptions = computed(() =>
  props.ports.map((p) => ({ label: p.name, value: p.id })),
)

const paymentTermsOptions = computed(() =>
  props.paymentTerms.map((p) => ({ label: `${p.code} (${p.description})`, value: p.id })),
)

const currencyOptions = computed(() =>
  props.currencies.map((c) => ({ label: `${c.code} (${c.symbol})`, value: c.id })),
)

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
    status: '활성',
    sealImage: null,
  }
}

watch(
  () => props.open,
  (isOpen) => {
    errors.value = {}
    if (isOpen && props.mode === 'edit' && props.client) {
      form.value = {
        code: props.client.code ?? '',
        name: props.client.name ?? '',
        nameKr: props.client.nameKr ?? '',
        countryId: props.client.countryId ?? null,
        city: props.client.city ?? '',
        portId: props.client.portId ?? null,
        address: props.client.address ?? '',
        tel: props.client.tel ?? '',
        email: props.client.email ?? '',
        paymentTermsId: props.client.paymentTermsId ?? null,
        currencyId: props.client.currencyId ?? null,
        manager: props.client.manager ?? '',
        status: props.client.status ?? '활성',
        sealImage: null,
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = getInitialForm()
    }
  },
)

function validate() {
  const e = {}

  if (!form.value.code?.trim()) {
    e.code = '코드를 입력하세요.'
  } else if (props.mode === 'create') {
    const duplicate = props.allClients.some(
      (c) => c.code.toLowerCase() === form.value.code.trim().toLowerCase(),
    )
    if (duplicate) e.code = '이미 사용 중인 코드입니다.'
  }

  if (!form.value.name?.trim()) {
    e.name = '영문 거래처명을 입력하세요.'
  }

  if (!form.value.countryId) {
    e.countryId = '국가를 선택하세요.'
  }

  if (!form.value.tel?.trim()) {
    e.tel = '전화번호를 입력하세요.'
  }

  if (form.value.email?.trim()) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(form.value.email.trim())) {
      e.email = '올바른 이메일 형식을 입력하세요.'
    }
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function handleSave() {
  if (!validate()) return
  const payload = { ...form.value }
  delete payload.sealImage
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
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="코드" required>
          <BaseTextField v-model="form.code" placeholder="예) CL-011" />
          <p v-if="errors.code" class="mt-1 text-xs text-red-500">{{ errors.code }}</p>
        </FormField>

        <FormField label="영문 거래처명" required>
          <BaseTextField v-model="form.name" placeholder="영문 거래처명을 입력하세요" />
          <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
        </FormField>

        <FormField label="한글 거래처명">
          <BaseTextField v-model="form.nameKr" placeholder="한글 거래처명을 입력하세요" />
        </FormField>

        <FormField label="국가" required>
          <SearchableCombobox v-model="form.countryId" :options="countryOptions" placeholder="국가를 검색하세요" />
          <p v-if="errors.countryId" class="mt-1 text-xs text-red-500">{{ errors.countryId }}</p>
        </FormField>

        <FormField label="도시">
          <BaseTextField v-model="form.city" placeholder="도시를 입력하세요" />
        </FormField>

        <FormField label="도착항">
          <SearchableCombobox v-model="form.portId" :options="portOptions" placeholder="도착항을 검색하세요" />
        </FormField>

        <FormField label="주소">
          <BaseTextField v-model="form.address" placeholder="영문 주소를 입력하세요" />
        </FormField>

        <FormField label="담당자">
          <BaseTextField v-model="form.manager" placeholder="담당자명을 입력하세요" />
        </FormField>

        <FormField label="TEL" required>
          <BaseTextField v-model="form.tel" placeholder="전화번호를 입력하세요" />
          <p v-if="errors.tel" class="mt-1 text-xs text-red-500">{{ errors.tel }}</p>
        </FormField>

        <FormField label="Email">
          <BaseTextField v-model="form.email" type="email" placeholder="이메일을 입력하세요" />
          <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
        </FormField>

        <FormField label="결제조건">
          <BaseSelect v-model="form.paymentTermsId" :options="paymentTermsOptions" placeholder="결제조건을 선택하세요" />
        </FormField>

        <FormField label="통화">
          <BaseSelect v-model="form.currencyId" :options="currencyOptions" placeholder="통화를 선택하세요" />
        </FormField>

        <FormField label="상태">
          <BaseSelect
            v-model="form.status"
            :options="[{ label: '활성', value: '활성' }, { label: '비활성', value: '비활성' }]"
            placeholder="상태를 선택하세요"
          />
        </FormField>
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
