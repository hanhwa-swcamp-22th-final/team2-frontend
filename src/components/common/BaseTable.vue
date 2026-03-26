<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  emptyText: {
    type: String,
    default: '데이터가 없습니다.',
  },
  footerText: {
    type: String,
    default: '',
  },
  clickableRows: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['row-click'])

const resizeWidths = ref({})
let activeResize = null

// 드래그와 클릭을 구분하기 위한 mousedown 좌표 추적
let rowMouseDownPos = null
const DRAG_THRESHOLD = 5

function onRowMouseDown(event) {
  rowMouseDownPos = { x: event.clientX, y: event.clientY }
}

function onRowClick(event, row) {
  // 버튼·링크 등 인터랙티브 요소 클릭 시 행 이동 무시
  if (event.target.closest('button, a, [data-action]')) return

  // 텍스트가 선택된 경우 (드래그) → 클릭 무시
  const selection = window.getSelection()
  if (selection && selection.toString().length > 0) return

  // mousedown과 click 사이 마우스 이동 거리가 임계값 초과 → 드래그로 판단
  if (rowMouseDownPos) {
    const dx = Math.abs(event.clientX - rowMouseDownPos.x)
    const dy = Math.abs(event.clientY - rowMouseDownPos.y)
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) return
  }

  emit('row-click', row)
}

function normalizeColumn(column) {
  if (typeof column === 'string') {
    return {
      key: column,
      label: column,
      align: 'left',
    }
  }

  return {
    key: column.key,
    label: column.label ?? column.key,
    align: column.align ?? 'left',
    width: column.width ?? '',
    sortable: column.sortable,
  }
}

function getCellValue(row, key) {
  return row?.[key]
}

function getAlignmentClass(align) {
  if (align === 'right') {
    return 'text-right'
  }

  if (align === 'center') {
    return 'text-center'
  }

  return 'text-left'
}

function getHeaderAlignmentClass(align) {
  return 'text-center'
}

const normalizedColumns = computed(() => props.columns.map(normalizeColumn))

// ── 정렬 (3중 토글: 기본 → asc → desc → 기본) ──────────────
const sortKey = ref('')
const sortDirection = ref('')   // '' | 'asc' | 'desc'

function toggleSort(column) {
  if (column.sortable === false) return

  if (sortKey.value !== column.key) {
    sortKey.value = column.key
    sortDirection.value = 'asc'
    return
  }

  if (sortDirection.value === 'asc') {
    sortDirection.value = 'desc'
  } else if (sortDirection.value === 'desc') {
    sortKey.value = ''
    sortDirection.value = ''
  } else {
    sortDirection.value = 'asc'
  }
}

