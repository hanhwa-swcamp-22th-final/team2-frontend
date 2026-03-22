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
  { label: '일정', value: '일정' },
]

const priorityOptions = [
  { label: '보통', value: 'medium' },
  { label: '높음', value: 'high' },
]

// ── computed ───────────────────────────────────────────────
const isIssue    = computed(() => formType.value === '이슈')
const isSchedule = computed(() => formType.value === '일정')
const isAuthorLocked = computed(() => !!formPoDisplay.value)

// ── 일정 기간 선택 ─────────────────────────────────────────
const formScheduleFrom = ref('')
const formScheduleTo   = ref('')

// 일정 유형 해제 시 기간 초기화
watch(formType, (val) => {
  if (val !== '일정') {
    formScheduleFrom.value = ''
    formScheduleTo.value   = ''
  }
})

// ── 달력 (range picker) ────────────────────────────────────
const calYear  = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())
const CAL_WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

const calMonthLabel = computed(() =>
  new Date(calYear.value, calMonth.value, 1)
    .toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
)

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const calendarDays = computed(() => {
  const firstDay  = new Date(calYear.value, calMonth.value, 1)
  const startDow  = firstDay.getDay()
  const lastDate  = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const days = []
  for (let i = 0; i < startDow; i++) days.push({ str: null, day: null })
  for (let d = 1; d <= lastDate; d++) {
    days.push({ str: toDateStr(new Date(calYear.value, calMonth.value, d)), day: d })
  }
  while (days.length < 42) days.push({ str: null, day: null })
  return days
})

function prevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}

function nextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}

const today = toDateStr(new Date())

function clickDay(str) {
  if (!str) return
  if (!formScheduleFrom.value || (formScheduleFrom.value && formScheduleTo.value)) {
    formScheduleFrom.value = str
    formScheduleTo.value   = ''
  } else {
    if (str >= formScheduleFrom.value) {
      formScheduleTo.value = str
    } else {
      formScheduleTo.value   = formScheduleFrom.value
      formScheduleFrom.value = str
    }
  }
}

function clearSchedule() {
  formScheduleFrom.value = ''
  formScheduleTo.value   = ''
}

// 범위 배경 (셀 절반 또는 전체) — absolute 레이어용
function dayBgClass(str) {
  if (!str || !formScheduleFrom.value || !formScheduleTo.value || formScheduleFrom.value === formScheduleTo.value) return ''
  if (str === formScheduleFrom.value) return 'absolute inset-y-0.5 right-0 w-1/2 bg-brand-100'
  if (str === formScheduleTo.value)   return 'absolute inset-y-0.5 left-0  w-1/2 bg-brand-100'
  if (str > formScheduleFrom.value && str < formScheduleTo.value) return 'absolute inset-y-0.5 inset-x-0 bg-brand-100'
  return ''
}

// 날짜 버튼 원형 스타일
function dayBtnClass(str, colIndex) {
  if (!str) return 'cursor-default'
  const isStart = str === formScheduleFrom.value
  const isEnd   = str === formScheduleTo.value
  const isToday = str === today
  const isSun   = colIndex % 7 === 0
  if (isStart || isEnd) return 'bg-brand text-white font-semibold rounded-full'
  const textColor = isSun ? 'text-red-500' : 'text-slate-700'
  if (isToday) return `${textColor} font-bold rounded-full ring-1 ring-brand-400 hover:bg-brand-50`
  return `${textColor} rounded-full hover:bg-slate-100`
}

// 시작일 직접 입력 시 달력 월 동기화
watch(formScheduleFrom, (val) => {
  if (!val) return
  const d = new Date(val)
  calYear.value  = d.getFullYear()
  calMonth.value = d.getMonth()
})

// ── PO 검색 모달 ───────────────────────────────────────────
const isPoSearchOpen = ref(false)
const poList = ref([])
const poKeyword = ref('')

