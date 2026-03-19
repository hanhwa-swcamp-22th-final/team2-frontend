<script setup>
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  document: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])
const { success } = useToast()

const piRowsSource = [
  { id: 'PI26001', clientName: 'COOLSAY SDN BHD', currency: 'USD', deliveryDate: '2026/04/15' },
  { id: 'PI26002', clientName: 'TechBridge GmbH', currency: 'EUR', deliveryDate: '2026/05/20' },
  { id: 'PI26003', clientName: 'Pacific Trading Inc.', currency: 'USD', deliveryDate: '2026/06/01' },
]

const clientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아' },
  { id: 'CL002', name: 'TechBridge GmbH', country: '독일' },
  { id: 'CL003', name: 'Pacific Trading Inc.', country: '미국' },
]

function createInitialForm() {
  return {
    linkedPiId: '',
    linkedPiDisplay: '',
    clientName: '',
    deliveryDate: '',
  }
}

const form = ref(createInitialForm())
const piSearchOpen = ref(false)
const piSearchKeyword = ref('')
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')

const piRows = computed(() => {
  const keyword = piSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return piRowsSource
  return piRowsSource.filter((row) => (
    [row.id, row.clientName, row.currency, row.deliveryDate].some((value) => value.toLowerCase().includes(keyword))
  ))
})

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource
  return clientRowsSource.filter((row) => (
    [row.id, row.name, row.country].some((value) => value.toLowerCase().includes(keyword))
  ))
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return

    if (props.mode === 'edit' && props.document) {
      form.value = {
        linkedPiId: props.document.piId ?? '',
        linkedPiDisplay: props.document.piId ?? '',
        clientName: props.document.clientName ?? '',
        deliveryDate: props.document.deliveryDate?.replaceAll('/', '-') ?? '',
      }
      return
    }

    form.value = createInitialForm()
  },
  { immediate: true },
)

function openPiSearch() {
  piSearchOpen.value = true
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function clearLinkedPi() {
  form.value.linkedPiId = ''
  form.value.linkedPiDisplay = ''
}

function handleSave() {
  success(props.mode === 'create' ? 'PO 작성 폼 구조가 준비되었습니다.' : 'PO 수정 폼 구조가 준비되었습니다.')
  emit('save', { ...form.value })
  emit('close')
}

function selectPi(pi) {
  form.value.linkedPiId = pi.id
  form.value.linkedPiDisplay = pi.id
  form.value.clientName = pi.clientName
  form.value.deliveryDate = pi.deliveryDate.replaceAll('/', '-')
  piSearchOpen.value = false
  piSearchKeyword.value = ''
}

function selectClient(client) {
  form.value.clientName = client.name
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? 'PO 등록' : `PO 수정 – ${document?.id ?? ''}`"
    width="max-w-3xl"
    @close="emit('close')"
  >
    <div class="space-y-4 text-sm">
      <div>
        <label class="mb-1 block text-slate-600">PI 연결 (선택)</label>
        <div class="flex gap-2">
          <input
            v-model="form.linkedPiDisplay"
            readonly
            class="flex-1 cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
            placeholder="PI를 검색하여 선택..."
            @click.stop.prevent="openPiSearch"
          >
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-50"
            @click.stop.prevent="openPiSearch"
          >
            <i class="fas fa-search" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
            @click="clearLinkedPi"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-slate-600">거래처 *</label>
          <div class="relative">
            <input
              v-model="form.clientName"
              type="text"
              placeholder="거래처 검색..."
              readonly
              class="w-full cursor-pointer rounded-lg border border-slate-300 px-3 py-2 pr-9"
              style="background: var(--bg-input);"
              @click.stop.prevent="openClientSearch"
            >
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-500"
              @click.stop.prevent="openClientSearch"
            >
              <i class="fas fa-search text-xs" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-slate-600">납기일 *</label>
          <input
            v-model="form.deliveryDate"
            type="date"
            class="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
        </div>
      </div>

      <p class="text-xs text-gray-400">
        * PI 연결 시 거래처·품목·수량·단가가 자동으로 채워집니다.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>

  <SearchModal
    :open="piSearchOpen"
    title="PI 검색"
    :columns="[
      { key: 'id', label: 'PI번호' },
      { key: 'clientName', label: '거래처명' },
      { key: 'currency', label: '통화' },
      { key: 'deliveryDate', label: '납기일' },
    ]"
    :rows="piRows"
    :search-keyword="piSearchKeyword"
    @update:search-keyword="piSearchKeyword = $event"
    @close="piSearchOpen = false"
    @select="selectPi"
  />

  <SearchModal
    :open="clientSearchOpen"
    title="거래처 검색"
    :columns="[
      { key: 'id', label: '코드' },
      { key: 'name', label: '거래처명' },
      { key: 'country', label: '국가' },
    ]"
    :rows="clientRows"
    :search-keyword="clientSearchKeyword"
    @update:search-keyword="clientSearchKeyword = $event"
    @close="clientSearchOpen = false"
    @select="selectClient"
  />
</template>
