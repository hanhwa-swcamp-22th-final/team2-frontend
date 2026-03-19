<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const detailMap = {
  SH26001: {
    id: 'SH26001',
    status: '출하준비',
    clientName: 'COOLSAY SDN BHD',
    poId: 'PO26001',
    shipmentOrderId: 'SO2026001',
    requestDate: '2026/03/26',
    dueDate: '2026/04/05',
    updatedAt: '2026/03/28 14:30',
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '30 EA' },
      { name: 'Lubricant Oil SAE 10W-40', quantity: '200 EA' },
      { name: 'Industrial Grease EP-2', quantity: '100 EA' },
      { name: 'Hydraulic Oil ISO VG 46', quantity: '32 EA' },
    ],
  },
  SH26004: {
    id: 'SH26004',
    status: '출하준비',
    clientName: 'Viet Steel JSC',
    poId: 'PO26004',
    shipmentOrderId: 'SO2026002',
    requestDate: '2026/03/29',
    dueDate: '2026/04/30',
    updatedAt: '2026/03/30 09:40',
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '40 EA' },
    ],
  },
  SH26005: {
    id: 'SH26005',
    status: '출하완료',
    clientName: 'Pacific Trading Inc.',
    poId: 'PO26003',
    shipmentOrderId: 'SO2026003',
    requestDate: '2026/03/18',
    dueDate: '2026/06/05',
    updatedAt: '2026/03/31 18:10',
    items: [
      { name: 'Lubricant Oil SAE 10W-40', quantity: '520 EA' },
    ],
  },
}

const detail = ref(
  detailMap[route.params.id]
    ? { ...detailMap[route.params.id], items: [...detailMap[route.params.id].items] }
    : null,
)

const currentStep = computed(() => (detail.value?.status === '출하완료' ? 2 : 1))

function goBack() {
  router.push({ name: 'shipments' })
}

function goToPo() {
  router.push({ name: 'po-detail', params: { id: detail.value?.poId } })
}

function goToShipmentOrder() {
  router.push({ name: 'shipment-order-detail', params: { id: detail.value?.shipmentOrderId } })
}

function completeShipment() {
  if (!detail.value || detail.value.status === '출하완료') return
  detail.value.status = '출하완료'
  detail.value.updatedAt = '2026/03/31 10:00'
  toast.success(`${detail.value.id}가 출하완료 처리되었습니다.`)
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6 flex items-center gap-3">
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        @click="goBack"
      >
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
      </button>
      <h2 class="text-xl font-bold text-slate-900">{{ detail.id }}</h2>
      <StatusBadge :value="detail.status" />
      <div class="flex-1"></div>
      <BaseButton
        class="!h-auto !rounded-xl !bg-slate-500 !px-4 !py-2.5"
        :disabled="detail.status === '출하완료'"
        @click="completeShipment"
      >
        <template #leading>
          <i class="fas fa-check-circle text-xs" aria-hidden="true"></i>
        </template>
        출하완료 처리
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">출하 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div><span class="text-slate-500">출하번호</span><div class="mt-0.5 font-mono font-medium">{{ detail.id }}</div></div>
            <div><span class="text-slate-500">거래처</span><div class="mt-0.5 font-medium">{{ detail.clientName }}</div></div>
            <div>
              <span class="text-slate-500">원천 PO</span>
              <div class="mt-0.5">
                <button type="button" class="text-brand-500 hover:underline" @click="goToPo">{{ detail.poId }}</button>
              </div>
            </div>
            <div><span class="text-slate-500">출하지시서</span><div class="mt-0.5">{{ detail.shipmentOrderId }}</div></div>
            <div><span class="text-slate-500">출하요청일</span><div class="mt-0.5 font-medium">{{ detail.requestDate }}</div></div>
            <div><span class="text-slate-500">납기일</span><div class="mt-0.5 font-medium">{{ detail.dueDate }}</div></div>
            <div><span class="text-slate-500">최종 업데이트</span><div class="mt-0.5 text-xs text-slate-400">{{ detail.updatedAt }}</div></div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">진행 단계</h3>
          <div class="flex items-center justify-center py-4">
            <div class="flex items-center gap-0.5">
              <div class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" :class="currentStep >= 1 ? 'bg-slate-500 text-white' : 'bg-slate-200 text-slate-400'">1</div>
              <div class="h-0.5 w-5 bg-slate-200"></div>
              <div class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" :class="currentStep >= 2 ? 'bg-slate-500 text-white' : 'bg-slate-200 text-slate-400'">2</div>
              <span class="ml-2 text-xs font-medium text-brand-600">{{ detail.status }}</span>
            </div>
          </div>
          <div class="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-brand-500">
            <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
            출하팀 담당자 또는 관리자가 출하 상태를 변경할 수 있습니다.
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">연결 문서</h3>
          <div class="space-y-2 text-sm">
            <button type="button" class="flex w-full items-center gap-2 rounded-lg p-2.5 text-left text-brand-500 transition hover:bg-slate-50" @click="goToPo">
              <i class="fas fa-file-contract" aria-hidden="true"></i>
              PO: {{ detail.poId }}
            </button>
            <button type="button" class="flex w-full cursor-pointer items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-left text-slate-600 transition hover:bg-slate-100" @click="goToShipmentOrder">
              <i class="fas fa-truck" aria-hidden="true"></i>
              출하지시서: {{ detail.shipmentOrderId }}
            </button>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">PO 품목</h3>
          <div class="space-y-2 text-xs">
            <div v-for="item in detail.items" :key="item.name" class="flex justify-between rounded bg-slate-50 p-2">
              <span>{{ item.name }}</span>
              <span class="font-medium">{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    출하 현황 문서를 찾을 수 없습니다.
  </div>
</template>
