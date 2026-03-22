<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { usePoDocuments } from '@/stores/poDocuments'
import { useShipmentOrderDocuments } from '@/stores/shipmentOrderDocuments'
import { useShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const poDocuments = usePoDocuments()
const shipmentOrderDocuments = useShipmentOrderDocuments()
const shipmentStatusDocuments = useShipmentStatusDocuments()
const detail = computed(() => shipmentStatusDocuments.value.find((row) => row.id === route.params.id) ?? null)
const linkedPo = computed(() => poDocuments.value.find((row) => row.id === detail.value?.poId))
const linkedShipmentOrder = computed(() => shipmentOrderDocuments.value.find((row) => row.id === detail.value?.shipmentOrderId))

const currentStep = computed(() => (detail.value?.status === '출하완료' ? 2 : 1))
const summaryRows = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '영업담당자', value: detail.value.manager || '-' },
    { label: '품목 건수', value: `${detail.value.items.length}건` },
    { label: '납기일', value: detail.value.dueDate || '-' },
  ]
})

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
  shipmentStatusDocuments.value = shipmentStatusDocuments.value.map((row) => (
    row.id === detail.value.id
      ? { ...row, status: '출하완료', updatedAt: '2026/03/31 10:00' }
      : row
  ))
  toast.success(`${detail.value.id}가 출하완료 처리되었습니다.`)
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6">
      <DetailPageHeader :title="detail.id" :status="detail.status" @back="goBack">
        <template #actions>
          <BaseButton
            size="sm"
            :disabled="detail.status === '출하완료'"
            @click="completeShipment"
          >
            <template #leading>
              <i class="fas fa-check-circle text-xs" aria-hidden="true"></i>
            </template>
            출하완료 처리
          </BaseButton>
        </template>
      </DetailPageHeader>
    </div>

    <div class="mb-6 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-4">
      <div
        v-for="row in summaryRows"
        :key="row.label"
        class="border-b border-slate-200 px-5 py-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
      >
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ row.label }}</div>
        <div class="mt-1 text-sm font-semibold text-slate-900">{{ row.value }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">문서 기본정보</h3>
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
            <div><span class="text-slate-500">영업담당자</span><div class="mt-0.5">{{ detail.manager || '-' }}</div></div>
            <div><span class="text-slate-500">최종 업데이트</span><div class="mt-0.5 text-xs text-slate-400">{{ detail.updatedAt }}</div></div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">처리 상태</h3>
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

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">비고</h3>
          <p class="text-sm leading-6 text-slate-700">{{ detail.remarks || '-' }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">참조 문서</h3>
          <div class="space-y-2 text-sm">
            <button type="button" class="flex w-full items-center gap-2 rounded-lg p-2.5 text-left text-brand-500 transition hover:bg-slate-50" @click="goToPo">
              <i class="fas fa-file-contract" aria-hidden="true"></i>
              PO: {{ detail.poId }}
              <StatusBadge v-if="linkedPo" :value="linkedPo.status" />
            </button>
            <button type="button" class="flex w-full cursor-pointer items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-left text-slate-600 transition hover:bg-slate-100" @click="goToShipmentOrder">
              <i class="fas fa-truck" aria-hidden="true"></i>
              출하지시서: {{ detail.shipmentOrderId }}
              <StatusBadge v-if="linkedShipmentOrder" :value="linkedShipmentOrder.status" />
            </button>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">품목 내역</h3>
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
