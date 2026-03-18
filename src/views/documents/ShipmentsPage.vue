<script setup>
import { ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const isAdvancedOpen = ref(true)

const columns = [
  { key: 'id', label: '출하번호', align: 'center', width: '140px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'poId', label: 'PO', align: 'center', width: '140px' },
  { key: 'requestDate', label: '출하요청일', align: 'center', width: '130px' },
  { key: 'dueDate', label: '납기일', align: 'center', width: '130px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
]

const rows = []
</script>

<template>
  <div class="fade-in space-y-6">
    <section class="flex items-center justify-between">
      <h2 class="flex items-center gap-2.5 text-xl font-bold text-slate-900">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
          <i class="fas fa-truck text-sm text-brand-600" aria-hidden="true"></i>
        </div>
        출하 현황
      </h2>
    </section>

    <BaseCard body-class="overflow-hidden p-0">
      <button
        type="button"
        class="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50"
        @click="isAdvancedOpen = !isAdvancedOpen"
      >
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <i class="fas fa-filter text-xs text-brand-500" aria-hidden="true"></i>
          상세검색
        </span>
        <i
          class="fas fa-chevron-up text-xs text-slate-400 transition-transform"
          :class="isAdvancedOpen ? '' : 'rotate-180'"
          aria-hidden="true"
        ></i>
      </button>

      <div v-if="isAdvancedOpen" class="border-t border-slate-100 px-5 pb-4 pt-3">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
          <div class="col-span-2 h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
          <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
          <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
          <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
          <div class="col-span-2 h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
        </div>

        <div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <BaseButton variant="secondary" size="sm">
            <template #leading>
              <i class="fas fa-undo text-[10px]" aria-hidden="true"></i>
            </template>
            초기화
          </BaseButton>
          <BaseButton size="sm">
            <template #leading>
              <i class="fas fa-search text-[10px]" aria-hidden="true"></i>
            </template>
            검색
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <section class="grid grid-cols-2 gap-4">
      <BaseCard body-class="p-5 text-center">
        <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
          <i class="fas fa-box-open text-slate-500" aria-hidden="true"></i>
        </div>
        <div class="text-2xl font-bold text-slate-600">0</div>
        <div class="mt-1 text-xs font-medium text-slate-500">출하준비</div>
      </BaseCard>

      <BaseCard body-class="p-5 text-center">
        <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
          <i class="fas fa-check-circle text-slate-500" aria-hidden="true"></i>
        </div>
        <div class="text-2xl font-bold text-slate-600">0</div>
        <div class="mt-1 text-xs font-medium text-slate-500">출하완료</div>
      </BaseCard>
    </section>

    <BaseTable
      :columns="columns"
      :rows="rows"
      empty-text="데이터가 없습니다."
      footer-text="총 0건"
    />
  </div>
</template>
