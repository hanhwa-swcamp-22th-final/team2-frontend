<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const router = useRouter()
const isAdvancedOpen = ref(true)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')

const filters = ref({
  keyword: '',
  requestFrom: '',
  requestTo: '',
  clientName: '',
  country: '',
  shipmentCode: '',
  status: '',
  dueFrom: '',
  dueTo: '',
})

const appliedFilters = ref({
  ...filters.value,
})

const countryOptions = [
  { value: '말레이시아', label: '말레이시아' },
  { value: '베트남', label: '베트남' },
  { value: '독일', label: '독일' },
  { value: '미국', label: '미국' },
]

const statusOptions = [
  { value: '출하준비', label: '출하준비' },
  { value: '출하완료', label: '출하완료' },
]

const columns = [
  { key: 'id', label: '출하번호', align: 'center', width: '140px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'poId', label: 'PO', align: 'center', width: '140px' },
  { key: 'requestDate', label: '출하요청일', align: 'center', width: '130px' },
  { key: 'dueDate', label: '납기일', align: 'center', width: '130px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
]

const rows = [
  {
    id: 'SH26001',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    poId: 'PO26001',
    requestDate: '2026/03/26',
    dueDate: '2026/04/05',
    status: '출하준비',
  },
  {
    id: 'SH26004',
    clientName: 'Viet Steel JSC',
    country: '베트남',
    poId: 'PO26004',
    requestDate: '2026/03/12',
    dueDate: '2026/04/30',
    status: '출하준비',
  },
  {
    id: 'SH26005',
    clientName: 'Pacific Trading Inc.',
    country: '미국',
    poId: 'PO26003',
    requestDate: '2026/03/18',
    dueDate: '2026/06/05',
    status: '출하완료',
  },
]

const clientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아' },
  { id: 'CL002', name: 'Viet Steel JSC', country: '베트남' },
  { id: 'CL003', name: 'Pacific Trading Inc.', country: '미국' },
]

function normalizeDate(value) {
  return String(value ?? '').replaceAll('/', '-')
}

const filteredRows = computed(() => {
  return rows.filter((row) => {
    const keyword = appliedFilters.value.keyword.trim().toLowerCase()

    if (keyword) {
      const keywordMatched = [
        row.id,
        row.clientName,
        row.country,
        row.poId,
        row.requestDate,
        row.dueDate,
        row.status,
      ].some((value) => String(value).toLowerCase().includes(keyword))

      if (!keywordMatched) return false
    }

    if (appliedFilters.value.clientName && !row.clientName.toLowerCase().includes(appliedFilters.value.clientName.toLowerCase())) return false
    if (appliedFilters.value.country && row.country !== appliedFilters.value.country) return false
    if (appliedFilters.value.shipmentCode && !row.id.toLowerCase().includes(appliedFilters.value.shipmentCode.toLowerCase())) return false
    if (appliedFilters.value.status && row.status !== appliedFilters.value.status) return false

    const requestDate = normalizeDate(row.requestDate)
    const dueDate = normalizeDate(row.dueDate)

    if (appliedFilters.value.requestFrom && requestDate < appliedFilters.value.requestFrom) return false
    if (appliedFilters.value.requestTo && requestDate > appliedFilters.value.requestTo) return false
    if (appliedFilters.value.dueFrom && dueDate < appliedFilters.value.dueFrom) return false
    if (appliedFilters.value.dueTo && dueDate > appliedFilters.value.dueTo) return false

    return true
  })
})

const preparingCount = computed(() => filteredRows.value.filter((row) => row.status === '출하준비').length)
const completedCount = computed(() => filteredRows.value.filter((row) => row.status === '출하완료').length)
const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource
  return clientRowsSource.filter((row) => [row.id, row.name, row.country].some((value) => String(value).toLowerCase().includes(keyword)))
})

