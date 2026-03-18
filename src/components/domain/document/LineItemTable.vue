<script setup>
import BaseTable from '@/components/common/BaseTable.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  currencySymbol: {
    type: String,
    default: '$',
  },
  amountLabel: {
    type: String,
    default: '금액',
  },
})

const columns = [
  { key: 'description', label: '품목', align: 'center' },
  { key: 'qty', label: '수량', align: 'center', width: '90px' },
  { key: 'unitPrice', label: '단가', align: 'right', width: '120px' },
  { key: 'amount', label: props.amountLabel, align: 'right', width: '140px' },
]

function formatAmount(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return `${props.currencySymbol}${Number(value).toLocaleString()}`
}
</script>

<template>
  <BaseTable
    :columns="columns"
    :rows="items"
    row-key="id"
    empty-text="등록된 품목이 없습니다."
  >
    <template #cell-qty="{ value }">
      {{ Number(value || 0).toLocaleString() }}
    </template>
    <template #cell-unitPrice="{ value }">
      {{ formatAmount(value) }}
    </template>
    <template #cell-amount="{ value }">
      <span class="font-semibold text-ink">{{ formatAmount(value) }}</span>
    </template>
  </BaseTable>
</template>
