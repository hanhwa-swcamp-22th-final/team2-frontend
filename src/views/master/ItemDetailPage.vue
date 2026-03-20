<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import DocumentLinkButton from '@/components/domain/master/DocumentLinkButton.vue'
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
    { label: '등록일', value: item.value.regDate },
  ]
})

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
    if (!itemData) {
      error('품목을 찾을 수 없습니다.')
      router.push({ name: 'item-list' })
      return
    }
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
  if (saving.value) return
  saving.value = true
  try {
    await updateItem(item.value.id, formData)
    success('품목 정보가 수정되었습니다.')
    showFormModal.value = false
    await loadData()
  } catch {
    error('수정 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

const deleting = ref(false)

async function handleDelete() {
  if (!item.value || deleting.value) return
  deleting.value = true
  const name = item.value.name
  try {
    await deleteItem(item.value.id)
    success(`${name} 품목이 삭제되었습니다.`)
    router.push({ name: 'item-list' })
  } catch {
    error('삭제 중 오류가 발생했습니다.')
  } finally {
    showConfirmModal.value = false
    deleting.value = false
  }
}

function goBack() {
  if (router.options.history.state?.back) router.back()
  else router.push({ name: 'item-list' })
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-slate-400">
    데이터를 불러오는 중입니다...
  </div>

  <div v-else-if="item" class="space-y-6">
    <DetailPageHeader :title="item.name" :status="item.status" @back="goBack">
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="openEditModal">수정</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="showConfirmModal = true">삭제</BaseButton>
      </template>
    </DetailPageHeader>

    <div class="space-y-6">
      <BaseCard title="품목 정보" subtitle="품목의 상세 정보입니다.">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-for="field in infoFields" :key="field.label">
            <p class="text-xs font-medium text-slate-500">{{ field.label }}</p>
            <p
              class="mt-1 text-sm text-ink"
              :class="field.label === '코드' ? 'font-mono font-semibold text-brand-600' : ''"
            >{{ field.value || '-' }}</p>
          </div>
        </div>
      </BaseCard>

      <!-- 관련 문서 링크 -->
      <BaseCard title="관련 문서 바로가기" subtitle="이 품목의 관련 문서를 조회합니다.">
        <div class="flex flex-wrap gap-2">
          <DocumentLinkButton :to="{ path: '/po', query: { itemId: item.id } }">
            PO 조회
          </DocumentLinkButton>
          <DocumentLinkButton :to="{ path: '/pi', query: { itemId: item.id } }">
            PI 조회
          </DocumentLinkButton>
          <DocumentLinkButton :to="{ path: '/production', query: { itemId: item.id } }">
            생산 조회
          </DocumentLinkButton>
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
