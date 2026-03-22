<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import SearchInput from '@/components/common/SearchInput.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '상세검색',
  },
  columns: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
  searchKeyword: {
    type: String,
    default: '',
  },
  emptyText: {
    type: String,
    default: '검색 결과가 없습니다.',
  },
  width: {
    type: String,
    default: 'max-w-6xl',
  },
})

const emit = defineEmits(['close', 'update:searchKeyword', 'select'])

function normalizeColumn(column) {
  if (typeof column === 'string') {
    return { key: column, label: column, align: 'left', width: '' }
  }

  return {
    key: column.key,
    label: column.label ?? column.key,
    align: column.align ?? 'left',
    width: column.width ?? '',
    format: column.format,
  }
}

function getAlignClass(align) {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

function getColumnStyle(column) {
  if (!column.width) return {}

  return {
    width: column.width,
    minWidth: column.width,
  }
}

function getCellValue(row, column) {
  const value = row[column.key]
  return column.format ? column.format(value, row) : value
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="title"
    description="목록에서 원하는 항목을 검색해 선택하는 공통 모달"
    :width="width"
    :z-index="70"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <slot name="filter" />
      <SearchInput
        :model-value="searchKeyword"
        placeholder="검색어를 입력하세요"
        @update:model-value="$emit('update:searchKeyword', $event)"
        @search="$emit('update:searchKeyword', $event)"
      />

      <div class="overflow-hidden rounded-2xl border border-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50/80">
            <tr>
              <th
                v-for="column in columns"
                :key="normalizeColumn(column).key"
                class="px-4 py-3 text-sm font-semibold text-slate-600"
                :class="getAlignClass(normalizeColumn(column).align)"
                :style="getColumnStyle(normalizeColumn(column))"
              >
                {{ normalizeColumn(column).label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="rows.length === 0">
              <td :colspan="columns.length || 1" class="px-4 py-6 text-center text-slate-400">
                {{ emptyText }}
              </td>
            </tr>
            <tr
              v-for="row in rows"
              v-else
              :key="row.id ?? JSON.stringify(row)"
              class="cursor-pointer transition hover:bg-slate-50"
              @click="$emit('select', row)"
            >
              <td
                v-for="column in columns"
                :key="normalizeColumn(column).key"
                class="px-4 py-3 text-slate-700"
                :class="getAlignClass(normalizeColumn(column).align)"
                :style="getColumnStyle(normalizeColumn(column))"
              >
                <slot
                  :name="`cell-${normalizeColumn(column).key}`"
                  :row="row"
                  :value="row[normalizeColumn(column).key]"
                >
                  {{ getCellValue(row, normalizeColumn(column)) ?? '-' }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="$emit('close')">닫기</BaseButton>
    </template>
  </BaseModal>
</template>
