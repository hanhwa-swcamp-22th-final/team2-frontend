<script setup>
import { computed, ref } from 'vue'
import { downloadPackageReport } from '@/api/package'
import ActivityDetailModal from '@/components/domain/activity/ActivityDetailModal.vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  pkg: {
    type: Object,
    default: null,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
  activities: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'edit', 'delete'])
const { error } = useToast()

const selectedActivity = ref(null)
const downloading = ref(false)

function openActivityDetail(act) {
  selectedActivity.value = act
}

function closeActivityDetail() {
  selectedActivity.value = null
}

const packageActivities = computed(() => {
  if (!props.pkg?.activityIds?.length) return []
  const ids = new Set(props.pkg.activityIds.map((id) => String(id)))
  return props.activities.filter((a) => ids.has(String(a.id ?? a.activityId)))
})

const infoRows = computed(() => {
  if (!props.pkg) return []
  return [
    { label: '작성자', value: props.pkg.creatorName || '-' },
    { label: '작성일', value: props.pkg.createdAt || '-' },
    { label: '수정일', value: props.pkg.updatedAt || '-' },
    { label: '기간', value: `${props.pkg.dateFrom || '-'} ~ ${props.pkg.dateTo || '-'}` },
    { label: 'PO번호', value: props.pkg.poId || '-' },
  ]
})

async function generatePdf() {
  const packageId = props.pkg?.packageId ?? props.pkg?.id
  if (!packageId || downloading.value) return
  downloading.value = true
  try {
    const blob = await downloadPackageReport(packageId)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  } catch (e) {
    error(e?.response?.data?.message || 'PDF 생성에 실패했습니다.')
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div>
    <BaseModal
      :open="open"
      :title="pkg?.packageTitle || '패키지 상세'"
      width="max-w-3xl"
      @close="emit('close')"
    >
    <div v-if="pkg" class="space-y-5">
      <!-- 기본 정보 -->
      <div class="space-y-2">
        <div
          v-for="row in infoRows"
          :key="row.label"
          class="flex items-start gap-3 text-sm"
        >
          <span class="w-20 flex-shrink-0 font-semibold text-slate-500">{{ row.label }}</span>
          <span class="text-slate-800">{{ row.value }}</span>
        </div>
      </div>

      <!-- 설명 -->
      <div v-if="pkg.packageDescription" class="space-y-1">
        <h4 class="text-sm font-semibold text-slate-700">설명</h4>
        <p class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {{ pkg.packageDescription }}
        </p>
      </div>

      <!-- 포함 활동기록 -->
      <div class="space-y-2">
        <h4 class="text-sm font-semibold text-slate-700">
          포함 활동기록
          <span class="ml-1 text-xs font-normal text-slate-400">{{ packageActivities.length }}건</span>
        </h4>
        <div class="max-h-[200px] space-y-1.5 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2">
          <div
            v-if="packageActivities.length === 0"
            class="py-4 text-center text-xs text-slate-400"
          >
            활동기록이 없습니다.
          </div>
          <div
            v-for="act in packageActivities"
            :key="act.id"
            class="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-100"
            @click="openActivityDetail(act)"
          >
            <ActivityTypeBadge :value="act.type" />
            <span class="truncate font-medium text-slate-700">{{ act.title }}</span>
            <span class="flex-shrink-0 text-xs text-slate-400">{{ act.date }}</span>
          </div>
        </div>
      </div>

      <!-- 열람 권한 -->
      <div class="space-y-2">
        <h4 class="text-sm font-semibold text-slate-700">열람 권한</h4>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="name in (pkg.viewerNames || [])"
            :key="name"
            class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {{ name }}
          </span>
          <span
            v-if="!pkg.viewerNames?.length"
            class="text-xs text-slate-400"
          >
            열람 권한이 없습니다.
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <template v-if="isOwner">
        <BaseButton variant="secondary" :disabled="downloading" @click="generatePdf">
          <template #leading>
            <i class="fas fa-file-pdf text-xs" />
          </template>
          {{ downloading ? 'PDF 생성 중...' : 'PDF 다운로드' }}
        </BaseButton>
        <BaseButton variant="secondary" @click="emit('edit')">
          <template #leading>
            <i class="fas fa-pen text-xs" />
          </template>
          수정
        </BaseButton>
        <BaseButton variant="danger" @click="emit('delete')">
          <template #leading>
            <i class="fas fa-trash text-xs" />
          </template>
          삭제
        </BaseButton>
      </template>
      <template v-else>
        <BaseButton variant="secondary" :disabled="downloading" @click="generatePdf">
          <template #leading>
            <i class="fas fa-file-pdf text-xs" />
          </template>
          {{ downloading ? 'PDF 생성 중...' : 'PDF 다운로드' }}
        </BaseButton>
        <BaseButton variant="secondary" @click="emit('close')">닫기</BaseButton>
      </template>
    </template>
    </BaseModal>
    <ActivityDetailModal
      :open="Boolean(selectedActivity)"
      :activity="selectedActivity || {}"
      @close="closeActivityDetail"
    />
  </div>
</template>
