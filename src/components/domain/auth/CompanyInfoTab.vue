<script setup>
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'
import { fetchCompany, updateCompany } from '@/api/auth'
import { isValidEmail } from '@/utils/validators'

const { success, error, warning } = useToast()


// 백엔드 Company 엔티티 필드명 그대로 (companyName / companyAddressEn / companyAddressKr /
// companyTel / companyFax / companyEmail / companyWebsite / companySealImageUrl).
// 한글/영문 회사명 분리 컬럼 없음 — 단일 companyName 필드.
const form = ref({
  companyName: '',
  companyAddressEn: '',
  companyAddressKr: '',
  companyTel: '',
  companyFax: '',
  companyEmail: '',
  companyWebsite: '',
  companySealImageUrl: '',
  sealImage: null,
})
const errors = ref({})
const loading = ref(false)
const saving = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const data = await fetchCompany()
    form.value = {
      companyName: data.companyName ?? '',
      companyAddressEn: data.companyAddressEn ?? '',
      companyAddressKr: data.companyAddressKr ?? '',
      companyTel: data.companyTel ?? '',
      companyFax: data.companyFax ?? '',
      companyEmail: data.companyEmail ?? '',
      companyWebsite: data.companyWebsite ?? '',
      companySealImageUrl: data.companySealImageUrl ?? '',
      sealImage: null,
    }
  } catch (e) {
    error('자사 정보를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
})

function validate() {
  const e = {}
  if (!form.value.companyName.trim()) {
    e.companyName = '회사명을 입력해주세요.'
  }
  if (form.value.companyEmail && !isValidEmail(form.value.companyEmail)) {
    e.companyEmail = '올바른 이메일 형식을 입력해주세요.'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSave() {
  if (!validate()) {
    warning('입력 내용을 확인해주세요.')
    return
  }
  saving.value = true
  try {
    // 백엔드 UpdateCompanyRequest 는 prefix 없는 필드명 사용 (name/addressEn/... ).
    const payload = {
      name: form.value.companyName.trim(),
      addressEn: form.value.companyAddressEn.trim(),
      addressKr: form.value.companyAddressKr.trim(),
      tel: form.value.companyTel.trim(),
      fax: form.value.companyFax.trim(),
      email: form.value.companyEmail.trim(),
      website: form.value.companyWebsite.trim(),
      sealImageUrl: form.value.companySealImageUrl,
      // TODO: sealImage 파일 업로드는 백엔드 연동 시 구현
    }
    await updateCompany(payload)
    success('자사 정보가 저장되었습니다.')
  } catch (e) {
    error('저장 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 소제목 -->
    <div class="flex items-center gap-2">
      <svg class="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 0 1 0-1.5h12.5a.75.75 0 0 1 0 1.5H16v13h.25a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75v-2.5a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 1-.75.75h-3.5a.75.75 0 0 1 0-1.5H4ZM7.25 6a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75h.5A.75.75 0 0 0 8.5 7.25v-.5A.75.75 0 0 0 7.75 6h-.5ZM7.25 9a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75v-.5A.75.75 0 0 0 7.75 9h-.5ZM11.5 6.75A.75.75 0 0 1 12.25 6h.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-.5ZM12.25 9a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75v-.5a.75.75 0 0 0-.75-.75h-.5Z" clip-rule="evenodd" />
      </svg>
      <h3 class="text-base font-bold text-ink">자사 정보 관리</h3>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="py-12 text-center text-sm text-slate-400">
      불러오는 중...
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleSave">
      <!-- 1열: 회사명 -->
      <FormField label="회사명" required :error="errors.companyName">
        <BaseTextField v-model="form.companyName" placeholder="회사명" />
      </FormField>

      <!-- 2열: 주소 영문 / 한글 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="영문 주소">
          <BaseTextField v-model="form.companyAddressEn" placeholder="영문 주소" />
        </FormField>
        <FormField label="한글 주소">
          <BaseTextField v-model="form.companyAddressKr" placeholder="한글 주소" />
        </FormField>
      </div>

      <!-- 2열: TEL / FAX -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="TEL">
          <BaseTextField v-model="form.companyTel" placeholder="전화번호" />
        </FormField>
        <FormField label="FAX">
          <BaseTextField v-model="form.companyFax" placeholder="팩스번호" />
        </FormField>
      </div>

      <!-- 2열: Email / Website -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Email" :error="errors.companyEmail">
          <BaseTextField v-model="form.companyEmail" type="email" placeholder="이메일 주소" />
        </FormField>
        <FormField label="Website">
          <BaseTextField v-model="form.companyWebsite" placeholder="https://example.com" />
        </FormField>
      </div>

      <!-- 회사 도장 이미지 -->
      <div class="space-y-3">
        <img
          v-if="form.companySealImageUrl && !form.sealImage"
          :src="form.companySealImageUrl"
          alt="현재 등록된 도장 이미지"
          class="h-20 w-20 rounded-lg border border-slate-200 object-contain"
        />
        <FileUploadField
          v-model="form.sealImage"
          label="회사 도장 이미지"
          accept="image/*"
          helper-text="회사 도장 이미지를 업로드하세요. (PNG, JPG 권장)"
        />
        <div class="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
          도장 이미지는 PDF 문서 생성 시 자동으로 삽입됩니다. 배경이 투명한 PNG 파일을 권장합니다.
        </div>
      </div>

      <!-- 저장 버튼 -->
      <div class="flex justify-end">
        <BaseButton variant="primary" type="submit" :disabled="saving">
          {{ saving ? '저장 중...' : '저장' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
