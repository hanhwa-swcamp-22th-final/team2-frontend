<script setup>
import { ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'

const isAdvancedOpen = ref(true)

const columns = [
  { key: 'id', label: '문서번호', align: 'center', width: '150px' },
  { key: 'invoiceDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'invoiceNo', label: '송장번호', align: 'center', width: '150px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'actions', label: '', align: 'center', width: '120px' },
]
</script>

<template>
  <div class="fade-in space-y-4">
    <section class="flex items-center justify-between">
      <h2 class="flex items-center gap-2.5 text-xl font-bold text-slate-900">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
          <i class="fas fa-file-invoice-dollar text-sm text-brand-600" aria-hidden="true"></i>
        </div>
        CI (Commercial Invoice)
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

    <BaseCard v-if="isAdvancedOpen">
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <div class="h-16 rounded-lg border border-slate-200 bg-white"></div>
        <div class="h-16 rounded-lg border border-slate-200 bg-white"></div>
        <div class="h-16 rounded-lg border border-slate-200 bg-white"></div>
        <div class="h-16 rounded-lg border border-slate-200 bg-white"></div>
      </div>
    </BaseCard>

    <BaseTable
      :columns="columns"
      :rows="[]"
      empty-text="CI 화면 레이아웃만 먼저 구성된 상태입니다."
      footer-text="총 0건"
    />
  </div>
</template>
