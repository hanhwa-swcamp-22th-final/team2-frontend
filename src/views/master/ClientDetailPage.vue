<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ClientBuyerCard from '@/components/domain/master/ClientBuyerCard.vue'
import ClientFormModal from '@/components/domain/master/ClientFormModal.vue'
import LinkedDocumentList from '@/components/domain/document/LinkedDocumentList.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { success } = useToast()

const clients = ref([
  { id: 1, code: 'CL-001', name: 'Global Steel Corp.', nameKr: '글로벌 스틸', country: 'USA', city: 'Houston', port: 'Los Angeles', address: '1234 Industrial Blvd, Houston, TX', addressKr: '미국 텍사스주 휴스턴 인더스트리얼 대로 1234', tel: '+1-713-555-0101', email: 'contact@globalsteel.com', businessNo: '12-3456789', paymentTerms: 'T/T', currency: 'USD', manager: 'John Smith', status: '활성', regDate: '2025-01-15' },
  { id: 2, code: 'CL-002', name: 'Hamburg Metal GmbH', nameKr: '함부르크 메탈', country: 'Germany', city: 'Hamburg', port: 'Hamburg', address: 'Hafenstr. 42, Hamburg', addressKr: '독일 함부르크 하펜가 42', tel: '+49-40-555-0202', email: 'info@hamburgmetal.de', businessNo: 'DE-987654321', paymentTerms: 'L/C', currency: 'EUR', manager: 'Hans Mueller', status: '활성', regDate: '2025-02-10' },
  { id: 3, code: 'CL-003', name: 'Tokyo Trading Co.', nameKr: '도쿄 트레이딩', country: 'Japan', city: 'Tokyo', port: 'Tokyo', address: '2-1 Marunouchi, Chiyoda-ku, Tokyo', addressKr: '일본 도쿄 치요다구 마루노우치 2-1', tel: '+81-3-555-0303', email: 'trade@tokyotrading.jp', businessNo: 'JP-111222333', paymentTerms: 'T/T', currency: 'JPY', manager: 'Tanaka Yuki', status: '활성', regDate: '2025-03-05' },
  { id: 4, code: 'CL-004', name: 'Shanghai Import Ltd.', nameKr: '상해 임포트', country: 'China', city: 'Shanghai', port: 'Shanghai', address: '88 Pudong Ave, Shanghai', addressKr: '중국 상하이 푸동대로 88', tel: '+86-21-555-0404', email: 'import@shanghaiimport.cn', businessNo: 'CN-444555666', paymentTerms: 'D/P', currency: 'CNY', manager: 'Wang Lei', status: '활성', regDate: '2025-03-20' },
  { id: 5, code: 'CL-005', name: 'London Metals Plc', nameKr: '런던 메탈', country: 'UK', city: 'London', port: 'Rotterdam', address: '10 Canary Wharf, London', addressKr: '영국 런던 카나리 워프 10', tel: '+44-20-555-0505', email: 'metals@londonmetals.co.uk', businessNo: 'GB-777888999', paymentTerms: 'L/C', currency: 'USD', manager: 'James Brown', status: '비활성', regDate: '2025-04-01' },
  { id: 6, code: 'CL-006', name: 'Paris Acier SA', nameKr: '파리 아시에', country: 'France', city: 'Paris', port: 'Hamburg', address: '15 Rue de Rivoli, Paris', addressKr: '프랑스 파리 리볼리 거리 15', tel: '+33-1-555-0606', email: 'acier@parisacier.fr', businessNo: 'FR-123456789', paymentTerms: 'D/A', currency: 'EUR', manager: 'Pierre Dupont', status: '활성', regDate: '2025-04-15' },
  { id: 7, code: 'CL-007', name: 'Mumbai Steel Works', nameKr: '뭄바이 스틸웍스', country: 'India', city: 'Mumbai', port: 'Mumbai', address: 'Andheri East, Mumbai', addressKr: '인도 뭄바이 안데리 이스트', tel: '+91-22-555-0707', email: 'works@mumbaisteel.in', businessNo: 'IN-998877665', paymentTerms: 'T/T', currency: 'USD', manager: 'Raj Patel', status: '활성', regDate: '2025-05-01' },
  { id: 8, code: 'CL-008', name: 'São Paulo Metals', nameKr: '상파울루 메탈', country: 'Brazil', city: 'São Paulo', port: 'Santos', address: 'Av. Paulista 1000, São Paulo', addressKr: '브라질 상파울루 파울리스타 대로 1000', tel: '+55-11-555-0808', email: 'metals@spmetals.br', businessNo: 'BR-112233445', paymentTerms: 'CAD', currency: 'USD', manager: 'Carlos Silva', status: '활성', regDate: '2025-05-20' },
  { id: 9, code: 'CL-009', name: 'Singapore Pipe Pte', nameKr: '싱가포르 파이프', country: 'Singapore', city: 'Singapore', port: 'Singapore', address: '1 Raffles Place, Singapore', addressKr: '싱가포르 래플스 플레이스 1', tel: '+65-555-0909', email: 'pipe@sgpipe.sg', businessNo: 'SG-556677889', paymentTerms: 'T/T', currency: 'USD', manager: 'Lim Wei', status: '비활성', regDate: '2025-06-10' },
  { id: 10, code: 'CL-010', name: 'Hanoi Industries', nameKr: '하노이 인더스트리', country: 'Vietnam', city: 'Ho Chi Minh', port: 'Ho Chi Minh', address: 'District 1, Ho Chi Minh City', addressKr: '베트남 호치민시 1군', tel: '+84-28-555-1010', email: 'ind@hanoiindustries.vn', businessNo: 'VN-990011223', paymentTerms: 'T/T', currency: 'USD', manager: 'Nguyen Van', status: '활성', regDate: '2025-06-25' },
])

