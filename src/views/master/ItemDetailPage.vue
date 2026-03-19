<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ItemFormModal from '@/components/domain/master/ItemFormModal.vue'
import { deleteItem, fetchItem, fetchItems, updateItem } from '@/api/master'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { success, error } = useToast()

const item = ref(null)
const allItems = ref([]) // used for code uniqueness check in edit modal
const loading = ref(false)
const saving = ref(false)

const showFormModal = ref(false)
const showConfirmModal = ref(false)

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
    { label: '상태', value: item.value.status },
    { label: '등록일', value: item.value.regDate },
  ]
})

// TODO: API로 해당 품목의 연결 문서 조회
const usageHistory = [
  { code: 'PO-2025-001', client: 'Global Steel Corp.' },
  { code: 'PO-2025-003', client: 'Tokyo Trading Co.' },
  { code: 'PO-2025-005', client: 'Hamburg Metal GmbH' },
]

async function loadData() {
  const rawId = route.params.id
  if (!/^\d+$/.test(String(rawId))) {
    router.replace({ name: 'item-list' })
    return
  }
  loading.value = true
  try {
    // fetchItems() kept for allItems (code uniqueness in edit modal)
    const [itemData, itemsData] = await Promise.all([
      fetchItem(route.params.id),
      fetchItems(),
    ])
    item.value = itemData
    allItems.value = itemsData
  } catch {
    error('데이터를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function openEditModal() {
  showFormModal.value = true
}

async function handleSave(formData) {
  saving.value = true
  try {
    const updated = await updateItem(item.value.id, formData)
    item.value = updated
    success('품목 정보가 수정되었습니다.')
    showFormModal.value = false
  } catch {
    error('수정 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!item.value) return
  const name = item.value.name
  try {
    await deleteItem(item.value.id)
    success(`${name} 품목이 삭제되었습니다.`)
    router.push({ name: 'item-list' })
  } catch {
    error('삭제 중 오류가 발생했습니다.')
  } finally {
    showConfirmModal.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'item-list' })
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-slate-400">
    데이터를 불러오는 중입니다...
  </div>

  <div v-else-if="item" class="space-y-6">
    <!-- 헤더 -->
    <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <button type="button" class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" @click="goBack">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold tracking-tight text-ink">{{ item.name }}</h1>
        <span
          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          :class="item.status === '활성' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
        >
          {{ item.status }}
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <BaseButton variant="secondary" size="sm" @click="openEditModal">수정</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="showConfirmModal = true">삭제</BaseButton>
        <BaseButton variant="ghost" size="sm" :disabled="true" title="준비 중">인쇄</BaseButton>
      </div>
    </div>

    <!-- 2열 레이아웃 -->
    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- 좌측: 품목 정보 -->
      <div class="space-y-6">
        <BaseCard title="품목 정보" subtitle="품목의 상세 정보입니다.">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="field in infoFields" :key="field.label">
              <p class="text-xs font-medium text-slate-500">{{ field.label }}</p>
              <p class="mt-1 text-sm text-ink">{{ field.value || '-' }}</p>
            </div>
          </div>
        </BaseCard>

        <!-- 관련 문서 링크 -->
        <BaseCard title="관련 문서 바로가기" subtitle="이 품목의 관련 문서를 조회합니다.">
          <div class="flex flex-wrap gap-2">
            <RouterLink
              :to="{ path: '/po', query: { itemId: item.id } }"
              class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
            >
              PO 조회
            </RouterLink>
            <RouterLink
              :to="{ path: '/pi', query: { itemId: item.id } }"
              class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
            >
              PI 조회
            </RouterLink>
            <RouterLink
              :to="{ path: '/production', query: { itemId: item.id } }"
              class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
            >
              생산 조회
            </RouterLink>
          </div>
        </BaseCard>
      </div>

      <!-- 우측: 사용 내역 (플레이스홀더 데이터 — TODO: API로 해당 품목의 연결 문서 조회) -->
      <BaseCard title="사용 내역" subtitle="이 품목이 사용된 문서 목록입니다. (준비 중)">
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
      :all-items="allItems"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="showConfirmModal"
      title="품목 삭제"
      message="해당 품목을 삭제하시겠습니까?"
      :detail="item?.name"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="handleDelete"
      @cancel="showConfirmModal = false"
    />
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    품목을 찾을 수 없습니다.
  </div>
</template>
