<script setup>
import { computed, ref, watch } from 'vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  activity: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'save'])
const { warning } = useToast()

// ── 폼 상태 ────────────────────────────────────────────────
const formDate         = ref('')
const formTitle        = ref('')
const formContent      = ref('')
const formScheduleFrom = ref('')
const formScheduleTo   = ref('')
const errors           = ref({})

const isSchedule = computed(() => props.activity?.type === '일정')

// ── 달력 (range picker) — watch 보다 먼저 선언 ────────────
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
  const firstDay = new Date(calYear.value, calMonth.value, 1)
  const startDow = firstDay.getDay()
  const lastDate = new Date(calYear.value, calMonth.value + 1, 0).getDate()
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

function dayBgClass(str) {
  if (!str || !formScheduleFrom.value || !formScheduleTo.value || formScheduleFrom.value === formScheduleTo.value) return ''
  if (str === formScheduleFrom.value) return 'absolute inset-y-0.5 right-0 w-1/2 bg-brand-100'
  if (str === formScheduleTo.value)   return 'absolute inset-y-0.5 left-0  w-1/2 bg-brand-100'
  if (str > formScheduleFrom.value && str < formScheduleTo.value) return 'absolute inset-y-0.5 inset-x-0 bg-brand-100'
  return ''
}

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

// ── 모달이 열릴 때마다 activity 데이터로 폼 초기화 ──────────
function initForm(val) {
  formDate.value         = (val?.date         ?? '').replaceAll('/', '-')
  formTitle.value        = val?.title        ?? ''
  formContent.value      = val?.content      ?? ''
  formScheduleFrom.value = (val?.scheduleFrom ?? '').replaceAll('/', '-')
  formScheduleTo.value   = (val?.scheduleTo   ?? '').replaceAll('/', '-')
  errors.value           = {}
  // 달력 월 동기화
  if (val?.scheduleFrom) {
    const d = new Date(val.scheduleFrom)
    calYear.value  = d.getFullYear()
    calMonth.value = d.getMonth()
  } else {
    calYear.value  = new Date().getFullYear()
    calMonth.value = new Date().getMonth()
  }
}

// open이 true로 바뀔 때마다 최신 activity로 초기화 (동일 객체 재사용 대응)
watch(() => props.open, (val) => { if (val) initForm(props.activity) })
watch(() => props.activity, initForm, { immediate: true })

watch(formDate,  (val) => { if (val) errors.value.date  = undefined })
watch(formTitle, (val) => { if (val.trim()) errors.value.title = undefined })

// 시작일 입력 시 달력 월 동기화
watch(formScheduleFrom, (val) => {
  if (!val) return
  const d = new Date(val)
  calYear.value  = d.getFullYear()
  calMonth.value = d.getMonth()
})

function handleSave() {
  const e = {}
  if (!formDate.value)         e.date  = '날짜 값이 누락되었습니다.'
  if (!formTitle.value.trim()) e.title = '제목 값이 누락되었습니다.'
  if (isSchedule.value && (!formScheduleFrom.value || !formScheduleTo.value)) e.scheduleFrom = '기간 선택이 누락되었습니다.'
  errors.value = e
  if (Object.keys(e).length > 0) {
    warning('입력 내용을 확인해주세요.')
    return
  }
  emit('save', {
    ...props.activity,
    date:         formDate.value.replaceAll('-', '/'),
    title:        formTitle.value,
    content:      isSchedule.value ? formTitle.value : formContent.value,
    scheduleFrom: isSchedule.value ? formScheduleFrom.value.replaceAll('-', '/') : undefined,
    scheduleTo:   isSchedule.value ? formScheduleTo.value.replaceAll('-', '/')   : undefined,
  })
}
</script>

<template>
  <BaseModal
    :open="open"
    title="기록 수정"
    width="max-w-xl"
    @close="$emit('close')"
  >
    <div class="space-y-4">

      <!-- 유형 배지 -->
      <div class="flex items-center gap-2">
        <ActivityTypeBadge :value="activity.type" />
      </div>

      <!-- 날짜 -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">
          날짜 <span class="text-red-500">*</span>
        </p>
        <DateField v-model="formDate" />
        <p v-if="errors.date" class="mt-1 text-xs text-red-500">{{ errors.date }}</p>
      </div>

      <!-- 제목 -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">
          제목 <span class="text-red-500">*</span>
        </p>
        <BaseTextField v-model="formTitle" placeholder="활동 제목을 입력하세요" />
        <p v-if="errors.title" class="mt-1 text-xs text-red-500">{{ errors.title }}</p>
      </div>

      <!-- 내용 (일정이 아닐 때) -->
      <div v-if="!isSchedule" class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">내용</p>
        <BaseTextarea
          v-model="formContent"
          placeholder="상세 내용을 입력하세요"
          :rows="5"
        />
      </div>

      <!-- 기간 선택 (일정일 때) -->
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

    </div>

    <!-- 모달 하단 버튼 -->
    <template #footer>
      <BaseButton variant="secondary" @click="$emit('close')">취소</BaseButton>
      <BaseButton @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
