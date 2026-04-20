<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { fetchContacts, createContact, updateContact, deleteContact } from '@/api/contacts'
import { applyPhoneMask } from '@/utils/phoneFormat'
import BaseButton from '@/components/common/BaseButton.vue'
import FormField from '@/components/common/FormField.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import InfoField from '@/components/common/InfoField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import TableActions from '@/components/common/TableActions.vue'

const { warning, error } = useToast()

// ── 데이터 ─────────────────────────────────────────────────
const contacts = ref([])

async function loadContacts() {
  const data = await fetchContacts()
  contacts.value = Array.isArray(data) ? data : []
}

onMounted(async () => {
  try {
    await loadContacts()
  } catch (e) {
    console.error('데이터 로드 실패', e)
    error('데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.')
  }
})

// ── 검색 (이름/이메일 부분일치) ───────────────────────────
const searchKeyword = ref('')
const filteredContacts = computed(() => {
  const q = searchKeyword.value.trim().toLowerCase()
  if (!q) return contacts.value
  return contacts.value.filter((c) =>
    (c.contactName ?? '').toLowerCase().includes(q) ||
    (c.contactEmail ?? '').toLowerCase().includes(q) ||
    (c.contactPosition ?? '').toLowerCase().includes(q) ||
    (c.contactTel ?? '').toLowerCase().includes(q),
  )
})

// ── 상세 모달 ──────────────────────────────────────────────
const selectedContact = ref(null)
const isDetailOpen = ref(false)

function openDetail(contact) {
  selectedContact.value = contact
  isDetailOpen.value = true
}

function closeDetail() {
  isDetailOpen.value = false
  selectedContact.value = null
}

// ── 등록/수정 모달 ─────────────────────────────────────────
const isFormOpen = ref(false)
const isEditMode = ref(false)
const editingId = ref(null)
const formName = ref('')
const formPosition = ref('')
const formEmail = ref('')
const formTel = ref('')
const formErrors = ref({})

function openCreate() {
  isEditMode.value = false
  editingId.value = null
  formName.value = ''
  formPosition.value = ''
  formEmail.value = ''
  formTel.value = ''
  formErrors.value = {}
  isFormOpen.value = true
}

function openEdit(contact) {
  isEditMode.value = true
  editingId.value = contact.contactId
  formName.value = contact.contactName ?? ''
  formPosition.value = contact.contactPosition ?? ''
  formEmail.value = contact.contactEmail ?? ''
  formTel.value = contact.contactTel ?? ''
  formErrors.value = {}
  isDetailOpen.value = false
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

function onContactTelInput(value) {
  // 숫자만 추출해서 하이픈 포맷 자동 적용. 길이에 따라 3-4-4 (한국 휴대) 또는
  // 유연하게 ###-####-#### 마스크로 채움. 국가번호는 컨택에 필드가 없어 생략.
  formTel.value = applyPhoneMask(value, '###-####-####')
}

function validate() {
  const e = {}
  if (!formName.value.trim()) e.contactName = '이름을 입력하세요.'
  if (formEmail.value.trim() && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formEmail.value.trim())) {
    e.contactEmail = '올바른 이메일 형식을 입력하세요.'
  }
  if (formTel.value.trim() && !/^\+?[\d\s()-]{7,20}$/.test(formTel.value.trim())) {
    e.contactTel = '올바른 전화번호 형식을 입력하세요.'
  }
  formErrors.value = e
  return Object.keys(e).length === 0
}

async function handleFormSubmit() {
  if (!validate()) {
    warning('입력 내용을 확인해주세요.')
    return
  }
  const payload = {
    contactName: formName.value.trim(),
    contactPosition: formPosition.value.trim(),
    contactEmail: formEmail.value.trim(),
    contactTel: formTel.value.trim(),
  }
  try {
    if (isEditMode.value) {
      await updateContact(editingId.value, payload)
    } else {
      await createContact(payload)
    }
    await loadContacts()
    closeForm()
  } catch (e) {
    console.error('연락처 저장 실패', e)
    error('저장에 실패했습니다. 다시 시도해주세요.')
  }
}

// ── 삭제 확인 모달 ─────────────────────────────────────────
const deleteTarget = ref(null)
const isDeleteOpen = ref(false)

function openDelete(contact) {
  deleteTarget.value = contact
  isDetailOpen.value = false
  isDeleteOpen.value = true
}

function closeDelete() {
  isDeleteOpen.value = false
  deleteTarget.value = null
}

