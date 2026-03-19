<script setup>
import { ref, watch } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  document: { type: Object, default: null },
  selectedClient: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save', 'open-client-search'])
const { success } = useToast()

const currencyOptions = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'CNY', 'MYR', 'THB', 'VND', 'IDR', 'INR', 'SAR', 'BRL', 'SEK', 'CHF']
const incotermsOptions = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']
const buyerOptions = [
  'Mr. Ahmad Razak (Purchasing Manager)',
  'Ms. Siti Nurhaliza (Director)',
]
const approverOptions = [
  '최관리 (경영지원 · 관리자)',
  '박리드 (영업지원 · 팀장)',
]
const productOptions = [
  'H-Beam 482x300x11x15',
  'H-Beam 488x300x11x18',
  'Steel Girder 340x250x9x14',
  'Lubricant Oil SAE 10W-40',
  'Industrial Grease EP-2',
  'Hydraulic Oil ISO VG 46',
  'Seamless Steel Pipe 168x7',
  'Welded Steel Pipe 323x6.4',
  'Hydraulic Cylinder 100x500',
  'Gear Pump GP-20',
]

function createInitialForm() {
  return {
    clientName: '',
    buyerName: '',
    currency: 'USD',
    deliveryDate: '',
    incoterms: 'FOB',
    reason: '',
    approver: approverOptions[0],
    priority: 'normal',
    items: [],
  }
}

const form = ref(createInitialForm())

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return

    if (props.mode === 'edit' && props.document) {
      form.value = {
        clientName: props.document.clientName ?? '',
        buyerName: 'Mr. Ahmad Razak (Purchasing Manager)',
        currency: props.document.currency ?? 'USD',
        deliveryDate: props.document.deliveryDate?.replaceAll('/', '-') ?? '',
        incoterms: props.document.incoterms ?? 'FOB',
        reason: '',
        approver: approverOptions[0],
        priority: 'normal',
        items: props.document.items?.map((item, index) => ({
          id: index + 1,
          name: item.name ?? '',
          qty: String(item.qty ?? ''),
          unitPrice: String(item.unitPrice ?? ''),
          amount: item.amount ?? '-',
        })) ?? [],
      }
      return
    }

    form.value = createInitialForm()
  },
  { immediate: true },
)

function openClientSearch() {
  emit('open-client-search')
}

function addItem() {
  form.value.items.push({
    id: Date.now(),
    name: productOptions[0],
    qty: '1',
    unitPrice: '0',
    amount: '0',
  })
}

function removeItem(index) {
  form.value.items.splice(index, 1)
}

function handleSave() {
  success(props.mode === 'create' ? 'PI 작성 폼 구조가 준비되었습니다.' : 'PI 수정 폼 구조가 준비되었습니다.')
  emit('save', { ...form.value })
  emit('close')
}