const poColumns = [
  { key: 'id',           label: 'PO번호'  },
  { key: 'issueDate',    label: '등록일'  },
  { key: 'manager',      label: '담당자명' },
  { key: 'country',      label: '국가'    },
  { key: 'deliveryDate', label: '납기일'  },
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
  formPoDisplay.value = po.id
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
  if (isSchedule.value && (!formScheduleFrom.value || !formScheduleTo.value)) e.scheduleFrom = '기간 선택이 누락되었습니다.'
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
      date:     formDate.value.replaceAll('-', '/'),
      title:    formTitle.value,
      content:      isSchedule.value ? formTitle.value : formContent.value,
      author:       formAuthor.value,
      priority:     isIssue.value ? formPriority.value : undefined,
      scheduleFrom: isSchedule.value ? formScheduleFrom.value.replaceAll('-', '/') : undefined,
      scheduleTo:   isSchedule.value ? formScheduleTo.value.replaceAll('-', '/')   : undefined,
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

        <!-- 5행: 내용 (일정이 아닐 때) -->
        <FormField v-if="!isSchedule" label="내용">
          <BaseTextarea
            v-model="formContent"
            placeholder="상세 내용을 입력하세요"
            :rows="6"
          />
        </FormField>

        <!-- 5행: 기간 선택 (일정일 때) -->
        <template v-if="isSchedule">
          <FormField label="기간 선택" :error="errors.scheduleFrom">
            <div class="flex items-center gap-2">
              <div class="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
                <DateField v-model="formScheduleFrom" />
                <span class="text-center text-sm text-slate-400">~</span>
                <DateField v-model="formScheduleTo" />
              </div>
              <BaseButton variant="secondary" size="sm" @click="clearSchedule">
                <template #leading>
                  <i class="fas fa-undo text-xs" aria-hidden="true"></i>
                </template>
                기간 초기화
              </BaseButton>
            </div>
          </FormField>

          <!-- 인라인 달력 -->
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <!-- 달력 헤더 -->
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                @click="prevMonth"
              >
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
                </svg>
              </button>
              <span class="text-sm font-bold text-slate-800">{{ calMonthLabel }}</span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                @click="nextMonth"
              >
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <div class="px-4 pb-4 pt-3">
              <!-- 요일 헤더 -->
              <div class="mb-1 grid grid-cols-7 border-b border-slate-100 pb-2">
                <span
                  v-for="(wd, wi) in CAL_WEEK_DAYS"
                  :key="wd"
                  class="py-1 text-center text-xs font-semibold"
                  :class="wi === 0 ? 'text-red-400' : 'text-slate-400'"
                >{{ wd }}</span>
              </div>

              <!-- 날짜 그리드 -->
              <div class="grid grid-cols-7">
                <div
                  v-for="(day, i) in calendarDays"
                  :key="i"
                  class="relative flex items-center justify-center py-0.5"
                >
                  <!-- 범위 배경 레이어 -->
                  <div :class="dayBgClass(day.str)" />

                  <!-- 날짜 버튼 -->
                  <button
                    type="button"
                    class="relative z-10 flex h-9 w-9 items-center justify-center text-sm transition"
                    :class="day.str ? dayBtnClass(day.str, i) : 'cursor-default text-transparent'"
                    :disabled="!day.str"
                    @click="clickDay(day.str)"
                  >
                    {{ day.day ?? '' }}
                  </button>
                </div>
              </div>

              <!-- 선택 현황 -->
              <div class="mt-3 flex items-center justify-center gap-2 border-t border-slate-100 pt-3 text-xs">
                <template v-if="!formScheduleFrom">
                  <span class="text-slate-400">시작일을 선택하세요</span>
                </template>
                <template v-else-if="!formScheduleTo">
                  <span class="font-medium text-brand-600">{{ formScheduleFrom }}</span>
                  <span class="text-slate-300">→</span>
                  <span class="text-slate-400">종료일을 선택하세요</span>
                </template>
                <template v-else>
                  <span class="font-medium text-brand-600">{{ formScheduleFrom }}</span>
                  <span class="text-slate-400">~</span>
                  <span class="font-medium text-brand-600">{{ formScheduleTo }}</span>
                </template>
              </div>
            </div>
          </div>
        </template>

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
