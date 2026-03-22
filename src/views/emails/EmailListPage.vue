<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchActivityEmails } from '@/api/emails'
import { api } from '@/lib/api'
import {
  buildPIOutputHtml,
  buildCIOutputHtml,
  buildPLOutputHtml,
  buildProductionOrderOutputHtml,
  buildShipmentOrderOutputHtml,
} from '@/utils/documentOutput'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import InfoField from '@/components/common/InfoField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const { success, error } = useToast()

// ── 데이터 ─────────────────────────────────────────────────
const emails = ref([])

onMounted(async () => {
  try {
    emails.value = await fetchActivityEmails()
  } catch (e) {
    console.error('메일 이력 로드 실패', e)
    error('데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.')
  }
})

// ── 필터 상태 ──────────────────────────────────────────────
const isFilterOpen = ref(false)
const filterKeyword = ref('')
const filterType    = ref('')
const filterStatus  = ref('')
const filterSender    = ref('')
const filterRecipient = ref('')
const filterDateFrom  = ref('')
const filterDateTo    = ref('')

const typeOptions = [
  { label: 'PI', value: 'PI' },
  { label: 'CI', value: 'CI' },
  { label: 'PL', value: 'PL' },
  { label: '생산지시서', value: '생산지시서' },
  { label: '출하지시서', value: '출하지시서' },
]

const statusOptions = [
  { label: '발송', value: '발송' },
  { label: '실패', value: '실패' },
]

const senderOptions = computed(() => {
  const unique = [...new Set(emails.value.map((e) => e.sender).filter(Boolean))]
  return unique.map((s) => ({ label: s, value: s }))
})

const recipientOptions = computed(() => {
  const unique = [...new Set(emails.value.map((e) => e.recipient).filter(Boolean))]
  return unique.map((r) => ({ label: r, value: r }))
})

// 실제 적용된 필터 (검색 버튼 클릭 시에만 반영)
const applied = ref({ keyword: '', type: '', status: '', sender: '', recipient: '', dateFrom: '', dateTo: '' })
const recipientKey = ref(0)

function applySearch() {
  applied.value = {
    keyword:   filterKeyword.value,
    type:      filterType.value,
    status:    filterStatus.value,
    sender:    filterSender.value,
    recipient: filterRecipient.value,
    dateFrom:  filterDateFrom.value,
    dateTo:    filterDateTo.value,
  }
}

function resetFilters() {
  filterKeyword.value   = ''
  filterType.value      = ''
  filterStatus.value    = ''
  filterSender.value    = ''
  filterRecipient.value = ''
  filterDateFrom.value  = ''
  filterDateTo.value    = ''
  applied.value = { keyword: '', type: '', status: '', sender: '', recipient: '', dateFrom: '', dateTo: '' }
  recipientKey.value++
}

const filteredEmails = computed(() => {
  return emails.value.filter((e) => {
    const q = applied.value.keyword.trim().toLowerCase()
    const matchKeyword   = !q || e.title.toLowerCase().includes(q) || e.client.toLowerCase().includes(q)
    const matchType      = !applied.value.type      || (e.types ?? []).includes(applied.value.type)
    const matchStatus    = !applied.value.status    || e.status === applied.value.status
    const matchSender    = !applied.value.sender    || e.sender === applied.value.sender
    const matchRecipient = !applied.value.recipient || e.recipient === applied.value.recipient
    const dateFrom = applied.value.dateFrom.replaceAll('-', '/')
    const dateTo   = applied.value.dateTo.replaceAll('-', '/')
    const matchFrom = !dateFrom || e.sentAt >= dateFrom
    const matchTo   = !dateTo   || e.sentAt <= dateTo
    return matchKeyword && matchType && matchStatus && matchSender && matchRecipient && matchFrom && matchTo
  })
})

// ── 첨부파일 열기 ───────────────────────────────────────────
const ATTACHMENT_CONFIG = {
  PI: { endpoint: 'pi',               builder: buildPIOutputHtml               },
  CI: { endpoint: 'ci',               builder: buildCIOutputHtml               },
  PL: { endpoint: 'pl',               builder: buildPLOutputHtml               },
  MO: { endpoint: 'productionOrders', builder: buildProductionOrderOutputHtml  },
  SO: { endpoint: 'shipmentOrders',   builder: buildShipmentOrderOutputHtml    },
}

const attachmentHtml = ref('')
const isAttachmentOpen = ref(false)