function parseSortValue(val) {
  if (val == null || val === '' || val === '-') return null
  // 숫자
  const num = Number(val)
  if (!Number.isNaN(num) && typeof val !== 'boolean') return num
  // 날짜 패턴 (YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD)
  const dateStr = String(val).replace(/\./g, '-').replace(/\//g, '-')
  const ts = Date.parse(dateStr)
  if (Number.isFinite(ts)) return ts
  // 문자열
  return String(val).toLowerCase()
}

const sortedRows = computed(() => {
  if (!sortKey.value || !sortDirection.value) return props.rows

  const key = sortKey.value
  const dir = sortDirection.value === 'asc' ? 1 : -1

  return [...props.rows].sort((a, b) => {
    const va = parseSortValue(a?.[key])
    const vb = parseSortValue(b?.[key])
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * dir
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
})

watch(normalizedColumns, (columns) => {
  const nextWidths = {}

  columns.forEach((column) => {
    if (resizeWidths.value[column.key]) {
      nextWidths[column.key] = resizeWidths.value[column.key]
      return
    }

    if (column.width) {
      nextWidths[column.key] = column.width
    }
  })

  resizeWidths.value = nextWidths
}, { immediate: true })

function getColumnStyle(column) {
  const width = resizeWidths.value[column.key] || column.width

  if (!width) {
    return {}
  }

  return {
    width,
    minWidth: width,
  }
}

function handleResizeMove(event) {
  if (!activeResize) {
    return
  }

  const nextWidth = Math.max(120, activeResize.startWidth + (event.clientX - activeResize.startX))

  resizeWidths.value = {
    ...resizeWidths.value,
    [activeResize.key]: `${nextWidth}px`,
  }
}

function stopResize() {
  if (!activeResize) {
    return
  }

  activeResize = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', handleResizeMove)
  window.removeEventListener('mouseup', stopResize)
}

function startResize(event, column) {
  const headerCell = event.currentTarget?.parentElement

  if (!headerCell) {
    return
  }

  activeResize = {
    key: column.key,
    startX: event.clientX,
    startWidth: headerCell.offsetWidth,
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', handleResizeMove)
  window.addEventListener('mouseup', stopResize)
}

onBeforeUnmount(() => {
  stopResize()
})
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
    <table class="min-w-full border-collapse">
      <thead class="bg-slate-50">
        <tr>
          <th
            v-for="column in normalizedColumns"
            :key="column.key"
            scope="col"
            class="relative select-none border-b border-r border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 last:border-r-0"
            :class="[getHeaderAlignmentClass(column.align), column.sortable !== false ? 'cursor-pointer hover:bg-slate-100 transition-colors' : '']"
            :style="getColumnStyle(column)"
            @click="toggleSort(column)"
          >
            <span class="inline-flex items-center gap-1">
              {{ column.label }}
              <svg
                v-if="column.sortable !== false"
                class="h-3.5 w-3.5 flex-shrink-0"
                :class="sortKey === column.key ? 'text-brand-500' : 'text-slate-300'"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  v-if="sortKey !== column.key || !sortDirection"
                  d="M4.5 5.5l3.5-3 3.5 3M4.5 10.5l3.5 3 3.5-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  v-else-if="sortDirection === 'asc'"
                  d="M4.5 10.5l3.5-3 3.5 3M4.5 6l3.5-3 3.5 3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  v-else
                  d="M4.5 5.5l3.5 3 3.5-3M4.5 10l3.5 3 3.5-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <button
              type="button"
              class="absolute right-0 top-0 h-full w-2 cursor-col-resize border-0 bg-transparent p-0 transition hover:bg-brand/20 focus-visible:bg-brand/20 focus-visible:outline-none"
              :aria-label="`${column.label} 너비 조절`"
              @mousedown.prevent.stop="startResize($event, column)"
            />
          </th>
        </tr>
      </thead>
      <tbody v-if="sortedRows.length > 0" class="bg-white">
        <tr
          v-for="row in sortedRows"
          :key="row?.[rowKey] ?? JSON.stringify(row)"
          class="transition hover:bg-slate-50/70"
          :class="props.clickableRows ? 'cursor-pointer' : ''"
          @mousedown="onRowMouseDown"
          @click="onRowClick($event, row)"
        >
          <td
            v-for="column in normalizedColumns"
            :key="column.key"
            class="border-b border-r border-slate-200 px-4 py-3 text-sm text-slate-700 last:border-r-0"
            :class="getAlignmentClass(column.align)"
            :style="getColumnStyle(column)"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="getCellValue(row, column.key)"
            >
              {{ getCellValue(row, column.key) ?? '-' }}
            </slot>
          </td>
        </tr>
      </tbody>
      <tfoot v-if="$slots.footer" class="bg-slate-50">
        <slot name="footer" />
      </tfoot>
    </table>
    <div
      v-if="sortedRows.length === 0"
      class="flex min-h-[160px] items-center justify-center border-t border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400"
    >
      {{ emptyText }}
    </div>
    <div
      v-if="!$slots.footer && footerText"
      class="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500"
    >
      {{ footerText }}
    </div>
  </div>
</template>
