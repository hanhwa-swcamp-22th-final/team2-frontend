<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ItemFormModal from '@/components/domain/master/ItemFormModal.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
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

const item = computed(() => items.value.find((i) => i.id === Number(route.params.id)))

const infoFields = computed(() => {
  if (!item.value) return []
  return [
    { label: '코드', value: item.value.code },
    { label: '한글명', value: item.value.nameKr },
    { label: '카테고리', value: item.value.category },
    { label: '규격', value: item.value.spec },
    { label: '단위', value: item.value.unit },
    { label: '포장단위', value: item.value.packUnit },
    { label: '단가 (KRW)', value: item.value.unitPrice?.toLocaleString() ?? '-' },
    { label: '중량 (kg)', value: item.value.weight?.toLocaleString() ?? '-' },
    { label: 'HS Code', value: item.value.hsCode },
  ]
})

const usageHistory = [
  { code: 'PO-2025-001', client: 'Global Steel Corp.' },
  { code: 'PO-2025-003', client: 'Tokyo Trading Co.' },
  { code: 'PO-2025-005', client: 'Hamburg Metal GmbH' },
]

const showFormModal = ref(false)

function openEditModal() {
  showFormModal.value = true
}

function handleDelete() {
  const name = item.value.name
  items.value = items.value.filter((i) => i.id !== Number(route.params.id))
  success(`${name} 품목이 삭제되었습니다.`)
  router.push({ name: 'item-list' })
}

function goBack() {
  router.push({ name: 'item-list' })
}
</script>

<template>
  <div v-if="item" class="space-y-6">
    <!-- 헤더 -->
    <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <button type="button" class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" @click="goBack">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold tracking-tight text-ink">{{ item.name }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <BaseButton variant="secondary" size="sm" @click="openEditModal">수정</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="handleDelete">삭제</BaseButton>
        <BaseButton variant="ghost" size="sm">인쇄</BaseButton>
      </div>
    </div>

    <!-- 2열 레이아웃 -->
    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- 좌측: 품목 정보 -->
      <BaseCard title="품목 정보" subtitle="품목의 상세 정보입니다.">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-for="field in infoFields" :key="field.label">
            <p class="text-xs font-medium text-slate-500">{{ field.label }}</p>
            <p class="mt-1 text-sm text-ink">{{ field.value || '-' }}</p>
          </div>
        </div>
      </BaseCard>

      <!-- 우측: 사용 내역 -->
      <BaseCard title="사용 내역" subtitle="이 품목이 사용된 문서 목록입니다.">
        <div v-if="usageHistory.length" class="space-y-3">
          <div
            v-for="usage in usageHistory"
            :key="usage.code"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <p class="text-sm font-semibold text-ink">{{ usage.code }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ usage.client }}</p>
          </div>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
          사용 내역이 없습니다.
        </div>
      </BaseCard>
    </div>

    <ItemFormModal
      :open="showFormModal"
      mode="edit"
      :item="item"
      @close="showFormModal = false"
      @save="showFormModal = false"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    품목을 찾을 수 없습니다.
  </div>
</template>
