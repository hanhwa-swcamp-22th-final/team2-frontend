<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import ClientFormModal from '@/components/domain/master/ClientFormModal.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success } = useToast()

const clients = ref([
  { id: 1, code: 'CL-001', name: 'Global Steel Corp.', nameKr: '글로벌 스틸', country: 'USA', city: 'Houston', port: 'Los Angeles', address: '1234 Industrial Blvd, Houston, TX', tel: '+1-713-555-0101', email: 'contact@globalsteel.com', paymentTerms: 'T/T', currency: 'USD', manager: 'John Smith', status: '활성', regDate: '2025-01-15' },
  { id: 2, code: 'CL-002', name: 'Hamburg Metal GmbH', nameKr: '함부르크 메탈', country: 'Germany', city: 'Hamburg', port: 'Hamburg', address: 'Hafenstr. 42, Hamburg', tel: '+49-40-555-0202', email: 'info@hamburgmetal.de', paymentTerms: 'L/C', currency: 'EUR', manager: 'Hans Mueller', status: '활성', regDate: '2025-02-10' },
  { id: 3, code: 'CL-003', name: 'Tokyo Trading Co.', nameKr: '도쿄 트레이딩', country: 'Japan', city: 'Tokyo', port: 'Tokyo', address: '2-1 Marunouchi, Chiyoda-ku, Tokyo', tel: '+81-3-555-0303', email: 'trade@tokyotrading.jp', paymentTerms: 'T/T', currency: 'JPY', manager: 'Tanaka Yuki', status: '활성', regDate: '2025-03-05' },
  { id: 4, code: 'CL-004', name: 'Shanghai Import Ltd.', nameKr: '상해 임포트', country: 'China', city: 'Shanghai', port: 'Shanghai', address: '88 Pudong Ave, Shanghai', tel: '+86-21-555-0404', email: 'import@shanghaiimport.cn', paymentTerms: 'D/P', currency: 'CNY', manager: 'Wang Lei', status: '활성', regDate: '2025-03-20' },
  { id: 5, code: 'CL-005', name: 'London Metals Plc', nameKr: '런던 메탈', country: 'UK', city: 'London', port: 'Rotterdam', address: '10 Canary Wharf, London', tel: '+44-20-555-0505', email: 'metals@londonmetals.co.uk', paymentTerms: 'L/C', currency: 'USD', manager: 'James Brown', status: '비활성', regDate: '2025-04-01' },
  { id: 6, code: 'CL-006', name: 'Paris Acier SA', nameKr: '파리 아시에', country: 'France', city: 'Paris', port: 'Hamburg', address: '15 Rue de Rivoli, Paris', tel: '+33-1-555-0606', email: 'acier@parisacier.fr', paymentTerms: 'D/A', currency: 'EUR', manager: 'Pierre Dupont', status: '활성', regDate: '2025-04-15' },
  { id: 7, code: 'CL-007', name: 'Mumbai Steel Works', nameKr: '뭄바이 스틸웍스', country: 'India', city: 'Mumbai', port: 'Mumbai', address: 'Andheri East, Mumbai', tel: '+91-22-555-0707', email: 'works@mumbaisteel.in', paymentTerms: 'T/T', currency: 'USD', manager: 'Raj Patel', status: '활성', regDate: '2025-05-01' },
  { id: 8, code: 'CL-008', name: 'São Paulo Metals', nameKr: '상파울루 메탈', country: 'Brazil', city: 'São Paulo', port: 'Santos', address: 'Av. Paulista 1000, São Paulo', tel: '+55-11-555-0808', email: 'metals@spmetals.br', paymentTerms: 'CAD', currency: 'USD', manager: 'Carlos Silva', status: '활성', regDate: '2025-05-20' },
  { id: 9, code: 'CL-009', name: 'Singapore Pipe Pte', nameKr: '싱가포르 파이프', country: 'Singapore', city: 'Singapore', port: 'Singapore', address: '1 Raffles Place, Singapore', tel: '+65-555-0909', email: 'pipe@sgpipe.sg', paymentTerms: 'T/T', currency: 'USD', manager: 'Lim Wei', status: '비활성', regDate: '2025-06-10' },
  { id: 10, code: 'CL-010', name: 'Hanoi Industries', nameKr: '하노이 인더스트리', country: 'Vietnam', city: 'Ho Chi Minh', port: 'Ho Chi Minh', address: 'District 1, Ho Chi Minh City', tel: '+84-28-555-1010', email: 'ind@hanoiindustries.vn', paymentTerms: 'T/T', currency: 'USD', manager: 'Nguyen Van', status: '활성', regDate: '2025-06-25' },
])

const searchKeyword = ref('')
const statusFilter = ref('')

const showFormModal = ref(false)
const formMode = ref('create')
const selectedClient = ref(null)

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

const filteredClients = computed(() => {
  let result = clients.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(kw) || c.nameKr.includes(kw) || c.code.toLowerCase().includes(kw),
    )
  }

  if (statusFilter.value) {
    result = result.filter((c) => c.status === statusFilter.value)
  }

  return result
})

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

function handleDelete(client) {
  clients.value = clients.value.filter((c) => c.id !== client.id)
  success(`${client.name} 거래처가 삭제되었습니다.`)
}

function handleRowClick(event) {
  const tr = event.target.closest('tbody tr')
  if (!tr) return
  const rows = Array.from(tr.parentElement.children)
  const index = rows.indexOf(tr)
  if (index < 0 || index >= filteredClients.value.length) return
  router.push({ name: 'client-detail', params: { id: filteredClients.value[index].id } })
}
</script>

<template>
  <div class="space-y-6">
    <PageTitleBar title="거래처 관리">
      <template #actions>
        <BaseButton variant="primary" @click="openCreateModal">신규등록</BaseButton>
      </template>
    </PageTitleBar>

    <div class="flex flex-wrap items-center gap-3">
      <div class="min-w-0 flex-1">
        <SearchInput v-model="searchKeyword" placeholder="코드, 거래처명으로 검색" />
      </div>
      <div class="w-40">
        <BaseSelect v-model="statusFilter" :options="statusFilterOptions" placeholder="전체 상태" />
      </div>
    </div>

    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div class="cursor-pointer" @click="handleRowClick">
    <BaseTable :columns="columns" :rows="filteredClients" row-key="id">
      <template #cell-code="{ row }">
        <span class="font-semibold text-brand">{{ row.code }}</span>
      </template>

      <template #cell-name="{ row }">
        <div>
          <p class="font-medium text-ink">{{ row.name }}</p>
          <p class="text-xs text-slate-500">{{ row.nameKr }}</p>
        </div>
      </template>

      <template #cell-location="{ row }">
        {{ row.country }}, {{ row.city }}
      </template>

      <template #cell-status="{ row }">
        <StatusBadge :value="row.status" />
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
      <span>총 {{ filteredClients.length }}건</span>
    </div>

    <ClientFormModal
      :open="showFormModal"
      :mode="formMode"
      :client="selectedClient"
      @close="showFormModal = false"
      @save="showFormModal = false"
    />
  </div>
</template>
