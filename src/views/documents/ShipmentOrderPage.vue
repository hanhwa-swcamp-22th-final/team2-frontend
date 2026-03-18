<script setup>
import { ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'

const isAdvancedOpen = ref(true)

const columns = [
  { key: 'id', label: '지시서번호', align: 'center', width: '150px' },
  { key: 'issueDate', label: '요청일', align: 'center', width: '130px' },
  { key: 'poId', label: '원천PO', align: 'center', width: '140px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'manager', label: '담당자', align: 'center', width: '120px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
  { key: 'dueDate', label: '납기', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'center', width: '120px' },
]

const rows = []
</script>

<template>
  <div class="fade-in space-y-4">
    <section class="flex items-center justify-between">
      <h2 class="flex items-center gap-2.5 text-xl font-bold text-slate-900">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
          <i class="fas fa-truck-loading text-sm text-brand-600" aria-hidden="true"></i>
        </div>
        출하지시서
      </h2>

      <div class="flex items-center gap-2">
        <BaseButton variant="secondary">
          <template #leading>
            <i class="fas fa-print text-xs" aria-hidden="true"></i>
          </template>
          인쇄
        </BaseButton>
        <BaseButton>
          <template #leading>
            <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
          </template>
          PDF 다운로드
        </BaseButton>
      </div>
    </section>

    <BaseCard body-class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative w-full sm:max-w-[320px]">
        <i class="fas fa-search absolute left-3 top-2.5 text-xs text-slate-400" aria-hidden="true"></i>
        <BaseTextField
          placeholder="검색어 입력..."
          class="pl-9"
        />
      </div>

      <BaseButton
        variant="secondary"
        size="sm"
        class="shrink-0"
        :class="isAdvancedOpen ? 'border-brand-200 bg-slate-50 text-brand-600' : ''"
        @click="isAdvancedOpen = !isAdvancedOpen"
      >
        <template #leading>
          <i class="fas fa-sliders-h text-xs" aria-hidden="true"></i>
        </template>
        상세검색
      </BaseButton>
    </BaseCard>

    <BaseCard v-if="isAdvancedOpen" body-class="space-y-4">
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
        <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
        <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
        <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
        <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
        <div class="h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
        <div class="col-span-2 h-[74px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60"></div>
      </div>

      <div class="mt-3 flex justify-end gap-2">
        <BaseButton variant="secondary" size="sm">
          <template #leading>
            <i class="fas fa-undo text-xs" aria-hidden="true"></i>
          </template>
          초기화
        </BaseButton>
        <BaseButton size="sm">
          <template #leading>
            <i class="fas fa-search text-xs" aria-hidden="true"></i>
          </template>
          검색
        </BaseButton>
      </div>
    </BaseCard>

    <BaseTable
      :columns="columns"
      :rows="rows"
      empty-text="데이터가 없습니다."
      footer-text="총 0건"
    />
  </div>
</template>
