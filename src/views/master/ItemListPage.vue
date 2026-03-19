<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TableActions from '@/components/common/TableActions.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import ItemFormModal from '@/components/domain/master/ItemFormModal.vue'
import { createItem, deleteItem, fetchItems, updateItem } from '@/api/master'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success, error } = useToast()

const items = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const searchKeyword = ref('')
const categoryFilter = ref('')

const showFormModal = ref(false)
const formMode = ref('create')
const selectedItem = ref(null)

const showConfirmModal = ref(false)
const itemToDelete = ref(null)

const categoryOptions = computed(() => {
  const cats = [...new Set(items.value.map((i) => i.category).filter(Boolean))]
  return [{ label: '전체 카테고리', value: '' }, ...cats.map((c) => ({ label: c, value: c }))]
})

const columns = [
  { key: 'code', label: '코드', width: '100px' },
  { key: 'name', label: '품목명' },
  { key: 'spec', label: '규격', width: '200px' },
  { key: 'packUnit', label: '포장단위', width: '100px', align: 'center' },
  { key: 'unit', label: '단위', width: '80px', align: 'center' },
  { key: 'unitPrice', label: '단가 (KRW)', width: '140px', align: 'right' },
  { key: 'weight', label: '중량 (kg)', width: '110px', align: 'right' },
  { key: 'hsCode', label: '관세코드', width: '100px', align: 'center' },
  { key: 'status', label: '상태', width: '80px', align: 'center' },
  { key: 'actions', label: '액션', width: '120px', align: 'center' },
]

const filteredItems = computed(() => {
  let result = items.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        (item.nameKr && item.nameKr.includes(kw)) ||
        item.code.toLowerCase().includes(kw),
    )
  }

  if (categoryFilter.value) {
    result = result.filter((item) => item.category === categoryFilter.value)
  }

  return result
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
    await deleteItem(itemToDelete.value.id)
    success(`${itemToDelete.value.name} 품목이 삭제되었습니다.`)
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
        <BaseSelect v-model="categoryFilter" :options="categoryOptions" placeholder="전체 카테고리" />
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20 text-slate-400">
      데이터를 불러오는 중입니다...
    </div>

    <BaseTable v-else :columns="columns" :rows="filteredItems" row-key="id"
      :empty-text="searchKeyword || categoryFilter ? '검색 결과가 없습니다.' : '등록된 품목이 없습니다.'"
      clickable-rows
      @row-click="goToDetail"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-xs font-semibold text-brand-600">{{ row.code }}</span>
      </template>

      <template #cell-name="{ row }">
        <div>
          <p class="font-medium text-ink">{{ row.name }}</p>
          <p class="text-xs text-slate-500">{{ row.nameKr }}</p>
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

    <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span>총 {{ filteredItems.length }}건</span>
    </div>

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
