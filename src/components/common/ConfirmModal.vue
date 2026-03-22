<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '확인',
  },
  message: {
    type: String,
    default: '',
  },
  detail: {
    type: String,
    default: '',
  },
  detailRows: {
    type: Array,
    default: () => [],
  },
  tableColumns: {
    type: Array,
    default: () => [],
  },
  tableRows: {
    type: Array,
    default: () => [],
  },
  summaryRows: {
    type: Array,
    default: () => [],
  },
  confirmLabel: {
    type: String,
    default: '확인',
  },
  cancelLabel: {
    type: String,
    default: '취소',
  },
  confirmVariant: {
    type: String,
    default: 'primary',
  },
  helperText: {
    type: String,
    default: '이 작업은 되돌릴 수 없습니다.',
  },
  width: {
    type: String,
    default: 'max-w-sm',
  },
  zIndex: {
    type: Number,
    default: 50,
  },
})

const emit = defineEmits(['confirm', 'cancel'])
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
        v-if="detail"
        class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800"
      >
        {{ detail }}
      </div>
      <div
        v-if="detailRows.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-slate-800">등록 예정 정보</p>
          </div>
        </div>
        <dl class="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
          <div
            v-for="(row, index) in detailRows"
            :key="`${row.label}-${index}`"
            class="rounded-md border px-4 py-3"
            :class="[
              row.fullWidth ? 'md:col-span-2' : '',
              row.emphasis ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white',
            ]"
          >
            <dt class="text-xs font-medium text-slate-500">{{ row.label }}</dt>
            <dd
              class="mt-2 break-words text-right text-slate-800"
              :class="row.emphasis ? 'text-base font-bold' : 'text-sm font-medium'"
            >
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </div>
      <div
        v-if="tableColumns.length && tableRows.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">품목 목록</p>
        </div>
        <div class="max-h-[280px] overflow-y-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead class="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th
                  v-for="column in tableColumns"
                  :key="column.key"
                  class="border-b border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-500"
                  :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in tableRows"
                :key="row.id ?? row.name ?? index"
                class="border-b border-slate-100 last:border-b-0"
              >
                <td
                  v-for="column in tableColumns"
                  :key="`${column.key}-${index}`"
                  class="px-4 py-3 text-slate-700"
                  :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
                >
                  {{ row[column.key] || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div
        v-if="summaryRows.length"
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div class="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
          <div
            v-for="(row, index) in summaryRows"
            :key="`${row.label}-${index}`"
            class="flex items-center justify-between px-4 py-3"
          >
            <span class="text-xs font-medium text-slate-500">{{ row.label }}</span>
            <span class="text-sm font-semibold text-slate-800">{{ row.value }}</span>
          </div>
        </div>
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
      <BaseButton :variant="confirmVariant" @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
    </template>
  </BaseModal>
</template>
