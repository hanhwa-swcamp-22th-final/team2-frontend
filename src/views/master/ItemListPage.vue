<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TableActions from '@/components/common/TableActions.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ItemFormModal from '@/components/domain/master/ItemFormModal.vue'
import { changeItemStatus, createItem, fetchItems, updateItem } from '@/api/master'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { canManageItems } from '@/utils/roleAccess'

const router = useRouter()
const { success, error } = useToast()
const authStore = useAuthStore()
const isItemAdmin = computed(() => canManageItems(authStore.currentUser?.role))

const items = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const isAdvancedOpen = ref(false)

const filters = ref({
  keyword: '',
  code: '',
  name: '',
  category: '',
  unit: '',
  status: '',
})

const appliedFilters = ref({ keyword: '', code: '', name: '', category: '', unit: '', status: '' })

const statusOptions = [
  { label: '전체', value: '' },
  { label: '활성', value: '활성' },
  { label: '비활성', value: '비활성' },
]

const unitOptions = computed(() => {
  const units = [...new Set(items.value.map((i) => i.unit).filter(Boolean))]
  return [{ label: '전체', value: '' }, ...units.map((u) => ({ label: u, value: u }))]
})

function resetFilters() {
  filters.value = { keyword: '', code: '', name: '', category: '', unit: '', status: '' }
  appliedFilters.value = { keyword: '', code: '', name: '', category: '', unit: '', status: '' }
  currentPage.value = 1
}

function searchRows() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

const PAGE_SIZE = 10
const currentPage = ref(1)

const showFormModal = ref(false)
const formMode = ref('create')
const selectedItem = ref(null)

const showConfirmModal = ref(false)
const itemToDelete = ref(null)

const categoryOptions = computed(() => {
  const cats = [...new Set(items.value.map((i) => i.category).filter(Boolean))]
  return [{ label: '전체', value: '' }, ...cats.map((c) => ({ label: c, value: c }))]
})

const columns = computed(() => {
  const base = [
    { key: 'code', label: '코드', width: '100px', align: 'center' },
    { key: 'name', label: '품목명' },
    { key: 'spec', label: '규격', width: '200px' },
    { key: 'packUnit', label: '포장단위', width: '100px', align: 'center' },
    { key: 'unit', label: '단위', width: '80px', align: 'center' },
    { key: 'unitPrice', label: '단가 (KRW)', width: '140px', align: 'right' },
    { key: 'weight', label: '중량 (kg)', width: '110px', align: 'right' },
    { key: 'hsCode', label: 'HS Code', width: '100px', align: 'center' },
    { key: 'status', label: '상태', width: '80px', align: 'center' },
  ]
  if (isItemAdmin.value) {
    base.push({ key: 'actions', label: '액션', width: '120px', align: 'center' })
  }
  return base
})

const filteredItems = computed(() => {
  let result = items.value
  const f = appliedFilters.value

  if (f.keyword) {
    const kw = f.keyword.toLowerCase()
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        (item.nameKr && item.nameKr.includes(kw)) ||
        item.code.toLowerCase().includes(kw),
    )
  }

  if (f.code) {
    result = result.filter((item) => item.code.toLowerCase().includes(f.code.toLowerCase()))
  }

  if (f.name) {
    const kw = f.name.toLowerCase()
    result = result.filter((item) => item.name.toLowerCase().includes(kw) || (item.nameKr && item.nameKr.includes(kw)))
  }

  if (f.category) {
    result = result.filter((item) => item.category === f.category)
  }

  if (f.unit) {
    result = result.filter((item) => item.unit === f.unit)
  }

  if (f.status) {
    result = result.filter((item) => item.status === f.status)
  }

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredItems.value.slice(start, start + PAGE_SIZE)
})