function resetFilters() {
  filters.value = {
    keyword: '',
    requestFrom: '',
    requestTo: '',
    clientName: '',
    country: '',
    shipmentCode: '',
    status: '',
    dueFrom: '',
    dueTo: '',
  }

  appliedFilters.value = {
    ...filters.value,
  }
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function handleClientSelect(client) {
  filters.value.clientName = client.name
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function goToDetail(id) {
  router.push({ name: 'shipment-detail', params: { id } })
}

function searchRows() {
  appliedFilters.value = {
    ...filters.value,
  }
}
</script>

<template>
  <div class="fade-in space-y-6">
    <DocumentPageHeader title="출하 현황" icon-class="fas fa-truck" />

    <FilterToolbarCard
      v-model="filters.keyword"
      :advanced-open="isAdvancedOpen"
      @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
    />

    <CollapsibleFilterCard :open="isAdvancedOpen">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
          <FormField label="출하요청일" class="col-span-2">
            <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <DateField v-model="filters.requestFrom" />
              <span class="text-center text-xs text-slate-400 sm:pb-2">~</span>
              <DateField v-model="filters.requestTo" />
            </div>
          </FormField>

          <FormField label="거래처">
            <SearchTriggerField
              v-model="filters.clientName"
              placeholder="거래처 검색..."
              title="거래처 검색"
              @trigger="openClientSearch"
            />
          </FormField>

          <FormField label="국가">
            <SearchableCombobox
              v-model="filters.country"
              :options="countryOptions"
              placeholder="국가 검색..."
            />
          </FormField>

          <FormField label="납기일" class="col-span-2">
            <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <DateField v-model="filters.dueFrom" />
              <span class="text-center text-xs text-slate-400 sm:pb-2">~</span>
              <DateField v-model="filters.dueTo" />
            </div>
          </FormField>

          <FormField label="출하번호">
            <SearchTriggerField
              v-model="filters.shipmentCode"
              placeholder="출하번호"
              title="출하번호 검색"
            />
          </FormField>

          <FormField label="상태">
            <SearchableCombobox
              v-model="filters.status"
              :options="statusOptions"
              placeholder="상태 선택..."
            />
          </FormField>
        </div>

        <div class="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <BaseButton variant="secondary" size="sm" @click="resetFilters">
            <template #leading>
              <i class="fas fa-undo text-[10px]" aria-hidden="true"></i>
            </template>
            초기화
          </BaseButton>
          <BaseButton size="sm" @click="searchRows">
            <template #leading>
              <i class="fas fa-search text-[10px]" aria-hidden="true"></i>
            </template>
            검색
          </BaseButton>
        </div>
    </CollapsibleFilterCard>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <BaseCard body-class="p-5 text-center">
        <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
          <i class="fas fa-box-open text-slate-500" aria-hidden="true"></i>
        </div>
        <div class="text-2xl font-bold text-slate-600">{{ preparingCount }}</div>
        <div class="mt-1 text-xs font-medium text-slate-500">출하준비</div>
      </BaseCard>

      <BaseCard body-class="p-5 text-center">
        <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
          <i class="fas fa-check-circle text-slate-500" aria-hidden="true"></i>
        </div>
        <div class="text-2xl font-bold text-slate-600">{{ completedCount }}</div>
        <div class="mt-1 text-xs font-medium text-slate-500">출하완료</div>
      </BaseCard>
    </section>

    <BaseTable
      :columns="columns"
      :rows="filteredRows"
      clickable-rows
      empty-text="데이터가 없습니다."
      :footer-text="`총 ${filteredRows.length}건`"
      @row-click="goToDetail($event.id)"
    >
      <template #cell-id="{ value }">
        <button type="button" class="font-mono text-xs font-semibold text-slate-700 hover:underline" @click.stop="goToDetail(value)">
          {{ value }}
        </button>
      </template>

      <template #cell-poId="{ value }">
        <span class="font-medium text-brand-500 hover:text-brand-700">{{ value }}</span>
      </template>

      <template #cell-clientName="{ value }">
        <span class="font-medium text-slate-800">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <StatusBadge :value="value" />
      </template>
    </BaseTable>

    <SearchModal
      :open="clientSearchOpen"
      title="거래처 검색"
      :columns="[
        { key: 'id', label: '코드' },
        { key: 'name', label: '거래처명' },
        { key: 'country', label: '국가' },
      ]"
      :rows="clientRows"
      :search-keyword="clientSearchKeyword"
      @update:search-keyword="clientSearchKeyword = $event"
      @close="clientSearchOpen = false"
      @select="handleClientSelect"
    />
  </div>
</template>
