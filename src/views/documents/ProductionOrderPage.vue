<script setup>
import { ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

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
  status: '',
  deliveryFrom: '',
  deliveryTo: '',
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
  { value: '인도', label: '인도' },
]

const statusOptions = [
  { value: '대기', label: '대기' },
  { value: '진행중', label: '진행중' },
  { value: '완료', label: '완료' },
]

const columns = [
  { key: 'id', label: '지시서번호', align: 'center', width: '150px' },
  { key: 'issueDate', label: '생산지시일', align: 'center', width: '130px' },
  { key: 'poId', label: 'PO', align: 'center', width: '140px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'manager', label: '영업담당자', align: 'center', width: '120px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
  { key: 'dueDate', label: '납기', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'center', width: '120px' },
]

const rows = [
  {
    id: 'MO2026001',
    issueDate: '2026/02/24',
    poId: 'PO26001',
    country: '말레이시아',
    clientName: 'COOLSAY SDN BHD',
    itemName: 'H-Beam 482x300x11x15',
    manager: '김영업',
    status: '완료',
    dueDate: '2026/04/20',
  },
  {
    id: 'MO2026002',
    issueDate: '2026/03/03',
    poId: 'PO26002',
    country: '독일',
    clientName: 'TechBridge GmbH',
    itemName: 'H-Beam 482x300x11x15',
    manager: '김영업',
    status: '진행중',
    dueDate: '2026/05/25',
  },
  {
    id: 'MO2026003',
    issueDate: '2026/03/14',
    poId: 'PO26003',
    country: '미국',
    clientName: 'Pacific Trading Inc.',
    itemName: 'Lubricant Oil SAE 10W-40',
    manager: '정영업',
    status: '대기',
    dueDate: '2026/06/05',
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
    status: '',
    deliveryFrom: '',
    deliveryTo: '',
  }
}

function openClientSearch() {}

function openCodeSearch() {}

function openProductSearch() {}
</script>

<template>
  <div class="fade-in space-y-5">
    <DocumentPageHeader title="생산지시서" icon-class="fas fa-industry">
      <template #actions>
        <BaseButton variant="secondary" size="sm">
          <template #leading>
            <i class="fas fa-print text-xs" aria-hidden="true"></i>
          </template>
          인쇄
        </BaseButton>
        <BaseButton size="sm">
          <template #leading>
            <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
          </template>
          PDF 다운로드
        </BaseButton>
      </template>
    </DocumentPageHeader>

    <FilterToolbarCard
      v-model="filters.keyword"
      :advanced-open="isAdvancedOpen"
      @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
    />

    <CollapsibleFilterCard :open="isAdvancedOpen">
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <FormField label="생산지시일" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <DateField v-model="filters.registeredFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filters.registeredTo" />
          </div>
        </FormField>

        <FormField label="영업담당자">
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

        <FormField label="지시서번호">
          <SearchTriggerField
            v-model="filters.code"
            placeholder="지시서번호"
            title="지시서번호 검색"
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

        <FormField label="상태">
          <SearchableCombobox
            v-model="filters.status"
            :options="statusOptions"
            placeholder="상태 선택..."
          />
        </FormField>

        <FormField label="납기일" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <DateField v-model="filters.deliveryFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filters.deliveryTo" />
          </div>
        </FormField>
      </div>

      <div class="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
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
    </CollapsibleFilterCard>

    <BaseTable
      :columns="columns"
      :rows="rows"
      empty-text="데이터가 없습니다."
      :footer-text="`총 ${rows.length}건`"
    >
      <template #cell-id="{ value }">
        <span class="font-mono text-xs font-semibold text-brand-600">{{ value }}</span>
      </template>

      <template #cell-poId="{ value }">
        <span class="text-brand-500 hover:underline">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <StatusBadge :value="value" />
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-center gap-2">
          <button type="button" class="text-xs text-brand-500 transition hover:underline" :title="`${row.id} 미리보기`">
            <i class="fas fa-eye" aria-hidden="true"></i>
          </button>
          <button type="button" class="text-xs text-slate-400 transition hover:text-slate-700" :title="`${row.id} 인쇄`">
            <i class="fas fa-print" aria-hidden="true"></i>
          </button>
          <button type="button" class="text-xs text-slate-400 transition hover:text-slate-700" :title="`${row.id} PDF 다운로드`">
            <i class="fas fa-file-pdf" aria-hidden="true"></i>
          </button>
        </div>
      </template>
    </BaseTable>
  </div>
</template>
