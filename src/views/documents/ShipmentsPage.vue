<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { usePagination } from '@/composables/usePagination'
import { useSearchModalLookups } from '@/composables/useSearchModalLookups'
import { useShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'
import { clientSearchColumns } from '@/utils/searchModalColumns'

const router = useRouter()
const isAdvancedOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const shipmentSearchOpen = ref(false)
const shipmentSearchKeyword = ref('')

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

const rowsData = useShipmentStatusDocuments()

const { filters, filteredRows, resetFilters, applyFilters } = useDocumentFilter(rowsData, {
  keywordFields: ['id', 'clientName', 'country', 'poId', 'requestDate', 'dueDate', 'status'],
  issueDateField: 'requestDate',
  deliveryDateField: 'dueDate',
  codeField: 'id',
})
const { currentPage, totalPages, paginatedRows } = usePagination(filteredRows)
const { createClientRows } = useSearchModalLookups()

const preparingCount = computed(() => filteredRows.value.filter((row) => row.status === '출하준비').length)
const completedCount = computed(() => filteredRows.value.filter((row) => row.status === '출하완료').length)
const clientRows = createClientRows(clientSearchKeyword)

const shipmentRows = computed(() => {
  const keyword = shipmentSearchKeyword.value.trim().toLowerCase()
  const source = rowsData.value.map((row) => ({
    id: row.id,
    clientName: row.clientName,
    requestDate: row.requestDate,
  }))
  if (!keyword) return source
  return source.filter((row) => [row.id, row.clientName, row.requestDate].some((value) => String(value).toLowerCase().includes(keyword)))
})

function openClientSearch() {
  clientSearchOpen.value = true
}

function handleClientSelect(client) {
  filters.value.clientName = client.name
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function openShipmentSearch() {
  shipmentSearchOpen.value = true
}

function handleShipmentSelect(row) {
  filters.value.code = row.id
  shipmentSearchOpen.value = false
  shipmentSearchKeyword.value = ''
}

function goToDetail(id) {
  router.push({ name: 'shipment-detail', params: { id } })
}

function searchRows() {
  applyFilters()
}
</script>

<template>
  <div class="fade-in space-y-6">
    <PageHeader title="출하 현황 관리" icon-class="fas fa-truck" />

    <FilterToolbarCard
      v-model="filters.keyword"
      :advanced-open="isAdvancedOpen"
      @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
    />

    <CollapsibleFilterCard :open="isAdvancedOpen">
        <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
          <FormField label="출하요청일" class="col-span-2">
            <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <DateField v-model="filters.registeredFrom" />
              <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
              <DateField v-model="filters.registeredTo" />
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
              <DateField v-model="filters.deliveryFrom" />
              <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
              <DateField v-model="filters.deliveryTo" />
            </div>
          </FormField>

          <FormField label="출하번호">
            <SearchTriggerField
              v-model="filters.code"
              placeholder="출하번호"
              title="출하번호 검색"
              @trigger="openShipmentSearch"
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
              <i class="fas fa-undo text-xs" aria-hidden="true"></i>
            </template>
            초기화
          </BaseButton>
          <BaseButton size="sm" @click="searchRows">
            <template #leading>
              <i class="fas fa-search text-xs" aria-hidden="true"></i>
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
      :rows="paginatedRows"
      clickable-rows
      empty-text="데이터가 없습니다."
      :footer-text="`총 ${filteredRows.length}건`"
      @row-click="goToDetail($event.id)"
    >
      <template #cell-id="{ value }">
        <button type="button" class="font-mono text-xs font-semibold text-brand-600 hover:underline" @click.stop="goToDetail(value)">
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

    <BasePagination
      v-model:current-page="currentPage"
      :total-pages="totalPages"
    />

    <SearchModal
      :open="clientSearchOpen"
      title="거래처 검색"
      :columns="clientSearchColumns"
      :rows="clientRows"
      :search-keyword="clientSearchKeyword"
      @update:search-keyword="clientSearchKeyword = $event"
      @close="clientSearchOpen = false"
      @select="handleClientSelect"
    />

    <SearchModal
      :open="shipmentSearchOpen"
      title="출하번호 검색"
      :columns="[
        { key: 'id', label: '출하번호' },
        { key: 'clientName', label: '거래처명' },
        { key: 'requestDate', label: '출하요청일' },
      ]"
      :rows="shipmentRows"
      :search-keyword="shipmentSearchKeyword"
      @update:search-keyword="shipmentSearchKeyword = $event"
      @close="shipmentSearchOpen = false"
      @select="handleShipmentSelect"
    />
  </div>
</template>