async function loadData() {
  loading.value = true
  try {
    items.value = await fetchItems()
  } catch {
    error('데이터를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

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

function confirmDelete(item) {
  itemToDelete.value = item
  showConfirmModal.value = true
}

async function handleDelete() {
  if (!itemToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await changeItemStatus(itemToDelete.value.id, 'INACTIVE')
    success(`${itemToDelete.value.name} 품목이 비활성화되었습니다.`)
    await loadData()
  } catch {
    error('삭제 중 오류가 발생했습니다.')
  } finally {
    showConfirmModal.value = false
    itemToDelete.value = null
    deleting.value = false
  }
}

async function handleSave(formData) {
  if (saving.value) return
  saving.value = true
  try {
    if (formMode.value === 'create') {
      // Use formData.status as-is (set by the form); fallback to '활성' only if absent
      await createItem({ ...formData, regDate: new Date().toISOString().slice(0, 10), status: formData.status ?? '활성' })
      success('품목이 등록되었습니다.')
    } else {
      await updateItem(selectedItem.value.id, formData)
      success('품목 정보가 수정되었습니다.')
    }
    showFormModal.value = false
    await loadData()
  } catch {
    error('저장 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

function goToDetail(row) {
  router.push({ name: 'item-detail', params: { id: row.id } })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="품목 관리" icon-class="fas fa-cube">
      <template #actions>
        <BaseButton v-if="isItemAdmin" variant="primary" @click="openCreateModal">신규등록</BaseButton>
      </template>
    </PageHeader>

    <div @keyup.enter="searchRows" class="space-y-6">
      <FilterToolbarCard
        v-model="filters.keyword"
        :advanced-open="isAdvancedOpen"
        placeholder="코드, 품목명으로 검색"
        @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
      />

      <CollapsibleFilterCard :open="isAdvancedOpen">
        <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <FormField label="코드">
            <BaseTextField v-model="filters.code" placeholder="코드 입력..." />
          </FormField>

          <FormField label="품목명">
            <BaseTextField v-model="filters.name" placeholder="영문 또는 한글명..." />
          </FormField>

          <FormField label="카테고리">
            <SearchableCombobox
              v-model="filters.category"
              :options="categoryOptions"
              placeholder="카테고리 선택..."
            />
          </FormField>

          <FormField label="단위">
            <SearchableCombobox
              v-model="filters.unit"
              :options="unitOptions"
              placeholder="단위 선택..."
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
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20 text-slate-400">
      데이터를 불러오는 중입니다...
    </div>

    <BaseTable v-else :columns="columns" :rows="paginatedItems" row-key="id"
      :empty-text="appliedFilters.keyword || appliedFilters.code || appliedFilters.name || appliedFilters.category || appliedFilters.unit || appliedFilters.status ? '검색 결과가 없습니다.' : '등록된 품목이 없습니다.'"
      clickable-rows
      :footer-text="`총 ${filteredItems.length}건`"
      @row-click="goToDetail"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-xs font-semibold text-brand-600">{{ row.code }}</span>
      </template>

      <template #cell-name="{ row }">
        <div>
          <p class="font-medium text-ink">{{ row.name }}</p>
          <p class="text-xs text-slate-500">{{ [row.nameKr, row.category].filter(Boolean).join(' · ') }}</p>
        </div>
      </template>

      <template #cell-unitPrice="{ row }">
        {{ row.unitPrice?.toLocaleString() ?? '-' }}
      </template>

      <template #cell-weight="{ row }">
        {{ row.weight?.toLocaleString() ?? '-' }}
      </template>

      <template #cell-status="{ row }">
        <StatusBadge :value="row.status" />
      </template>

      <template #cell-actions="{ row }">
        <TableActions @edit="openEditModal(row)" @delete="confirmDelete(row)" />
      </template>
    </BaseTable>

    <BasePagination
      v-model:current-page="currentPage"
      :total-pages="totalPages"
    />

    <ItemFormModal
      :open="showFormModal"
      :mode="formMode"
      :item="selectedItem"
      :all-items="items"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="showConfirmModal"
      title="품목 삭제"
      message="해당 품목을 삭제하시겠습니까?"
      :detail="itemToDelete?.name"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="handleDelete"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>
