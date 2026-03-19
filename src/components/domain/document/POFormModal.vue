<script setup>
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  document: { type: Object, default: null },
  selectedPi: { type: Object, default: null },
  selectedClient: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save', 'open-pi-search', 'open-client-search'])
const { success } = useToast()

function createInitialForm() {
  return {
    linkedPiId: '',
    linkedPiDisplay: '',
    clientName: '',
    deliveryDate: '',
  }
}

const form = ref(createInitialForm())

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
  emit('open-pi-search')
}

function openClientSearch() {
  emit('open-client-search')
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

watch(
  () => props.selectedPi,
  (pi) => {
    if (!pi) return
    form.value.linkedPiId = pi.id
    form.value.linkedPiDisplay = pi.id
    form.value.clientName = pi.clientName
    form.value.deliveryDate = pi.deliveryDate.replaceAll('/', '-')
  },
)

watch(
  () => props.selectedClient,
  (client) => {
    if (!client) return
    form.value.clientName = client.name
  },
)
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
</template>
