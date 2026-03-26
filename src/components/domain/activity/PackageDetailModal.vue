<script setup>
import { computed, ref } from 'vue'
import { jsPDF } from 'jspdf'
import ActivityDetailModal from '@/components/domain/activity/ActivityDetailModal.vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

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

const selectedActivity = ref(null)

function openActivityDetail(act) {
  selectedActivity.value = act
}

function closeActivityDetail() {
  selectedActivity.value = null
}

const packageActivities = computed(() => {
  if (!props.pkg?.activityIds?.length) return []
  return props.activities.filter((a) => props.pkg.activityIds.includes(String(a.id)) || props.pkg.activityIds.includes(a.id))
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

function generatePdf() {
  if (!props.pkg) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // ── 헤더
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Activity Record Package', pageW / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleDateString('ko-KR')}`, pageW / 2, y, { align: 'center' })
  y += 4

  if (props.pkg.poId) {
    doc.text(`PO: ${props.pkg.poId}`, pageW / 2, y, { align: 'center' })
    y += 4
  }
  doc.text(`Period: ${props.pkg.dateFrom || '-'} ~ ${props.pkg.dateTo || '-'}`, pageW / 2, y, { align: 'center' })
  y += 8

  // 구분선
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── 선택된 활동기록 목록
  const selected = packageActivities.value

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text(`Activity Records (${selected.length})`, margin, y)
  y += 7

  if (selected.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150)
    doc.text('No records selected.', margin, y)
    y += 6
  } else {
    const cols = [
      { label: 'No',     x: margin,      w: 12  },
      { label: 'Date',   x: margin + 12, w: 25  },
      { label: 'Type',   x: margin + 37, w: 28  },
      { label: 'Title',  x: margin + 65, w: 70  },
      { label: 'Author', x: margin + 135, w: 30 },
    ]

    doc.setFillColor(240, 244, 255)
    doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50)
    cols.forEach((c) => doc.text(c.label, c.x + 1, y))
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30)

    selected.forEach((a, i) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const bg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      doc.setFillColor(...bg)
      doc.rect(margin, y - 4, pageW - margin * 2, 6, 'F')

      doc.setFontSize(8.5)
      doc.text(String(i + 1), cols[0].x + 1, y)
      doc.text(a.date ?? '-',  cols[1].x + 1, y)
      doc.text(a.type ?? '-',  cols[2].x + 1, y)

      const title = doc.splitTextToSize(a.title ?? '-', cols[3].w - 2)[0]
      doc.text(title, cols[3].x + 1, y)
      doc.text(a.author ?? '-', cols[4].x + 1, y)
      y += 6
    })
  }

  y += 6
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // ── 포함 항목 요약
  const includedTypes = [...new Set(selected.map((a) => a.type))]
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text('Include Options', margin, y)
  y += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60)
  if (includedTypes.length === 0) {
    doc.text('No items selected', margin + 4, y)
    y += 5
  } else {
    includedTypes.forEach((type) => {
      doc.text(`- ${type}`, margin + 4, y)
      y += 5
    })
  }

  // ── 푸터
  const totalPages = doc.internal.pages.length - 1
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(160)
    doc.text(`Page ${p} / ${totalPages}`, pageW / 2, 290, { align: 'center' })
    doc.text('SalesBoost - Activity Package', margin, 290)
  }

  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
</script>

<template>
  <div>
    <BaseModal
      :open="open"
      :title="pkg?.title || '패키지 상세'"
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
      <div v-if="pkg.description" class="space-y-1">
        <h4 class="text-sm font-semibold text-slate-700">설명</h4>
        <p class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {{ pkg.description }}
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
        <BaseButton variant="secondary" @click="generatePdf">
          <template #leading>
            <i class="fas fa-file-pdf text-xs" />
          </template>
          PDF 다운로드
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
        <BaseButton variant="secondary" @click="generatePdf">
          <template #leading>
            <i class="fas fa-file-pdf text-xs" />
          </template>
          PDF 다운로드
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
