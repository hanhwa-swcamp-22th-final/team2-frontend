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
import ClientFormModal from '@/components/domain/master/ClientFormModal.vue'
import { useAuthStore } from '@/stores/auth'
import {
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
} from '@/api/master'
import { useMasterLookup } from '@/composables/useMasterLookup'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)
const isAdmin = computed(() => currentUser.value?.role === 'admin')
const { success, error } = useToast()

const { countries, ports, currencies, paymentTerms, loadReferenceData, getCountryName, getPortName, getPaymentTermsLabel, getCurrencyLabel } = useMasterLookup()

const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const isAdvancedOpen = ref(false)

const filters = ref({
  keyword: '',
  code: '',
  name: '',
  country: '',
  manager: '',
  status: '',
})
const appliedFilters = ref({ keyword: '', code: '', name: '', country: '', manager: '', status: '' })

const statusOptions = [
  { label: '전체', value: '' },
  { label: '활성', value: '활성' },
  { label: '비활성', value: '비활성' },
]

const PAGE_SIZE = 10
const currentPage = ref(1)

const showFormModal = ref(false)
const formMode = ref('create')
const selectedClient = ref(null)

const showConfirmModal = ref(false)
const clientToDelete = ref(null)

const columns = [
  { key: 'code', label: '코드', width: '100px', align: 'center' },
  { key: 'name', label: '거래처명' },
  { key: 'location', label: '국가·도시', width: '140px' },
  { key: 'port', label: '도착항', width: '120px' },
  { key: 'paymentTerms', label: '결제조건', width: '100px', align: 'center' },
  { key: 'currency', label: '통화', width: '80px', align: 'center' },
  { key: 'manager', label: '담당자', width: '120px' },
  { key: 'status', label: '상태', width: '80px', align: 'center' },
  { key: 'actions', label: '액션', width: '120px', align: 'center' },
]

const enrichedClients = computed(() =>
  clients.value.map((c) => ({
    ...c,
    countryName: getCountryName(c.countryId),
    portName: getPortName(c.portId),
    paymentTermsCode: getPaymentTermsLabel(c.paymentTermsId),
    currencyCode: getCurrencyLabel(c.currencyId),
  })),
)

const countryOptions = computed(() => {
  const countrySet = [...new Set(enrichedClients.value.map((c) => c.countryName).filter(Boolean))]
  return [{ label: '전체', value: '' }, ...countrySet.map((name) => ({ label: name, value: name }))]
})

function resetFilters() {
  filters.value = { keyword: '', code: '', name: '', country: '', manager: '', status: '' }
  appliedFilters.value = { keyword: '', code: '', name: '', country: '', manager: '', status: '' }
  currentPage.value = 1
}

function searchRows() {
  appliedFilters.value = { ...filters.value }
  currentPage.value = 1
}

const filteredClients = computed(() => {
  let result = enrichedClients.value

  // RBAC: 영업 사용자는 자기 부서 거래처만 표시
  if (!isAdmin.value && currentUser.value?.role === 'sales') {
    result = result.filter((c) => c.departmentId === Number(currentUser.value.departmentId))
  }

  const f = appliedFilters.value

  if (f.keyword) {
    const kw = f.keyword.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        (c.nameKr && c.nameKr.includes(kw)) ||
        c.code.toLowerCase().includes(kw),
    )
  }

  if (f.code) {
    result = result.filter((c) => c.code.toLowerCase().includes(f.code.toLowerCase()))
  }

  if (f.name) {
    const kw = f.name.toLowerCase()
    result = result.filter((c) => c.name.toLowerCase().includes(kw) || (c.nameKr && c.nameKr.includes(kw)))
  }

  if (f.country) {
    result = result.filter((c) => c.countryName === f.country)
  }

  if (f.manager) {
    result = result.filter((c) => c.manager && c.manager.includes(f.manager))
  }

  if (f.status) {
    result = result.filter((c) => c.status === f.status)
  }

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredClients.value.length / PAGE_SIZE)))

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredClients.value.slice(start, start + PAGE_SIZE)
})