watch(
  () => props.selectedClient,
  (client) => {
    if (!client) return
    form.value.clientName = client.name
    form.value.buyerName = client.buyers?.[0] ?? ''
  },
)
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? 'PI 등록' : `PI 수정 – ${document?.id ?? ''}`"
    width="max-w-5xl"
    @close="emit('close')"
  >
    <div class="space-y-4 text-sm">
      <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-brand-700">
        <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
        수정 내용을 입력한 후 저장하면 상급자에게 결재 요청이 전송됩니다.
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-gray-600">거래처 *</label>
          <div class="relative">
            <input
              v-model="form.clientName"
              type="text"
              placeholder="거래처 검색..."
              readonly
              class="w-full rounded-lg border px-3 py-2 pr-9"
              style="cursor:pointer;background:var(--bg-input)"
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
          <label class="mb-1 block text-gray-600">바이어</label>
          <select v-model="form.buyerName" class="w-full rounded-lg border px-3 py-2">
            <option v-for="buyer in buyerOptions" :key="buyer" :value="buyer">{{ buyer }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-gray-600">통화</label>
          <select v-model="form.currency" class="w-full rounded-lg border px-3 py-2">
            <option v-for="currency in currencyOptions" :key="currency" :value="currency">{{ currency }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-gray-600">납기일 *</label>
          <div class="relative">
            <input v-model="form.deliveryDate" type="date" class="w-full rounded-lg border px-3 py-2 pr-8">
            <span class="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i>
            </span>
          </div>
        </div>
      </div>

      <div>
        <label class="mb-1 block text-gray-600">인코텀즈</label>
        <input v-model="form.incoterms" type="hidden">
        <div class="rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-3 select-none">
          <div class="mb-2 flex items-center gap-1.5">
            <span class="text-[10px] font-bold text-emerald-500"><i class="fas fa-building mr-0.5"></i>매도인</span>
            <span class="h-px flex-1 bg-gradient-to-r from-emerald-500 to-blue-500"></span>
            <span class="text-[10px] font-bold text-blue-500">매수인 <i class="fas fa-user ml-0.5"></i></span>
          </div>

          <div class="mb-1.5 flex h-[18px] gap-px overflow-hidden rounded-md">
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="포장"><i class="fas fa-box text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="적하"><i class="fas fa-dolly text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="내륙운송"><i class="fas fa-truck text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="수출통관"><i class="fas fa-stamp text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="선적터미널"><i class="fas fa-warehouse text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-emerald-500" title="본선적재"><i class="fas fa-ship text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="해상운송"><i class="fas fa-water text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="도착터미널"><i class="fas fa-anchor text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="수입통관"><i class="fas fa-passport text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="내륙운송"><i class="fas fa-truck-moving text-[7px] text-white/90"></i></div>
            <div class="flex flex-1 items-center justify-center bg-blue-500" title="양하"><i class="fas fa-boxes-stacked text-[7px] text-white/90"></i></div>
          </div>

          <div class="mb-2 flex gap-px">
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">포장</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">적하</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">내륙운송</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">수출통관</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">선적터미널</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-emerald-500">본선적재</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">해상운송</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">도착터미널</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">수입통관</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">내륙운송</div>
            <div class="flex-1 overflow-hidden whitespace-nowrap text-center text-[6px] font-semibold leading-tight text-blue-500">양하</div>
          </div>

          <div class="mb-2 px-1">
            <div class="relative cursor-pointer">
              <div class="absolute left-[14px] right-[14px] top-3 h-[5px] rounded bg-slate-200"></div>
              <div class="absolute left-[14px] top-3 h-[5px] w-[30%] rounded bg-emerald-500 transition-all"></div>
              <div class="relative z-[1] flex justify-between">
                <div
                  v-for="option in incotermsOptions"
                  :key="option"
                  class="flex flex-1 cursor-pointer flex-col items-center"
                  @click="form.incoterms = option"
                >
                  <div
                    :class="form.incoterms === option ? 'mt-[2px] flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 text-[7px] font-extrabold text-white shadow-[0_2px_6px_#10B98144]' : 'mt-[9px] flex h-[10px] w-[10px] items-center justify-center rounded-full border-2 border-blue-500 bg-white'"
                  >
                    <span v-if="form.incoterms === option">{{ option[0] }}</span>
                  </div>
                  <div :class="form.incoterms === option ? 'mt-0.5 whitespace-nowrap text-[9px] font-extrabold text-emerald-500' : 'mt-0.5 whitespace-nowrap text-[7px] font-medium text-slate-400'">
                    {{ option }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2">
            <div class="flex h-12 min-w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500">
              <span class="text-sm font-black text-white">{{ form.incoterms }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-slate-800">
                본선인도
                <span class="ml-1 text-[10px] font-normal text-slate-500">Free On Board</span>
              </div>
              <div class="mt-0.5 line-clamp-2 text-[9px] leading-[1.3] text-slate-500">
                매도인이 본선 갑판에 물품을 적재하여 인도. 해상/내수로 전용.
              </div>
              <div class="mt-1 flex items-center gap-1.5">
                <span class="text-[8px] font-bold text-emerald-500">매도인 6구간</span>
                <span class="text-[8px] font-bold text-blue-500">매수인 5구간</span>
                <span class="text-[8px] text-slate-400"><i class="fas fa-ship mr-0.5"></i>해상</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="font-medium text-gray-700">품목 목록</label>
          <button type="button" class="text-xs text-brand-500 hover:underline" @click="addItem">
            <i class="fas fa-plus mr-1"></i>품목 추가
          </button>
        </div>
        <table class="w-full border text-xs">
          <thead class="bg-gray-50">
            <tr>
              <th class="p-2 text-left">품목</th>
              <th class="p-2 text-center">수량</th>
              <th class="p-2 text-right">단가</th>
              <th class="p-2 text-right">금액</th>
              <th class="w-8 p-2"></th>
            </tr>
          </thead>
          <tbody v-if="form.items.length">
            <tr v-for="(item, index) in form.items" :key="item.id" class="border-t">
              <td class="p-2">
                <select v-model="item.name" class="w-full rounded border px-2 py-1">
                  <option v-for="product in productOptions" :key="product" :value="product">{{ product }}</option>
                </select>
              </td>
              <td class="p-2">
                <input v-model="item.qty" type="number" class="w-20 rounded border px-2 py-1 text-center">
              </td>
              <td class="p-2">
                <input v-model="item.unitPrice" type="number" class="w-24 rounded border px-2 py-1 text-right">
              </td>
              <td class="p-2 text-right font-medium">{{ item.amount }}</td>
              <td class="p-2">
                <button type="button" class="text-slate-400 hover:text-slate-700" @click="removeItem(index)">
                  <i class="fas fa-times"></i>
                </button>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="5" class="p-4 text-center text-gray-400">품목을 추가하세요</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-2 border-t pt-3">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-slate-600">수정 사유 <span class="text-red-500">*</span></label>
            <textarea
              v-model="form.reason"
              class="h-16 w-full rounded-lg border px-3 py-2"
              placeholder="수정 사유를 입력하세요"
            ></textarea>
          </div>
          <div>
            <label class="mb-1 block text-slate-600">결재자 <span class="text-red-500">*</span></label>
            <select v-model="form.approver" class="w-full rounded-lg border px-3 py-2">
              <option v-for="approver in approverOptions" :key="approver" :value="approver">{{ approver }}</option>
            </select>
            <label class="mb-1 mt-2 block text-slate-600">긴급도</label>
            <select v-model="form.priority" class="w-full rounded-lg border px-3 py-2">
              <option value="normal">일반</option>
              <option value="urgent">긴급</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
