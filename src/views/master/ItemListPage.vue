<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import ItemFormModal from '@/components/domain/master/ItemFormModal.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success } = useToast()

const items = ref([
  { id: 1, code: 'ITM-001', name: 'Hot Rolled Steel Coil', nameKr: '열연 강판 코일', category: 'Steel', spec: '1200 × 2400 × 3 mm', unit: 'MT', packUnit: 'BUNDLE', unitPrice: 850000, weight: 5000, hsCode: '7208.51' },
  { id: 2, code: 'ITM-002', name: 'Cold Rolled Steel Sheet', nameKr: '냉연 강판', category: 'Steel', spec: '1000 × 2000 × 1.5 mm', unit: 'MT', packUnit: 'PALLET', unitPrice: 920000, weight: 3000, hsCode: '7209.16' },
  { id: 3, code: 'ITM-003', name: 'Seamless Steel Pipe', nameKr: '무봉강관', category: 'Pipe', spec: '114 × 6000 × 8 mm', unit: 'EA', packUnit: 'BUNDLE', unitPrice: 125000, weight: 120, hsCode: '7304.19' },
  { id: 4, code: 'ITM-004', name: 'Welded Steel Pipe', nameKr: '용접강관', category: 'Pipe', spec: '219 × 12000 × 6 mm', unit: 'EA', packUnit: 'BUNDLE', unitPrice: 98000, weight: 200, hsCode: '7306.30' },
  { id: 5, code: 'ITM-005', name: 'Lubricant Oil #32', nameKr: '윤활유 #32', category: 'Oil', spec: '200 × 200 × 500 mm', unit: 'EA', packUnit: 'CASE', unitPrice: 45000, weight: 18, hsCode: '2710.19' },
  { id: 6, code: 'ITM-006', name: 'Hydraulic Press Machine', nameKr: '유압 프레스', category: 'Machinery', spec: '2500 × 1800 × 3200 mm', unit: 'SET', packUnit: 'LOOSE', unitPrice: 75000000, weight: 8500, hsCode: '8462.10' },
  { id: 7, code: 'ITM-007', name: 'Stainless Steel Bar', nameKr: '스테인리스 봉강', category: 'Steel', spec: '50 × 50 × 6000 mm', unit: 'KG', packUnit: 'BUNDLE', unitPrice: 4500, weight: 117, hsCode: '7222.11' },
  { id: 8, code: 'ITM-008', name: 'ERW Pipe', nameKr: 'ERW 강관', category: 'Pipe', spec: '76 × 6000 × 3 mm', unit: 'EA', packUnit: 'PALLET', unitPrice: 67000, weight: 32, hsCode: '7306.30' },
  { id: 9, code: 'ITM-009', name: 'Cutting Oil', nameKr: '절삭유', category: 'Oil', spec: '150 × 150 × 300 mm', unit: 'EA', packUnit: 'CASE', unitPrice: 32000, weight: 5, hsCode: '3403.19' },
  { id: 10, code: 'ITM-010', name: 'CNC Lathe', nameKr: 'CNC 선반', category: 'Machinery', spec: '3000 × 1500 × 1800 mm', unit: 'SET', packUnit: 'LOOSE', unitPrice: 120000000, weight: 4200, hsCode: '8458.11' },
])

const searchKeyword = ref('')
const categoryFilter = ref('')

const showFormModal = ref(false)
const formMode = ref('create')
const selectedItem = ref(null)

const categoryFilterOptions = [
  { label: '전체 카테고리', value: '' },
  { label: 'Steel', value: 'Steel' },
  { label: 'Pipe', value: 'Pipe' },
  { label: 'Oil', value: 'Oil' },
  { label: 'Machinery', value: 'Machinery' },
]

const columns = [
  { key: 'code', label: '코드', width: '100px' },
  { key: 'name', label: '품목명' },
  { key: 'spec', label: '규격', width: '200px' },
  { key: 'packUnit', label: '포장단위', width: '100px', align: 'center' },
  { key: 'unit', label: '단위', width: '80px', align: 'center' },
  { key: 'unitPrice', label: '단가 (KRW)', width: '140px', align: 'right' },
  { key: 'weight', label: '중량 (kg)', width: '110px', align: 'right' },
  { key: 'hsCode', label: '관세코드', width: '100px', align: 'center' },
  { key: 'actions', label: '액션', width: '120px', align: 'center' },
]

const filteredItems = computed(() => {
  let result = items.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(
      (item) => item.name.toLowerCase().includes(kw) || item.nameKr.includes(kw) || item.code.toLowerCase().includes(kw),
    )
  }

  if (categoryFilter.value) {
    result = result.filter((item) => item.category === categoryFilter.value)
  }

  return result
})

function openCreateModal() {
  selectedItem.value = null
  formMode.value = 'create'
  showFormModal.value = true
}

function openEditModal(item) {
  selectedItem.value = item
  formMode.value = 'edit'
  showFormModal.value = true
}

function handleDelete(item) {
  items.value = items.value.filter((i) => i.id !== item.id)
  success(`${item.name} 품목이 삭제되었습니다.`)
}

function handleRowClick(event) {
  const tr = event.target.closest('tbody tr')
  if (!tr) return
  const rows = Array.from(tr.parentElement.children)
  const index = rows.indexOf(tr)
  if (index < 0 || index >= filteredItems.value.length) return
  router.push({ name: 'item-detail', params: { id: filteredItems.value[index].id } })
}
</script>

<template>
  <div class="space-y-6">
    <PageTitleBar title="품목 관리">
      <template #actions>
        <BaseButton variant="primary" @click="openCreateModal">신규등록</BaseButton>
      </template>
    </PageTitleBar>

    <div class="flex flex-wrap items-center gap-3">
      <div class="min-w-0 flex-1">
        <SearchInput v-model="searchKeyword" placeholder="코드, 품목명으로 검색" />
      </div>
      <div class="w-40">
        <BaseSelect v-model="categoryFilter" :options="categoryFilterOptions" placeholder="전체 카테고리" />
      </div>
    </div>

    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div class="cursor-pointer" @click="handleRowClick">
    <BaseTable :columns="columns" :rows="filteredItems" row-key="id">
      <template #cell-code="{ row }">
        <span class="font-semibold text-brand">{{ row.code }}</span>
      </template>

      <template #cell-name="{ row }">
        <div>
          <p class="font-medium text-ink">{{ row.name }}</p>
          <p class="text-xs text-slate-500">{{ row.nameKr }}</p>
        </div>
      </template>

      <template #cell-unitPrice="{ row }">
        {{ row.unitPrice.toLocaleString() }}
      </template>

      <template #cell-weight="{ row }">
        {{ row.weight.toLocaleString() }}
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-center gap-1">
          <BaseButton variant="ghost" size="sm" @click.stop="openEditModal(row)">수정</BaseButton>
          <BaseButton variant="ghost" size="sm" @click.stop="handleDelete(row)">삭제</BaseButton>
        </div>
      </template>
    </BaseTable>
    </div>

    <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span>총 {{ filteredItems.length }}건</span>
    </div>

    <ItemFormModal
      :open="showFormModal"
      :mode="formMode"
      :item="selectedItem"
      @close="showFormModal = false"
      @save="showFormModal = false"
    />
  </div>
</template>
