<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createActivity, fetchActivityClients, fetchPOsByClient } from '@/api/activity'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import FormField from '@/components/common/FormField.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import SearchModal from '@/components/common/SearchModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const { warning, error } = useToast()

// ── state ──────────────────────────────────────────────────
const isSubmitting = ref(false)
const formClient = ref('')
const formType = ref('')
const formPoDisplay = ref('')
const formPoId = ref('')
const formDate = ref(new Date().toISOString().slice(0, 10))
const formPriority = ref('medium')
const formTitle = ref('')
const formContent = ref('')
const formAuthor = ref('')
const errors = ref({})

watch(formClient, (val) => { if (val) errors.value.client = undefined })
watch(formType,   (val) => { if (val) errors.value.type   = undefined })
watch(formDate,   (val) => { if (val) errors.value.date   = undefined })
watch(formTitle,  (val) => { if (val.trim()) errors.value.title  = undefined })
watch(formAuthor, (val) => { if (val.trim()) errors.value.author = undefined })

// ── options ────────────────────────────────────────────────
const clientOptions = ref([])

onMounted(async () => {
  try {
    const data = await fetchActivityClients()
    clientOptions.value = data.map((c) => ({ label: `${c.name} (${c.nameKr})`, value: c.id }))
  } catch (e) {
    console.error('거래처 목록 로드 실패', e)
    error('거래처 목록을 불러오지 못했습니다. 페이지를 새로고침해주세요.')
  }
})

const typeOptions = [
  { label: '미팅/협의', value: '미팅/협의' },
  { label: '이슈', value: '이슈' },
  { label: '메모/노트', value: '메모/노트' },
  { label: '코멘트', value: '코멘트' },
  { label: '일정', value: '일정' },
]

const priorityOptions = [
  { label: '보통', value: 'medium' },
  { label: '높음', value: 'high' },
]

// ── computed ───────────────────────────────────────────────
const isIssue = computed(() => formType.value === '이슈')
const isAuthorLocked = computed(() => !!formPoDisplay.value)

// ── PO 검색 모달 ───────────────────────────────────────────
const isPoSearchOpen = ref(false)
const poList = ref([])
const poKeyword = ref('')

const poColumns = [
  { key: 'id',    label: 'PO 번호' },
  { key: 'title', label: '제목'    },
  { key: 'date',  label: '날짜'    },
]

const filteredPoList = computed(() => {
  if (!poKeyword.value) return poList.value
  const kw = poKeyword.value.toLowerCase()
  return poList.value.filter(
    (p) => p.id.toLowerCase().includes(kw) || p.title.toLowerCase().includes(kw),
  )
})

async function openPoSearch() {
  if (!formClient.value) {
    warning('거래처를 먼저 선택해주세요.')
    return
  }
  try {
    poList.value = await fetchPOsByClient(formClient.value)
    poKeyword.value = ''
    isPoSearchOpen.value = true
  } catch (e) {
    console.error('PO 목록 로드 실패', e)
    error('PO 목록을 불러오지 못했습니다. 다시 시도해주세요.')
  }
}

function selectPO(po) {
  formPoDisplay.value = `${po.id} - ${po.title}`
  formPoId.value = po.id
  formAuthor.value = authStore.currentUser?.name ?? ''
  isPoSearchOpen.value = false
}

function clearPo() {
  formPoDisplay.value = ''
  formPoId.value = ''
  formAuthor.value = ''
}

