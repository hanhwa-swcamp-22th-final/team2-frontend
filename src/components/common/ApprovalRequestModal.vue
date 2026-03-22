<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '결재 요청',
  },
  message: {
    type: String,
    default: '',
  },
  requestRows: {
    type: Array,
    default: () => [],
  },
  requestSectionTitle: {
    type: String,
    default: '결재 요청 정보',
  },
  documentRows: {
    type: Array,
    default: () => [],
  },
  documentSectionTitle: {
    type: String,
    default: '문서 요약',
  },
  changeColumns: {
    type: Array,
    default: () => [],
  },
  changeRows: {
    type: Array,
    default: () => [],
  },
  changeSectionTitle: {
    type: String,
    default: '변경 사항',
  },
  itemColumns: {
    type: Array,
    default: () => [],
  },
  itemRows: {
    type: Array,
    default: () => [],
  },
  itemSummaryRows: {
    type: Array,
    default: () => [],
  },
  itemSectionTitle: {
    type: String,
    default: '품목 정보',
  },
  itemEmptyText: {
    type: String,
    default: '품목 정보가 없습니다.',
  },
  referenceRows: {
    type: Array,
    default: () => [],
  },
  referenceSectionTitle: {
    type: String,
    default: '참조 문서 정보',
  },
  helperText: {
    type: String,
    default: '요청 후 문서는 결재 대기 상태로 등록됩니다.',
  },
  width: {
    type: String,
    default: 'max-w-3xl',
  },
  zIndex: {
    type: Number,
    default: 60,
  },
  confirmLabel: {
    type: String,
    default: '결재 요청',
  },
  cancelLabel: {
    type: String,
    default: '취소',
  },
})

const emit = defineEmits(['confirm', 'cancel'])

function getItemAlignmentClass(align) {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="title"
    :width="width"
    :z-index="zIndex"
    @close="emit('cancel')"
  >
    <div class="space-y-4 text-sm text-slate-600">
      <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p class="leading-6 text-slate-700">{{ message }}</p>
      </div>

      <div
        v-if="requestRows.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">{{ requestSectionTitle }}</p>
        </div>
        <dl class="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
          <div
            v-for="(row, index) in requestRows"
            :key="`${row.label}-${index}`"
            class="rounded-md border border-slate-200 bg-white px-4 py-3"
            :class="row.fullWidth ? 'md:col-span-2' : ''"
          >
            <dt class="text-xs font-medium text-slate-500">{{ row.label }}</dt>
            <dd class="mt-2 break-words text-sm font-medium text-slate-800">{{ row.value }}</dd>
          </div>
        </dl>
      </div>

      <div
        v-if="documentRows.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">{{ documentSectionTitle }}</p>
        </div>
        <dl class="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
          <div
            v-for="(row, index) in documentRows"
            :key="`${row.label}-${index}`"
            class="rounded-md border px-4 py-3"
            :class="[
              row.fullWidth ? 'md:col-span-2' : '',
              row.emphasis ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white',
            ]"
          >
            <dt class="text-xs font-medium text-slate-500">{{ row.label }}</dt>
            <dd
              class="mt-2 break-words text-slate-800"
              :class="row.emphasis ? 'text-base font-bold' : 'text-sm font-medium'"
            >
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </div>

      <div
        v-if="changeColumns.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">{{ changeSectionTitle }}</p>
        </div>

        <div class="max-h-[280px] overflow-auto">
          <table class="min-w-full border-collapse">
            <thead class="bg-slate-50">
              <tr>
                <th
                  v-for="column in changeColumns"
                  :key="column.key"
                  class="border-b border-r border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 last:border-r-0"
                  :class="getItemAlignmentClass(column.align)"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>

            <tbody v-if="changeRows.length" class="bg-white">
              <tr
                v-for="(row, rowIndex) in changeRows"
                :key="row.id ?? rowIndex"
                class="align-top"
              >
                <td
                  v-for="column in changeColumns"
                  :key="`${column.key}-${rowIndex}`"
                  class="border-b border-r border-slate-200 px-4 py-3 text-sm text-slate-700 last:border-r-0"
                  :class="getItemAlignmentClass(column.align)"
                >
                  {{ row[column.key] || '-' }}
                </td>
              </tr>
            </tbody>

            <tbody v-else class="bg-white">
              <tr>
                <td
                  :colspan="changeColumns.length"
                  class="px-4 py-10 text-center text-sm text-slate-400"
                >
                  변경 사항이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="itemColumns.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">{{ itemSectionTitle }}</p>
        </div>

        <div class="max-h-[320px] overflow-auto">
          <table class="min-w-full border-collapse">
            <thead class="bg-slate-50">
              <tr>
                <th
                  v-for="column in itemColumns"
                  :key="column.key"
                  class="border-b border-r border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 last:border-r-0"
                  :class="getItemAlignmentClass(column.align)"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>

            <tbody v-if="itemRows.length" class="bg-white">
              <tr
                v-for="(row, rowIndex) in itemRows"
                :key="row.id ?? rowIndex"
                class="align-top"
              >
                <td
                  v-for="column in itemColumns"
                  :key="`${column.key}-${rowIndex}`"
                  class="border-b border-r border-slate-200 px-4 py-3 text-sm text-slate-700 last:border-r-0"
                  :class="getItemAlignmentClass(column.align)"
                >
                  {{ row[column.key] || '-' }}
                </td>
              </tr>
            </tbody>

            <tbody v-else class="bg-white">
              <tr>
                <td
                  :colspan="itemColumns.length"
                  class="px-4 py-10 text-center text-sm text-slate-400"
                >
                  {{ itemEmptyText }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <dl
          v-if="itemSummaryRows.length"
          class="grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50 p-4 md:grid-cols-2"
        >
          <div
            v-for="(row, index) in itemSummaryRows"
            :key="`${row.label}-${index}`"
            class="rounded-md border px-4 py-3"
            :class="[
              row.fullWidth ? 'md:col-span-2' : '',
              row.emphasis ? 'border-slate-300 bg-white' : 'border-slate-200 bg-white',
            ]"
          >
            <dt class="text-xs font-medium text-slate-500">{{ row.label }}</dt>
            <dd
              class="mt-2 break-words text-slate-800"
              :class="row.emphasis ? 'text-base font-bold' : 'text-sm font-medium'"
            >
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </div>

      <div
        v-if="referenceRows.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">{{ referenceSectionTitle }}</p>
        </div>
        <dl class="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
          <div
            v-for="(row, index) in referenceRows"
            :key="`${row.label}-${index}`"
            class="rounded-md border px-4 py-3"
            :class="[
              row.fullWidth ? 'md:col-span-2' : '',
              row.emphasis ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white',
            ]"
          >
            <dt class="text-xs font-medium text-slate-500">{{ row.label }}</dt>
            <dd
              class="mt-2 break-words text-slate-800"
              :class="row.emphasis ? 'text-base font-bold' : 'text-sm font-medium'"
            >
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </div>

      <div
        v-if="helperText"
        class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"
      >
        {{ helperText }}
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('cancel')">{{ cancelLabel }}</BaseButton>
      <BaseButton @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
    </template>
  </BaseModal>
</template>