const client = computed(() => clients.value.find((c) => c.id === Number(route.params.id)))

const buyers = computed(() => {
  if (!client.value) return []
  return [
    { name: client.value.manager, position: 'Sales Manager', email: client.value.email, phone: client.value.tel },
  ]
})

const linkedDocuments = [
  { code: 'PI-2025-001', label: 'Proforma Invoice #001', status: '확정' },
  { code: 'PI-2025-003', label: 'Proforma Invoice #003', status: '초안' },
  { code: 'PO-2025-002', label: 'Purchase Order #002', status: '발송' },
]

const infoFields = computed(() => {
  if (!client.value) return []
  return [
    { label: '코드', value: client.value.code },
    { label: '한글명', value: client.value.nameKr },
    { label: '국가', value: client.value.country },
    { label: '도시', value: client.value.city },
    { label: '도착항', value: client.value.port },
    { label: '영문주소', value: client.value.address },
    { label: '한글주소', value: client.value.addressKr },
    { label: '사업자번호', value: client.value.businessNo },
    { label: 'TEL', value: client.value.tel },
    { label: 'Email', value: client.value.email },
    { label: '결제조건', value: client.value.paymentTerms },
    { label: '통화', value: client.value.currency },
    { label: '등록일', value: client.value.regDate },
  ]
})

const showFormModal = ref(false)

function openEditModal() {
  showFormModal.value = true
}

function handleDelete() {
  success(`${client.value.name} 거래처가 삭제되었습니다.`)
  router.push({ name: 'client-list' })
}

function goBack() {
  router.push({ name: 'client-list' })
}
</script>

<template>
  <div v-if="client" class="space-y-6">
    <!-- 헤더 -->
    <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <button type="button" class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" @click="goBack">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold tracking-tight text-ink">{{ client.name }}</h1>
        <StatusBadge :value="client.status" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <BaseButton variant="secondary" size="sm" @click="openEditModal">수정</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="handleDelete">삭제</BaseButton>
        <BaseButton variant="ghost" size="sm">인쇄</BaseButton>
        <BaseButton variant="ghost" size="sm">PDF</BaseButton>
      </div>
    </div>

    <!-- 2열 레이아웃 -->
    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- 좌측 -->
      <div class="space-y-6">
        <BaseCard title="기본 정보" subtitle="거래처의 상세 정보입니다.">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="field in infoFields" :key="field.label">
              <p class="text-xs font-medium text-slate-500">{{ field.label }}</p>
              <p class="mt-1 text-sm text-ink">{{ field.value || '-' }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="바이어 / 담당자" subtitle="거래처 담당자 정보입니다.">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ClientBuyerCard v-for="buyer in buyers" :key="buyer.name" :buyer="buyer" />
          </div>
        </BaseCard>
      </div>

      <!-- 우측 -->
      <div>
        <LinkedDocumentList :documents="linkedDocuments" />
      </div>
    </div>

    <ClientFormModal
      :open="showFormModal"
      mode="edit"
      :client="client"
      @close="showFormModal = false"
      @save="showFormModal = false"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    거래처를 찾을 수 없습니다.
  </div>
</template>
