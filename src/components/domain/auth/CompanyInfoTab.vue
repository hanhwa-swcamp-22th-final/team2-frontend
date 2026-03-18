<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'

const { success } = useToast()

const form = ref({
  nameEn: 'HANWHA SYSTEMS Co., Ltd.',
  nameKr: '한화시스템(주)',
  addressEn: '188, Pangyoyeok-ro, Bundang-gu, Seongnam-si, Gyeonggi-do, Korea',
  tel: '+82-31-8000-0000',
  fax: '+82-31-8000-0001',
  email: 'export@hanwhasystems.com',
  sealImage: null,
})

function handleSave() {
  success('자사 정보가 저장되었습니다.')
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

    <form class="space-y-4" @submit.prevent="handleSave">
      <!-- 2열: 회사명 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="영문 회사명" required>
          <BaseTextField v-model="form.nameEn" placeholder="영문 회사명" />
        </FormField>
        <FormField label="한글 회사명">
          <BaseTextField v-model="form.nameKr" placeholder="한글 회사명" />
        </FormField>
      </div>

      <!-- 1열: 주소 -->
      <FormField label="영문 주소">
        <BaseTextField v-model="form.addressEn" placeholder="영문 주소를 입력하세요" />
      </FormField>

      <!-- 2열: TEL / FAX -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="TEL">
          <BaseTextField v-model="form.tel" placeholder="전화번호" />
        </FormField>
        <FormField label="FAX">
          <BaseTextField v-model="form.fax" placeholder="팩스번호" />
        </FormField>
      </div>

      <!-- 1열: Email -->
      <FormField label="Email">
        <BaseTextField v-model="form.email" type="email" placeholder="이메일 주소" />
      </FormField>

      <!-- 회사 도장 이미지 -->
      <div class="space-y-3">
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
        <BaseButton variant="primary" type="submit">저장</BaseButton>
      </div>
    </form>
  </div>
</template>
