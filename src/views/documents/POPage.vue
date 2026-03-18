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
  { value: '호주', label: '호주' },
]

const statusOptions = [
  { value: '초안', label: '초안' },
  { value: '발송', label: '발송' },
  { value: '확정', label: '확정' },
  { value: '취소', label: '취소' },
]

const columns = [
  { key: 'id', label: 'PO번호', align: 'center', width: '140px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'manager', label: '영업담당자', align: 'center', width: '120px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
  { key: 'deliveryDate', label: '납기', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'center', width: '90px' },
]

const rows = [
  {
    id: 'PO26001',
    issueDate: '2026/02/05',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$42,400',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/04/20',
  },
  {
    id: 'PO26002',
    issueDate: '2026/02/20',
    clientName: 'TechBridge GmbH',
    country: '독일',
    itemName: 'H-Beam 482x300x11x15',
    amount: '€68,400',
    manager: '김영업',
    status: '발송',
    deliveryDate: '2026/05/25',
  },
  {
    id: 'PO26003',
    issueDate: '2026/03/03',
    clientName: 'Pacific Trading Inc.',
    country: '미국',
    itemName: 'Lubricant Oil SAE 10W-40',
    amount: '$15,600',
    manager: '정영업',
    status: '초안',
    deliveryDate: '2026/06/05',
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
    <DocumentPageHeader title="PO 관리" icon-class="fas fa-file-contract">
      <template #actions>
      <BaseButton>
        <template #leading>
          <i class="fas fa-plus text-xs" aria-hidden="true"></i>
        </template>
        PO 작성
      </BaseButton>
      </template>
    </DocumentPageHeader>

    <FilterToolbarCard
      v-model="filters.keyword"
      :advanced-open="isAdvancedOpen"
      class="mb-4"
      @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
    />

    <CollapsibleFilterCard
      :open="isAdvancedOpen"
      class="mb-4"
      @toggle="isAdvancedOpen = !isAdvancedOpen"
    >
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <FormField label="발행일" class="col-span-2">
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

        <FormField label="PO번호">
          <SearchTriggerField
            v-model="filters.code"
            placeholder="PO번호"
            title="PO번호 검색"
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
          <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-1">
            <DateField v-model="filters.deliveryFrom" />
            <span class="pb-2 text-sm text-slate-400">~</span>
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

      <template #cell-status="{ value }">
        <StatusBadge :value="value" />
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-center gap-1.5">
          <button type="button" class="text-xs text-slate-500 transition hover:text-slate-700" :title="`${row.id} 수정`">
            <i class="fas fa-edit" aria-hidden="true"></i>
          </button>
          <button type="button" class="text-xs text-slate-400 transition hover:text-slate-700" :title="`${row.id} 삭제`">
            <i class="fas fa-trash" aria-hidden="true"></i>
          </button>
        </div>
      </template>
    </BaseTable>
  </div>
</template>