async function loadData() {
  loading.value = true
  try {
    const [clientsData] = await Promise.all([
      fetchClients(),
      loadReferenceData(),
    ])
    clients.value = clientsData
  } catch {
    error('데이터를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function openCreateModal() {
  selectedClient.value = null
  formMode.value = 'create'
  showFormModal.value = true
}

function openEditModal(client) {
  selectedClient.value = client
  formMode.value = 'edit'
  showFormModal.value = true
}

function confirmDelete(client) {
  clientToDelete.value = client
  showConfirmModal.value = true
}

async function handleDelete() {
  if (!clientToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await deleteClient(clientToDelete.value.id)
    success(`${clientToDelete.value.name} 거래처가 삭제되었습니다.`)
    await loadData()
  } catch {
    error('삭제 중 오류가 발생했습니다.')
  } finally {
    showConfirmModal.value = false
    clientToDelete.value = null
    deleting.value = false
  }
}

async function handleSave(formData) {
  if (saving.value) return
  saving.value = true
  try {
    if (formMode.value === 'create') {
      const deptId = isAdmin.value ? undefined : Number(currentUser.value?.departmentId)
      await createClient({ ...formData, regDate: new Date().toISOString().slice(0, 10), ...(deptId && { departmentId: deptId }) })
      success('거래처가 등록되었습니다.')
    } else {
      await updateClient(selectedClient.value.id, formData)
      success('거래처 정보가 수정되었습니다.')
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
  router.push({ name: 'client-detail', params: { id: row.id } })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="거래처 관리" icon-class="fas fa-building">
      <template #actions>
        <BaseButton variant="primary" @click="openCreateModal">신규등록</BaseButton>
      </template>
    </PageHeader>

    <div @keyup.enter="searchRows" class="space-y-6">
      <FilterToolbarCard
        v-model="filters.keyword"
        :advanced-open="isAdvancedOpen"
        placeholder="코드, 거래처명으로 검색"
        @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
      />

      <CollapsibleFilterCard :open="isAdvancedOpen">
        <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <FormField label="코드">
            <BaseTextField v-model="filters.code" placeholder="코드 입력..." />
          </FormField>

          <FormField label="거래처명">
            <BaseTextField v-model="filters.name" placeholder="영문 또는 한글명..." />
          </FormField>

          <FormField label="국가">
            <SearchableCombobox
              v-model="filters.country"
              :options="countryOptions"
              placeholder="국가 검색..."
            />
          </FormField>

          <FormField label="담당자">
            <BaseTextField v-model="filters.manager" placeholder="담당자명..." />
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

    <BaseTable v-else :columns="columns" :rows="paginatedClients" row-key="id"
      :empty-text="appliedFilters.keyword || appliedFilters.code || appliedFilters.name || appliedFilters.country || appliedFilters.manager || appliedFilters.status ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다.'"
      :footer-text="`총 ${filteredClients.length}건`"
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

      <template #cell-location="{ row }">
        {{ [row.countryName, row.city].filter(v => v && v !== '-').join(', ') || '-' }}
      </template>

      <template #cell-port="{ row }">
        {{ row.portName }}
      </template>

      <template #cell-paymentTerms="{ row }">
        {{ row.paymentTermsCode }}
      </template>

      <template #cell-currency="{ row }">
        {{ row.currencyCode }}
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

    <ClientFormModal
      :open="showFormModal"
      :mode="formMode"
      :client="selectedClient"
      :countries="countries"
      :ports="ports"
      :currencies="currencies"
      :payment-terms="paymentTerms"
      :all-clients="clients"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="showConfirmModal"
      title="거래처 삭제"
      message="해당 거래처를 삭제하시겠습니까?"
      :detail="clientToDelete?.name"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="handleDelete"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>
