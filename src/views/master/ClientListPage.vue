<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TableActions from '@/components/common/TableActions.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ClientFormModal from '@/components/domain/master/ClientFormModal.vue'
import {
  createClient,
  deleteClient,
  fetchClients,
  fetchCountries,
  fetchCurrencies,
  fetchPaymentTerms,
  fetchPorts,
  updateClient,
} from '@/api/master'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success, error } = useToast()

const clients = ref([])
const countries = ref([])
const ports = ref([])
const currencies = ref([])
const paymentTerms = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const searchKeyword = ref('')
const statusFilter = ref('')

const PAGE_SIZE = 10
const currentPage = ref(1)

const showFormModal = ref(false)
const formMode = ref('create')
const selectedClient = ref(null)

const showConfirmModal = ref(false)
const clientToDelete = ref(null)

const statusFilterOptions = [
  { label: '전체 상태', value: '' },
  { label: '활성', value: '활성' },
  { label: '비활성', value: '비활성' },
]

const columns = [
  { key: 'code', label: '코드', width: '100px' },
  { key: 'name', label: '거래처명' },
  { key: 'location', label: '국가·도시', width: '140px' },
  { key: 'port', label: '도착항', width: '120px' },
  { key: 'paymentTerms', label: '결제조건', width: '100px', align: 'center' },
  { key: 'currency', label: '통화', width: '80px', align: 'center' },
  { key: 'manager', label: '담당자', width: '120px' },
  { key: 'status', label: '상태', width: '80px', align: 'center' },
  { key: 'actions', label: '액션', width: '120px', align: 'center' },
]

function getCountryName(countryId) {
  const found = countries.value.find((c) => String(c.id) === String(countryId))
  return found ? found.name : '-'
}

function getPortName(portId) {
  const found = ports.value.find((p) => String(p.id) === String(portId))
  return found ? found.name : '-'
}

function getPaymentTermsCode(paymentTermsId) {
  const found = paymentTerms.value.find((p) => String(p.id) === String(paymentTermsId))
  return found ? found.code : '-'
}

function getCurrencyCode(currencyId) {
  const found = currencies.value.find((c) => String(c.id) === String(currencyId))
  return found ? found.code : '-'
}

const enrichedClients = computed(() =>
  clients.value.map((c) => ({
    ...c,
    countryName: getCountryName(c.countryId),
    portName: getPortName(c.portId),
    paymentTermsCode: getPaymentTermsCode(c.paymentTermsId),
    currencyCode: getCurrencyCode(c.currencyId),
  })),
)

const filteredClients = computed(() => {
  let result = enrichedClients.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        (c.nameKr && c.nameKr.includes(kw)) ||
        c.code.toLowerCase().includes(kw),
    )
  }

  if (statusFilter.value) {
    result = result.filter((c) => c.status === statusFilter.value)
  }

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredClients.value.length / PAGE_SIZE)))

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredClients.value.slice(start, start + PAGE_SIZE)
})

// Reset to page 1 when filters change
watch([searchKeyword, statusFilter], () => {
  currentPage.value = 1
})

async function loadData() {
  loading.value = true
  try {
    const [clientsData, countriesData, portsData, currenciesData, paymentTermsData] =
      await Promise.all([
        fetchClients(),
        fetchCountries(),
        fetchPorts(),
        fetchCurrencies(),
        fetchPaymentTerms(),
      ])
    clients.value = clientsData
    countries.value = countriesData
    ports.value = portsData
    currencies.value = currenciesData
    paymentTerms.value = paymentTermsData
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
      await createClient({ ...formData, regDate: new Date().toISOString().slice(0, 10) })
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

    <div class="flex flex-wrap items-center gap-3">
      <div class="min-w-0 flex-1">
        <SearchInput v-model="searchKeyword" placeholder="코드, 거래처명으로 검색" />
      </div>
      <div class="w-40">
        <BaseSelect v-model="statusFilter" :options="statusFilterOptions" placeholder="전체 상태" />
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20 text-slate-400">
      데이터를 불러오는 중입니다...
    </div>

    <BaseTable v-else :columns="columns" :rows="paginatedClients" row-key="id"
      :empty-text="searchKeyword || statusFilter ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다.'"
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
        {{ row.countryName }}, {{ row.city }}
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

    <div>
      <div class="mt-2 px-1 text-xs text-slate-500">
        <span>총 {{ filteredClients.length }}건</span>
      </div>
      <div class="mt-4">
        <BasePagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
        />
      </div>
    </div>

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
