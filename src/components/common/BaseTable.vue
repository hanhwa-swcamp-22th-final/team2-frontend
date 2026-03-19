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
            :class="getHeaderAlignmentClass(column.align)"
            :style="getColumnStyle(column)"
          >
            {{ column.label }}
            <button
              type="button"
              class="absolute right-0 top-0 h-full w-2 cursor-col-resize border-0 bg-transparent p-0 transition hover:bg-brand/20 focus-visible:bg-brand/20 focus-visible:outline-none"
              :aria-label="`${column.label} 너비 조절`"
              @mousedown.prevent.stop="startResize($event, column)"
            />
          </th>
        </tr>
      </thead>
      <tbody v-if="rows.length > 0" class="bg-white">
        <tr
          v-for="row in rows"
          :key="row?.[rowKey] ?? JSON.stringify(row)"
          class="transition hover:bg-slate-50/70"
          :class="props.clickableRows ? 'cursor-pointer' : ''"
          @click="emit('row-click', row)"
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
      v-if="rows.length === 0"
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