async function handleDelete() {
  try {
    await deleteContact(deleteTarget.value.contactId)
    await loadContacts()
    closeDelete()
  } catch (e) {
    console.error('연락처 삭제 실패', e)
    error('삭제에 실패했습니다. 다시 시도해주세요.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <DocumentPageHeader title="컨택 리스트" icon-class="fas fa-address-book">
      <template #actions>
        <div class="w-64">
          <BaseTextField
            v-model="searchKeyword"
            placeholder="이름 · 이메일 · 직책 · 전화 검색"
          />
        </div>
        <BaseButton @click="openCreate">
          <template #leading>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </template>
          연락처 등록
        </BaseButton>
      </template>
    </DocumentPageHeader>

    <p class="text-xs text-slate-400">
      개인 인맥 자산 — 거래처 무관. 같은 팀의 거래처 바이어 등록 시 본인 컨택에 자동 추가됨.
    </p>

    <!-- 컨택 카드 그리드 -->
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="contact in filteredContacts"
        :key="contact.contactId"
        class="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
        @click="openDetail(contact)"
      >
        <div class="min-w-0 flex-1">
          <div class="mb-2">
            <p class="text-sm font-semibold text-slate-800">{{ contact.contactName }}</p>
            <p class="text-xs text-slate-500">{{ contact.contactPosition || '직책 미입력' }}</p>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-start gap-2 text-slate-600">
              <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
              </svg>
              <span class="break-all">{{ contact.contactEmail || '-' }}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600">
              <svg class="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clip-rule="evenodd" />
              </svg>
              <span>{{ contact.contactTel || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="ml-3 shrink-0" @click.stop>
          <TableActions @edit="openEdit(contact)" @delete="openDelete(contact)" />
        </div>
      </div>
    </div>

    <div
      v-if="filteredContacts.length === 0"
      class="py-16 text-center text-sm text-slate-400"
    >
      {{ searchKeyword ? '검색 결과가 없습니다.' : '등록된 연락처가 없습니다. 우측 상단 "연락처 등록" 버튼으로 추가하세요.' }}
    </div>

    <!-- 상세 모달 -->
    <BaseModal
      :open="isDetailOpen"
      :title="selectedContact?.contactName ?? '연락처 상세'"
      width="max-w-md"
      @close="closeDetail"
    >
      <div class="space-y-4">
        <div>
          <p class="text-lg font-bold text-slate-900">{{ selectedContact?.contactName }}</p>
          <p class="text-sm text-slate-500">{{ selectedContact?.contactPosition || '직책 미입력' }}</p>
        </div>
        <div class="space-y-3">
          <InfoField label="이메일" :value="selectedContact?.contactEmail || '-'" />
          <InfoField label="전화" :value="selectedContact?.contactTel || '-'" />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="closeDetail">닫기</BaseButton>
        <BaseButton @click="openEdit(selectedContact)">수정</BaseButton>
      </template>
    </BaseModal>

    <!-- 등록/수정 모달 -->
    <BaseModal
      :open="isFormOpen"
      :title="isEditMode ? '연락처 수정' : '연락처 등록'"
      width="max-w-md"
      @close="closeForm"
    >
      <form class="space-y-4" @submit.prevent="handleFormSubmit">
        <FormField label="이름" required :error="formErrors.contactName">
          <BaseTextField v-model="formName" placeholder="홍길동" />
        </FormField>
        <FormField label="직책">
          <BaseTextField v-model="formPosition" placeholder="과장" />
        </FormField>
        <FormField label="이메일" :error="formErrors.contactEmail">
          <BaseTextField v-model="formEmail" type="email" placeholder="hong@example.com" />
        </FormField>
        <FormField label="전화" :error="formErrors.contactTel">
          <!-- 연락처 입력 편의성: 입력 중 숫자만 추출해 "###-####-####" 포맷으로 하이픈
               자동 삽입. 컨택은 국가 필드가 없어 국가번호 자동은 생략 (Client/Buyer 폼
               은 country 기반 prefix 자동). -->
          <BaseTextField :model-value="formTel" placeholder="010-1234-5678" @update:modelValue="onContactTelInput" />
        </FormField>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closeForm">취소</BaseButton>
        <BaseButton @click="handleFormSubmit">{{ isEditMode ? '수정' : '등록' }}</BaseButton>
      </template>
    </BaseModal>

    <ConfirmModal
      :open="isDeleteOpen"
      title="연락처 삭제"
      message="이 연락처를 삭제하시겠습니까?"
      :detail="`${deleteTarget?.contactName} (${deleteTarget?.contactPosition || '직책 미입력'})`"
      confirm-label="삭제"
      variant="danger"
      @cancel="closeDelete"
      @confirm="handleDelete"
    />
  </div>
</template>
