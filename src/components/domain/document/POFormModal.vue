<script setup>
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import { fetchAllUsers } from '@/api/auth'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  document: { type: Object, default: null },
  selectedPi: { type: Object, default: null },
  selectedClient: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save', 'open-pi-search', 'open-client-search'])
const defaultApproverOptions = ['김영업']

function createInitialForm() {
  return {
    linkedPiId: '',
    linkedPiDisplay: '',
    clientName: '',
    currency: '',
    deliveryDate: '',
    sourceDeliveryDate: '',
    deliveryDateOverride: false,
    approver: defaultApproverOptions[0],
  }
}

const form = ref(createInitialForm())
const approverOptions = ref([...defaultApproverOptions])
const isLinkedToPi = computed(() => Boolean(form.value.linkedPiId))
const isDeliveryDateLocked = computed(() => isLinkedToPi.value && !form.value.deliveryDateOverride)

async function loadApproverOptions() {
  try {
    const users = await fetchAllUsers()
    const activeUsers = users
      .filter((user) => user.userStatus === 'active')
      .filter((user) => user.userRole === 'sales' && user.positionName === '사원')
      .map((user) => user.userName)
      .filter(Boolean)

    if (activeUsers.length) {
      approverOptions.value = activeUsers
    }
  } catch {
    approverOptions.value = [...defaultApproverOptions]
  }

  if (!approverOptions.value.includes(form.value.approver)) {
    form.value.approver = approverOptions.value[0] ?? defaultApproverOptions[0]
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return

    await loadApproverOptions()

    if (props.mode === 'edit' && props.document) {
      form.value = {
        linkedPiId: props.document.piId ?? '',
        linkedPiDisplay: props.document.piId ?? '',
        clientName: props.document.clientName ?? '',
        currency: props.document.currency ?? '',
        deliveryDate: props.document.deliveryDate?.replaceAll('/', '-') ?? '',
        sourceDeliveryDate: props.document.sourceDeliveryDate?.replaceAll('/', '-') ?? props.document.deliveryDate?.replaceAll('/', '-') ?? '',
        deliveryDateOverride: Boolean(props.document.deliveryDateOverride),
        approver: props.document.approver ?? approverOptions.value[0] ?? defaultApproverOptions[0],
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
  form.value.currency = ''
  form.value.sourceDeliveryDate = ''
  form.value.deliveryDateOverride = false
}

function handleSave() {
  emit('save', { ...form.value })
}

watch(
  () => props.selectedPi,
  (pi) => {
    if (!pi) return
    form.value.linkedPiId = pi.id
    form.value.linkedPiDisplay = pi.id
    form.value.clientName = pi.clientName
    form.value.currency = pi.currency
    form.value.deliveryDate = pi.deliveryDate?.replaceAll('/', '-') ?? ''
    form.value.sourceDeliveryDate = pi.deliveryDate?.replaceAll('/', '-') ?? ''
    form.value.deliveryDateOverride = false
  },
)

watch(
  () => props.selectedClient,
  (client) => {
    if (!client || isLinkedToPi.value) return
    form.value.clientName = client.name
  },
)

watch(
  () => form.value.deliveryDateOverride,
  (enabled) => {
    if (!enabled && form.value.sourceDeliveryDate) {
      form.value.deliveryDate = form.value.sourceDeliveryDate
    }
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
      <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-brand-700">
        <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
        저장하면 선택한 결재자에게 결재 요청이 전송됩니다.
      </div>

      <div
        v-if="isLinkedToPi"
        class="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-slate-700"
      >
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <i class="fas fa-link text-xs text-brand-600" aria-hidden="true"></i>
          PI 기준 생성
        </div>
        <p class="mt-1 text-xs leading-5 text-slate-500">
          거래처와 통화는 연결된 PI 기준으로 고정됩니다. 납기일만 별도 조정이 가능합니다.
        </p>
      </div>

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
              :readonly="isLinkedToPi"
              :class="[
                'w-full rounded-lg border border-slate-300 px-3 py-2 pr-9',
                isLinkedToPi ? 'cursor-not-allowed bg-slate-100 text-slate-500' : 'cursor-pointer',
              ]"
              :style="isLinkedToPi ? undefined : 'background: var(--bg-input);'"
              @click.stop.prevent="isLinkedToPi ? undefined : openClientSearch()"
            >
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition"
              :class="isLinkedToPi ? 'cursor-not-allowed' : 'hover:text-brand-500'"
              :disabled="isLinkedToPi"
              @click.stop.prevent="openClientSearch"
            >
              <i class="fas fa-search text-xs" aria-hidden="true"></i>
            </button>
          </div>
          <p v-if="isLinkedToPi" class="mt-1 text-xs text-slate-500">
            연결된 PI의 거래처를 기준값으로 사용합니다.
          </p>
        </div>

        <div>
          <label class="mb-1 block text-slate-600">통화</label>
          <input
            :value="form.currency || '-'"
            type="text"
            readonly
            class="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500"
          >
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div class="mb-1 flex items-center justify-between gap-3">
            <label class="block text-slate-600">납기일 *</label>
            <label
              v-if="isLinkedToPi"
              class="inline-flex items-center gap-2 text-xs text-slate-500"
            >
              <input
                v-model="form.deliveryDateOverride"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              >
              납기일 별도 조정
            </label>
          </div>
          <input
            v-model="form.deliveryDate"
            type="date"
            :disabled="isDeliveryDateLocked"
            :class="[
              'w-full rounded-lg border border-slate-300 px-3 py-2',
              isDeliveryDateLocked ? 'cursor-not-allowed bg-slate-100 text-slate-500' : '',
            ]"
          >
          <p v-if="isLinkedToPi && form.sourceDeliveryDate" class="mt-1 text-xs text-slate-500">
            PI 기준 납기일: {{ form.sourceDeliveryDate }}
          </p>
        </div>

        <div
          v-if="isLinkedToPi && form.deliveryDateOverride && form.sourceDeliveryDate && form.deliveryDate !== form.sourceDeliveryDate"
          class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700"
        >
          PI 기준 납기일과 다르게 저장됩니다.
        </div>
      </div>

      <div>
        <label class="mb-1 block text-slate-600">결재자</label>
        <BaseSelect
          v-model="form.approver"
          :options="approverOptions"
          placeholder="결재자 선택"
        />
      </div>

      <p class="text-xs text-gray-400">
        * PI 연결 시 거래처와 통화는 기준값으로 고정되며, 납기일만 별도 조정할 수 있습니다.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
