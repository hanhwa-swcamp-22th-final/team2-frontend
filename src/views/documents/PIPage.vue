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
  { key: 'id', label: 'PI번호', align: 'center', width: '140px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'manager', label: '담당자', align: 'center', width: '120px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
  { key: 'deliveryDate', label: '납기', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'center', width: '90px' },
]

const rows = [
  {
    id: 'PI26001',
    issueDate: '2026/02/01',
    clientName: 'COOLSAY SDN BHD',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$42,400',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/04/15',
  },
  {
    id: 'PI26002',
    issueDate: '2026/02/15',
    clientName: 'TechBridge GmbH',
    itemName: 'H-Beam 482x300x11x15',
    amount: '€68,400',
    manager: '김영업',
    status: '발송',
    deliveryDate: '2026/05/20',
  },
  {
    id: 'PI26003',
    issueDate: '2026/03/01',
    clientName: 'Pacific Trading Inc.',
    itemName: 'Lubricant Oil SAE 10W-40',
    amount: '$15,600',
    manager: '정영업',
    status: '초안',
    deliveryDate: '2026/06/01',
  },
  {
    id: 'PI26004',
    issueDate: '2025/12/10',
    clientName: 'Viet Steel JSC',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$53,600',
    manager: '정영업',
    status: '확정',
    deliveryDate: '2026/04/30',
  },
  {
    id: 'PI26005',
    issueDate: '2026/01/15',
    clientName: 'Siam Industrial Co., Ltd.',
    itemName: 'H-Beam 488x300x11x18',
    amount: '$38,850',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/05/15',
  },
  {
    id: 'PI26006',
    issueDate: '2026/03/05',
    clientName: 'Meridian Engineering Pte Ltd',
    itemName: 'Seamless Steel Pipe 168x7',
    amount: '$29,700',
    manager: '정영업',
    status: '발송',
    deliveryDate: '2026/06/10',
  },
  {
    id: 'PI26007',
    issueDate: '2026/01/20',
    clientName: 'Tata Steel Traders Pvt Ltd',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$76,400',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/05/30',
  },
  {
    id: 'PI26008',
    issueDate: '2026/03/10',
    clientName: 'OzSteel Supplies Pty Ltd',
    itemName: 'Hydraulic Cylinder 100x500',
    amount: '$23,960',
    manager: '정영업',
    status: '초안',
    deliveryDate: '2026/06/30',
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
  <div class="fade-in space-y-4">
    <section class="flex items-center justify-between">
      <h2 class="flex items-center gap-2.5 text-xl font-bold text-slate-900">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
          <i class="fas fa-file-invoice text-sm text-brand-600" aria-hidden="true"></i>
        </div>
        PI 관리
      </h2>

      <BaseButton>
        <template #leading>
          <i class="fas fa-plus text-xs" aria-hidden="true"></i>
        </template>
        PI 작성
      </BaseButton>
    </section>

    <BaseCard body-class="flex flex-wrap items-center justify-between gap-3" class="mb-4">
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

    <BaseCard
      v-if="isAdvancedOpen"
      body-class="space-y-4"
      class="mb-4"
    >
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <FormField label="등록일" class="col-span-2">
          <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-1">
            <div>
              <DateField v-model="filters.registeredFrom" />
            </div>
            <span class="pb-2 text-sm text-slate-400">~</span>
            <div>
              <DateField v-model="filters.registeredTo" />
            </div>
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

        <FormField label="상태">
          <SearchableCombobox
            v-model="filters.status"
            :options="statusOptions"
            placeholder="상태 선택..."
          />
        </FormField>

        <FormField label="납기일" class="col-span-2">
          <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-1">
            <div>
              <DateField v-model="filters.deliveryFrom" />
            </div>
            <span class="pb-2 text-sm text-slate-400">~</span>
            <div>
              <DateField v-model="filters.deliveryTo" />
            </div>
          </div>
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

      <template #cell-status="{ value }">
        <StatusBadge :value="value" />
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1.5">
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