function validate() {
  const e = {}
  if (!formClient.value)  e.client = '거래처 값이 누락되었습니다.'
  if (!formType.value)    e.type   = '유형 값이 누락되었습니다.'
  if (!formDate.value)    e.date   = '날짜 값이 누락되었습니다.'
  if (!formTitle.value.trim())  e.title  = '제목 값이 누락되었습니다.'
  if (!formAuthor.value.trim()) e.author = '작성자 값이 누락되었습니다.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSubmit() {
  if (!validate()) {
    warning('입력 내용을 확인해주세요.')
    return
  }
  isSubmitting.value = true
  try {
    await createActivity({
      clientId: formClient.value,
      type:     formType.value,
      poId:     formPoId.value,
      date:     formDate.value,
      title:    formTitle.value,
      content:  formContent.value,
      author:   formAuthor.value,
      priority: isIssue.value ? formPriority.value : undefined,
    })
    router.push('/activities')
  } catch (e) {
    console.error('기록 등록 실패', e)
    error('기록 등록에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 페이지 타이틀 -->
    <DocumentPageHeader title="기록 등록" icon-class="fas fa-list-check">
      <template #actions>
        <BaseButton variant="secondary" @click="router.push('/activities')">
          <template #leading>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
            </svg>
          </template>
          목록으로
        </BaseButton>
      </template>
    </DocumentPageHeader>

    <!-- 등록 폼 -->
    <BaseCard title="기록 정보" subtitle="* 표시 항목은 필수 입력입니다.">
      <div class="space-y-5">

        <!-- 1행: 거래처 + 유형 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="거래처" :required="true" :error="errors.client">
            <SearchableCombobox
              v-model="formClient"
              :options="clientOptions"
              placeholder="거래처 검색/선택..."
            />
          </FormField>
          <FormField label="유형" :required="true" :error="errors.type">
            <BaseSelect
              v-model="formType"
              :options="typeOptions"
              placeholder="유형 선택"
            />
          </FormField>
        </div>

        <!-- 2행: 수주건(PO) -->
        <FormField label="수주건">
          <div class="flex items-center gap-2">
            <BaseTextField
              v-model="formPoDisplay"
              placeholder="수주건을 선택하세요 (PO 검색 클릭)"
              :readonly="true"
              class="flex-1"
            />
            <BaseButton variant="ghost" @click="openPoSearch">
              <template #leading>
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.473 9.766l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clip-rule="evenodd" />
                </svg>
              </template>
              PO 검색
            </BaseButton>
            <BaseButton variant="secondary" @click="clearPo">
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </BaseButton>
          </div>
        </FormField>

        <!-- 3행: 날짜 + 작성자 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="날짜" :required="true" :error="errors.date">
            <DateField v-model="formDate" />
          </FormField>
          <FormField label="작성자" :required="true" :error="errors.author">
            <BaseTextField
              v-model="formAuthor"
              :placeholder="isAuthorLocked ? '' : 'PO 선택 시 자동 입력됩니다'"
              :readonly="isAuthorLocked"
              :class="isAuthorLocked ? 'cursor-not-allowed bg-slate-50 text-slate-500' : ''"
            />
          </FormField>
        </div>

        <!-- 4행: 우선순위(이슈일 때만) -->
        <FormField v-if="isIssue" label="우선순위">
          <BaseSelect v-model="formPriority" :options="priorityOptions" />
        </FormField>

        <!-- 4행: 제목 -->
        <FormField label="제목" :required="true" :error="errors.title">
          <BaseTextField v-model="formTitle" placeholder="활동 제목을 입력하세요" />
        </FormField>

        <!-- 5행: 내용 -->
        <FormField label="내용">
          <BaseTextarea
            v-model="formContent"
            placeholder="상세 내용을 입력하세요"
            :rows="6"
          />
        </FormField>

        <!-- 저장 버튼 -->
        <div class="pt-2">
          <BaseButton :disabled="isSubmitting" @click="handleSubmit">
            <template #leading>
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
              </svg>
            </template>
            기록 저장
          </BaseButton>
        </div>

      </div>
    </BaseCard>

    <!-- PO 검색 모달 -->
    <SearchModal
      :open="isPoSearchOpen"
      title="PO 검색"
      :columns="poColumns"
      :rows="filteredPoList"
      :search-keyword="poKeyword"
      empty-text="해당 거래처의 PO가 없습니다."
      @update:search-keyword="poKeyword = $event"
      @close="isPoSearchOpen = false"
      @select="selectPO"
    />
  </div>
</template>
