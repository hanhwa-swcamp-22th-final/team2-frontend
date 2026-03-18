<script setup>
import { ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'
import FormField from '@/components/common/FormField.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'

const isAdvancedOpen = ref(true)

const filters = ref({
  keyword: '',
  registeredFrom: '',
  registeredTo: '',
  manager: '',
  clientName: '',
  code: '',
  productName: '',
  country: '',
})

const managerOptions = [
  { value: '김영업', label: '김영업' },
  { value: '정영업', label: '정영업' },
  { value: '최관리', label: '최관리' },
]

const countryOptions = [
  { value: '말레이시아', label: '말레이시아' },
  { value: '독일', label: '독일' },
  { value: '미국', label: '미국' },
  { value: '태국', label: '태국' },
  { value: '싱가포르', label: '싱가포르' },
]

const columns = [
  { key: 'id', label: '문서번호', align: 'center', width: '150px' },
  { key: 'invoiceDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'actions', label: '', align: 'center', width: '120px' },
]

const rows = [
  {
    id: 'CI26001',
    invoiceDate: '2026/02/18',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$42,400',
  },
  {
    id: 'CI26002',
    invoiceDate: '2026/02/28',
    clientName: 'TechBridge GmbH',
    country: '독일',
    itemName: 'H-Beam 482x300x11x15',
    amount: '€68,400',
  },
  {
    id: 'CI26003',
    invoiceDate: '2026/03/12',
    clientName: 'Pacific Trading Inc.',
    country: '미국',
    itemName: 'Lubricant Oil SAE 10W-40',
    amount: '$15,600',
  },
]

function resetFilters() {
  filters.value = {
    keyword: '',
    registeredFrom: '',
    registeredTo: '',
    manager: '',
    clientName: '',
    code: '',
    productName: '',
    country: '',
  }
}

function openClientSearch() {}

function openCodeSearch() {}

function openProductSearch() {}
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
          v-model="filters.keyword"
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
        <FormField label="등록일" class="col-span-2">
          <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-1">
            <DateField v-model="filters.registeredFrom" />
            <span class="pb-2 text-sm text-slate-400">~</span>
            <DateField v-model="filters.registeredTo" />
          </div>
        </FormField>

        <FormField label="담당자">
          <SearchableCombobox
            v-model="filters.manager"
            :options="managerOptions"
            placeholder="담당자 검색..."
          />
        </FormField>

        <FormField label="거래처명">
          <SearchTriggerField
            v-model="filters.clientName"
            placeholder="거래처 검색..."
            title="거래처 검색"
            @trigger="openClientSearch"
          />
        </FormField>

        <FormField label="코드">
          <SearchTriggerField
            v-model="filters.code"
            placeholder="문서번호"
            title="코드 검색"
            @trigger="openCodeSearch"
          />
        </FormField>

        <FormField label="품목명">
          <SearchTriggerField
            v-model="filters.productName"
            placeholder="품목명 검색..."
            title="품목명 검색"
            @trigger="openProductSearch"
          />
        </FormField>

        <FormField label="국가">
          <SearchableCombobox
            v-model="filters.country"
            :options="countryOptions"
            placeholder="국가 검색..."
          />
        </FormField>
      </div>

      <div class="mt-3 flex justify-end gap-2">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">
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
      :footer-text="`총 ${rows.length}건`"
    >
      <template #cell-id="{ value }">
        <span class="font-mono text-xs font-semibold text-brand-600">{{ value }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-center gap-2">
          <button type="button" class="text-xs text-brand-500 transition hover:underline" :title="`${row.id} 미리보기`">
            <i class="fas fa-eye mr-1" aria-hidden="true"></i>미리보기
          </button>
        </div>
      </template>
    </BaseTable>
  </div>
</template>
