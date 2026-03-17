<script setup>
defineProps({
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
})

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
</script>

<template>
  <div class="overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-panel backdrop-blur">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-100">
        <thead class="bg-slate-50/80">
          <tr>
            <th
              v-for="column in columns"
              :key="normalizeColumn(column).key"
              scope="col"
              class="px-5 py-4 text-sm font-semibold text-slate-600"
              :class="normalizeColumn(column).align === 'right' ? 'text-right' : 'text-left'"
              :style="{ width: normalizeColumn(column).width }"
            >
              {{ normalizeColumn(column).label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr v-if="rows.length === 0">
            <td :colspan="columns.length || 1" class="px-5 py-10 text-center text-sm text-slate-400">
              {{ emptyText }}
            </td>
          </tr>
          <tr
            v-for="row in rows"
            v-else
            :key="row?.[rowKey] ?? JSON.stringify(row)"
            class="transition hover:bg-slate-50/70"
          >
            <td
              v-for="column in columns"
              :key="normalizeColumn(column).key"
              class="px-5 py-4 text-sm text-slate-700"
              :class="normalizeColumn(column).align === 'right' ? 'text-right' : 'text-left'"
            >
              <slot
                :name="`cell-${normalizeColumn(column).key}`"
                :row="row"
                :value="getCellValue(row, normalizeColumn(column).key)"
              >
                {{ getCellValue(row, normalizeColumn(column).key) ?? '-' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
