<script setup>
import { ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  client: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])
const { success } = useToast()

const form = ref(getInitialForm())

const countryOptions = [
  { label: 'USA', value: 'USA' },
  { label: 'Germany', value: 'Germany' },
  { label: 'Japan', value: 'Japan' },
  { label: 'China', value: 'China' },
  { label: 'UK', value: 'UK' },
  { label: 'France', value: 'France' },
  { label: 'India', value: 'India' },
  { label: 'Brazil', value: 'Brazil' },
  { label: 'Singapore', value: 'Singapore' },
  { label: 'Vietnam', value: 'Vietnam' },
]

const portOptions = [
  { label: 'Busan', value: 'Busan' },
  { label: 'Shanghai', value: 'Shanghai' },
  { label: 'Los Angeles', value: 'Los Angeles' },
  { label: 'Hamburg', value: 'Hamburg' },
  { label: 'Rotterdam', value: 'Rotterdam' },
  { label: 'Tokyo', value: 'Tokyo' },
  { label: 'Singapore', value: 'Singapore' },
  { label: 'Mumbai', value: 'Mumbai' },
  { label: 'Ho Chi Minh', value: 'Ho Chi Minh' },
  { label: 'Santos', value: 'Santos' },
]

const paymentTermsOptions = [
  { label: 'T/T (Telegraphic Transfer)', value: 'T/T' },
  { label: 'L/C (Letter of Credit)', value: 'L/C' },
  { label: 'D/P (Documents against Payment)', value: 'D/P' },
  { label: 'D/A (Documents against Acceptance)', value: 'D/A' },
  { label: 'CAD (Cash against Documents)', value: 'CAD' },
]

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'JPY', value: 'JPY' },
  { label: 'CNY', value: 'CNY' },
  { label: 'KRW', value: 'KRW' },
]

function getInitialForm() {
  return {
    name: '',
    nameKr: '',
    country: '',
    city: '',
    port: '',
    addressKr: '',
    address: '',
    businessNo: '',
    tel: '',
    email: '',
    paymentTerms: '',
    currency: '',
    sealImage: null,
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'edit' && props.client) {
    form.value = {
      name: props.client.name ?? '',
      nameKr: props.client.nameKr ?? '',
      country: props.client.country ?? '',
      city: props.client.city ?? '',
      port: props.client.port ?? '',
      addressKr: props.client.addressKr ?? '',
      address: props.client.address ?? '',
      businessNo: props.client.businessNo ?? '',
      tel: props.client.tel ?? '',
      email: props.client.email ?? '',
      paymentTerms: props.client.paymentTerms ?? '',
      currency: props.client.currency ?? '',
      sealImage: null,
    }
  } else if (isOpen && props.mode === 'create') {
    form.value = getInitialForm()
  }
})

function handleSave() {
  success(props.mode === 'create' ? '거래처가 등록되었습니다.' : '거래처 정보가 수정되었습니다.')
  emit('save', { ...form.value })
  emit('close')
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
        <FormField label="영문 거래처명" required>
          <BaseTextField v-model="form.name" placeholder="영문 거래처명을 입력하세요" />
        </FormField>

        <FormField label="한글 거래처명">
          <BaseTextField v-model="form.nameKr" placeholder="한글 거래처명을 입력하세요" />
        </FormField>

        <FormField label="국가" required>
          <SearchableCombobox v-model="form.country" :options="countryOptions" placeholder="국가를 검색하세요" />
        </FormField>

        <FormField label="도시">
          <BaseTextField v-model="form.city" placeholder="도시를 입력하세요" />
        </FormField>

        <FormField label="도착항" required>
          <SearchableCombobox v-model="form.port" :options="portOptions" placeholder="도착항을 검색하세요" />
        </FormField>

        <FormField label="사업자번호">
          <BaseTextField v-model="form.businessNo" placeholder="사업자번호를 입력하세요" />
        </FormField>

        <FormField label="한글 주소">
          <BaseTextField v-model="form.addressKr" placeholder="한글 주소를 입력하세요" />
        </FormField>

        <FormField label="영문 주소">
          <BaseTextField v-model="form.address" placeholder="영문 주소를 입력하세요" />
        </FormField>

        <FormField label="TEL">
          <BaseTextField v-model="form.tel" placeholder="전화번호를 입력하세요" />
        </FormField>

        <FormField label="Email">
          <BaseTextField v-model="form.email" type="email" placeholder="이메일을 입력하세요" />
        </FormField>

        <FormField label="결제조건" required>
          <BaseSelect v-model="form.paymentTerms" :options="paymentTermsOptions" placeholder="결제조건을 선택하세요" />
        </FormField>

        <FormField label="통화" required>
          <BaseSelect v-model="form.currency" :options="currencyOptions" placeholder="통화를 선택하세요" />
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
      <BaseButton variant="primary" @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
