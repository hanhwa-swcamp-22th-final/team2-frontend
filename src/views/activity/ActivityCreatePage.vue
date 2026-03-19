<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createActivity, fetchActivityClients, fetchPOsByClient } from '@/api/activity'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'

const router = useRouter()

// ── state ──────────────────────────────────────────────────
const formClient = ref('')
const formType = ref('')
const formPoDisplay = ref('')
const formDate = ref(new Date().toISOString().slice(0, 10))
const formPriority = ref('medium')
const formTitle = ref('')
const formContent = ref('')
const formAuthor = ref('')

// ── options ────────────────────────────────────────────────
const clientOptions = ref([])

onMounted(async () => {
  try {
    const data = await fetchActivityClients()
    clientOptions.value = data.map((c) => ({ label: `${c.name} (${c.nameKr})`, value: c.id }))
  } catch (e) {
    console.error('거래처 목록 로드 실패', e)
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
    alert('거래처를 먼저 선택해주세요.')
    return
  }
  try {
    poList.value = await fetchPOsByClient(formClient.value)
    poKeyword.value = ''
    isPoSearchOpen.value = true
  } catch (e) {
    console.error('PO 목록 로드 실패', e)
  }
}

function selectPO(po) {
  formPoDisplay.value = po.id
  isPoSearchOpen.value = false
}

async function handleSubmit() {
  if (!formClient.value || !formType.value || !formDate.value || !formTitle.value || !formAuthor.value) return
  try {
    await createActivity({
      clientId: formClient.value,
      type:     formType.value,
      poId:     formPoDisplay.value,
      date:     formDate.value,
      title:    formTitle.value,
      content:  formContent.value,
      author:   formAuthor.value,
      priority: isIssue.value ? formPriority.value : undefined,
    })
    router.push('/activities')
  } catch (e) {
    console.error('기록 등록 실패', e)
    alert('기록 등록에 실패했습니다. 다시 시도해주세요.')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 페이지 타이틀 -->
    <PageTitleBar title="기록 등록" description="새로운 활동 기록을 등록합니다.">
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
    </PageTitleBar>

    <!-- 등록 폼 -->
    <BaseCard title="기록 정보" subtitle="* 표시 항목은 필수 입력입니다.">
      <div class="space-y-5">

        <!-- 1행: 거래처 + 유형 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-slate-700">
              거래처 <span class="text-red-500">*</span>
            </p>
            <SearchableCombobox
              v-model="formClient"
              :options="clientOptions"
              placeholder="거래처 검색/선택..."
            />
          </div>
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-slate-700">
              유형 <span class="text-red-500">*</span>
            </p>
            <BaseSelect
              v-model="formType"
              :options="typeOptions"
              placeholder="유형 선택"
            />
          </div>
        </div>

        <!-- 2행: 수주건(PO) -->
        <div class="space-y-1.5">
          <p class="text-sm font-semibold text-slate-700">수주건</p>
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <SearchTriggerField
                v-model="formPoDisplay"
                placeholder="PO 검색 버튼으로 선택"
                title="PO 검색"
                @trigger="openPoSearch"
              />
            </div>
            <BaseButton variant="secondary" @click="formPoDisplay = ''">
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </BaseButton>
          </div>
        </div>

        <!-- 3행: 날짜 + 작성자 -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-slate-700">
              날짜 <span class="text-red-500">*</span>
            </p>
            <DateField v-model="formDate" />
          </div>
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-slate-700">
              작성자 <span class="text-red-500">*</span>
            </p>
            <BaseTextField v-model="formAuthor" placeholder="작성자 이름" />
          </div>
        </div>

        <!-- 4행: 우선순위(이슈일 때만) -->
        <div v-if="isIssue" class="space-y-1.5">
          <p class="text-sm font-semibold text-slate-700">우선순위</p>
          <BaseSelect v-model="formPriority" :options="priorityOptions" />
        </div>

        <!-- 4행: 제목 -->
        <div class="space-y-1.5">
          <p class="text-sm font-semibold text-slate-700">
            제목 <span class="text-red-500">*</span>
          </p>
          <BaseTextField v-model="formTitle" placeholder="활동 제목을 입력하세요" />
        </div>

        <!-- 5행: 내용 -->
        <div class="space-y-1.5">
          <p class="text-sm font-semibold text-slate-700">내용</p>
          <BaseTextarea
            v-model="formContent"
            placeholder="상세 내용을 입력하세요"
            :rows="6"
          />
        </div>

        <!-- 저장 버튼 -->
        <div class="pt-2">
          <BaseButton @click="handleSubmit">
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