async function openAttachment(filename) {
  const id = filename.replace('.pdf', '')
  const prefix = id.match(/^[A-Z]+/)?.[0] ?? ''
  const config = ATTACHMENT_CONFIG[prefix]
  if (!config) return
  try {
    const { data } = await api.get(`/${config.endpoint}/${id}`)
    if (!Array.isArray(data.items)) {
      data.items = data.itemName
        ? [{ name: data.itemName, quantity: '-', unitPrice: '-', amount: data.amount ?? '-' }]
        : []
    }
    if (!data.totalAmount && data.amount != null) data.totalAmount = String(data.amount)
    attachmentHtml.value = config.builder(data)
    isAttachmentOpen.value = true
  } catch (e) {
    console.error('문서 로드 실패', e)
    error('문서를 불러오지 못했습니다.')
  }
}

// ── 재전송 ────────────────────────────────────────────────
async function resendEmail() {
  const email = selectedEmail.value
  if (!email) return
  // 이미 발송 성공 이력이 존재하면 중복 방지
  const alreadySent = emails.value.some(
    (e) => e.id !== email.id && e.title === email.title && e.status === '발송',
  )
  if (alreadySent) {
    error('이미 발송된 메일입니다.')
    return
  }
  try {
    await api.delete(`/activityEmails/${email.id}`)
    const { id: _removed, ...rest } = email
    const newRecord = {
      ...rest,
      status: '발송',
      sentAt: (() => { const d = new Date(); return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}` })(),
    }
    await api.post('/activityEmails', newRecord)
    closeDetail()
    success('메일을 발송했습니다.')
    emails.value = await fetchActivityEmails()
  } catch (e) {
    console.error('재전송 실패', e)
    error('재전송에 실패했습니다.')
  }
}

// ── 상세 모달 ──────────────────────────────────────────────
const selectedEmail = ref(null)
const isDetailOpen = ref(false)

function openDetail(email) {
  selectedEmail.value = email
  isDetailOpen.value = true
}

function closeDetail() {
  isDetailOpen.value = false
  selectedEmail.value = null
}

// ── 테이블 컬럼 ────────────────────────────────────────────
const columns = [
  { key: 'index',     label: '항목',   width: '64px',  align: 'center' },
  { key: 'client',    label: '거래처',  width: '120px'                  },
  { key: 'title',     label: '제목'                                      },
  { key: 'recipient', label: '수신자',  width: '110px'                  },
  { key: 'email',     label: '이메일',  width: '210px'                  },
  { key: 'types',      label: '유형',   width: '120px'                  },
  { key: 'attachment', label: '첨부',  width: '60px',  align: 'center' },
  { key: 'status',    label: '상태',   width: '80px',  align: 'center' },
  { key: 'sentAt',    label: '발송일',  width: '110px', align: 'center' },
  { key: 'sender',    label: '발송자',  width: '90px',  align: 'center' },
]
</script>

<template>
  <div class="space-y-4">
    <!-- 페이지 타이틀 -->
    <DocumentPageHeader title="메일 이력" icon-class="fas fa-envelope" />

    <!-- 키워드 검색 + 상세검색 토글 -->
    <FilterToolbarCard
      v-model="filterKeyword"
      placeholder="제목, 거래처 검색..."
      :advanced-open="isFilterOpen"
      @toggle-advanced="isFilterOpen = !isFilterOpen"
    />

    <!-- 상세검색 패널 -->
    <CollapsibleFilterCard :open="isFilterOpen" @toggle="isFilterOpen = !isFilterOpen">
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <!-- 기간 -->
        <FormField label="발송일 기간" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <DateField v-model="filterDateFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filterDateTo" />
          </div>
        </FormField>

        <!-- 유형 -->
        <FormField label="유형">
          <SearchableCombobox
            v-model="filterType"
            :options="typeOptions"
            placeholder="유형 선택..."
          />
        </FormField>

        <!-- 상태 -->
        <FormField label="상태">
          <SearchableCombobox
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="상태 선택..."
          />
        </FormField>

        <!-- 발송자 -->
        <FormField label="발송자">
          <SearchableCombobox
            v-model="filterSender"
            :options="senderOptions"
            placeholder="발송자 검색..."
          />
        </FormField>

        <!-- 수신자 -->
        <FormField label="수신자">
          <SearchableCombobox
            :key="recipientKey"
            v-model="filterRecipient"
            :options="recipientOptions"
            placeholder="수신자 검색..."
          />
        </FormField>
      </div>

      <div class="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">
          <template #leading>
            <i class="fas fa-undo text-xs" aria-hidden="true"></i>
          </template>
          초기화
        </BaseButton>
        <BaseButton size="sm" @click="applySearch">
          <template #leading>
            <i class="fas fa-search text-xs" aria-hidden="true"></i>
          </template>
          검색
        </BaseButton>
      </div>
    </CollapsibleFilterCard>

    <!-- 테이블 -->
    <BaseTable :columns="columns" :rows="filteredEmails" row-key="id" class="cursor-pointer" :footer-text="`총 ${filteredEmails.length}건`" @row-click="openDetail">

      <!-- 항목 번호 -->
      <template #cell-index="{ row }">
        <span class="text-xs font-medium text-slate-500">
          {{ filteredEmails.findIndex((e) => e.id === row.id) + 1 }}
        </span>
      </template>

      <!-- 제목 -->
      <template #cell-title="{ row }">
        <span class="font-medium text-slate-800">{{ row.title }}</span>
      </template>

      <!-- 수신자 (없으면 공란) -->
      <template #cell-recipient="{ row }">
        <span v-if="row.recipient" class="text-slate-700">{{ row.recipient }}</span>
        <span v-else class="text-slate-300">—</span>
      </template>

      <!-- 이메일 -->
      <template #cell-email="{ row }">
        <span class="break-all text-slate-600">{{ row.email }}</span>
      </template>

      <!-- 유형 배지 -->
      <template #cell-types="{ row }">
        <span class="text-sm text-slate-700">{{ (row.types ?? []).join(' · ') }}</span>
      </template>

      <!-- 첨부 -->
      <template #cell-attachment="{ row }">
        <div v-if="row.attachments?.length" class="group relative mx-auto flex items-center justify-center" @click.stop>
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
            <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
          </svg>
          <div class="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            <button
              v-for="file in row.attachments"
              :key="file"
              type="button"
              class="block hover:underline"
              @click="openAttachment(file)"
            >
              {{ file }}
            </button>
          </div>
        </div>
        <span v-else class="text-slate-300">—</span>
      </template>

      <!-- 상태 배지 -->
      <template #cell-status="{ row }">
        <StatusBadge :value="row.status" />
      </template>

    </BaseTable>

    <!-- 첨부파일 문서 미리보기 모달 -->
    <BaseModal
      :open="isAttachmentOpen"
      title="문서 미리보기"
      width="max-w-4xl"
      :z-index="60"
      @close="isAttachmentOpen = false"
    >
      <iframe
        :srcdoc="attachmentHtml"
        class="w-full rounded"
        style="height: 70vh; border: none;"
      />
      <template #footer>
        <BaseButton variant="secondary" @click="isAttachmentOpen = false">닫기</BaseButton>
      </template>
    </BaseModal>

    <!-- 메일 상세 모달 -->
    <BaseModal
      :open="isDetailOpen"
      title="메일 상세"
      width="max-w-md"
      @close="closeDetail"
    >
      <div class="space-y-3">
        <InfoField label="거래처"  :value="selectedEmail?.client" />
        <InfoField label="발송자"  :value="selectedEmail?.sender" />
        <InfoField label="수신자"  :value="selectedEmail?.recipient || '-'" />
        <InfoField label="발송일시" :value="selectedEmail?.sentAt" />
        <InfoField label="제목"    :value="selectedEmail?.title" />
        <InfoField label="유형"    :value="(selectedEmail?.types ?? []).join(' · ')" />
        <InfoField label="연결 PO" :value="selectedEmail?.poId || '-'" />
        <InfoField label="첨부파일">
          <div v-if="selectedEmail?.attachments?.length" class="flex flex-col gap-1">
            <button
              v-for="file in selectedEmail.attachments"
              :key="file"
              type="button"
              class="flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
              @click="openAttachment(file)"
            >
              <svg class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
              <span>{{ file }}</span>
            </button>
          </div>
          <span v-else class="text-sm text-slate-400">없음</span>
        </InfoField>
      </div>
      <template #footer>
        <BaseButton
          v-if="selectedEmail?.status === '실패'"
          variant="primary"
          @click="resendEmail"
        >
          재전송
        </BaseButton>
        <BaseButton variant="secondary" @click="closeDetail">닫기</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
