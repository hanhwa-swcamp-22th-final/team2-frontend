<script setup>
import { computed, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateRangeField from '@/components/common/DateRangeField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import InfoField from '@/components/common/InfoField.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

// ── 더미 데이터 ────────────────────────────────────────────
const emails = ref([
  {
    id: '1',
    client: 'GlobalTech',
    title: '[SalesBoost] PI-2025-001 발송',
    recipient: 'James Carter',
    email: 'james.carter@globaltech.com',
    type: 'PI',
    hasAttachment: true,
    status: '발송',
    sentAt: '2025-03-10',
    sender: '홍길동',
  },
  {
    id: '2',
    client: 'EuroSupply',
    title: '[SalesBoost] PO-2025-001 발송',
    recipient: 'Hans Müller',
    email: 'hans.muller@eurosupply.de',
    type: 'PO',
    hasAttachment: true,
    status: '발송',
    sentAt: '2025-03-09',
    sender: '김영희',
  },
  {
    id: '3',
    client: 'AsiaConnect',
    title: '[SalesBoost] CI-2025-001 발송',
    recipient: '',
    email: 'yuki.tanaka@asiaconnect.jp',
    type: 'CI',
    hasAttachment: false,
    status: '실패',
    sentAt: '2025-03-08',
    sender: '이철수',
  },
  {
    id: '4',
    client: 'GlobalTech',
    title: '[SalesBoost] PL-2025-001 발송',
    recipient: 'Sarah Johnson',
    email: 'sarah.johnson@globaltech.com',
    type: 'PL',
    hasAttachment: true,
    status: '발송',
    sentAt: '2025-03-07',
    sender: '홍길동',
  },
  {
    id: '5',
    client: 'EuroSupply',
    title: '[SalesBoost] PI-2025-002 발송',
    recipient: 'Anna Schmidt',
    email: 'anna.schmidt@eurosupply.de',
    type: 'PI',
    hasAttachment: false,
    status: '발송',
    sentAt: '2025-03-06',
    sender: '김영희',
  },
  {
    id: '6',
    client: 'AsiaConnect',
    title: '[SalesBoost] PO-2025-002 발송',
    recipient: 'Kenji Sato',
    email: 'kenji.sato@asiaconnect.jp',
    type: 'PO',
    hasAttachment: true,
    status: '발송',
    sentAt: '2025-03-05',
    sender: '이철수',
  },
  {
    id: '7',
    client: 'GlobalTech',
    title: '[SalesBoost] CI-2025-002 발송',
    recipient: '',
    email: 'michael.brown@globaltech.com',
    type: 'CI',
    hasAttachment: false,
    status: '발송',
    sentAt: '2025-03-04',
    sender: '홍길동',
  },
  {
    id: '8',
    client: 'EuroSupply',
    title: '[SalesBoost] PL-2025-002 발송',
    recipient: 'Hans Müller',
    email: 'hans.muller@eurosupply.de',
    type: 'PL',
    hasAttachment: true,
    status: '실패',
    sentAt: '2025-03-03',
    sender: '김영희',
  },
])

// ── 필터 상태 ──────────────────────────────────────────────
const isFilterOpen = ref(false)
const filterKeyword = ref('')
const filterType    = ref('')
const filterStatus  = ref('')
const filterSender  = ref('')
const filterDateFrom = ref('')
const filterDateTo   = ref('')

const typeOptions = [
  { label: 'PI', value: 'PI' },
  { label: 'PO', value: 'PO' },
  { label: 'CI', value: 'CI' },
  { label: 'PL', value: 'PL' },
]

const statusOptions = [
  { label: '발송', value: '발송' },
  { label: '실패', value: '실패' },
]

const senderOptions = computed(() => {
  const unique = [...new Set(emails.value.map((e) => e.sender))]
  return unique.map((s) => ({ label: s, value: s }))
})

// 실제 적용된 필터 (검색 버튼 클릭 시에만 반영)
const applied = ref({ keyword: '', type: '', status: '', sender: '', dateFrom: '', dateTo: '' })

function applySearch() {
  applied.value = {
    keyword:  filterKeyword.value,
    type:     filterType.value,
    status:   filterStatus.value,
    sender:   filterSender.value,
    dateFrom: filterDateFrom.value,
    dateTo:   filterDateTo.value,
  }
}

function resetFilters() {
  filterKeyword.value  = ''
  filterType.value     = ''
  filterStatus.value   = ''
  filterSender.value   = ''
  filterDateFrom.value = ''
  filterDateTo.value   = ''
  applied.value = { keyword: '', type: '', status: '', sender: '', dateFrom: '', dateTo: '' }
}

const filteredEmails = computed(() => {
  return emails.value.filter((e) => {
    const q = applied.value.keyword.trim().toLowerCase()
    const matchKeyword = !q || e.title.toLowerCase().includes(q) || e.client.toLowerCase().includes(q)
    const matchType    = !applied.value.type   || e.type === applied.value.type
    const matchStatus  = !applied.value.status || e.status === applied.value.status
    const matchSender  = !applied.value.sender || e.sender === applied.value.sender
    const matchFrom    = !applied.value.dateFrom || e.sentAt >= applied.value.dateFrom
    const matchTo      = !applied.value.dateTo   || e.sentAt <= applied.value.dateTo
    return matchKeyword && matchType && matchStatus && matchSender && matchFrom && matchTo
  })
})

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
  { key: 'type',      label: '유형',   width: '100px'                  },
  { key: 'attachment', label: '첨부',  width: '60px',  align: 'center' },
  { key: 'status',    label: '상태',   width: '80px',  align: 'center' },
  { key: 'sentAt',    label: '발송일',  width: '110px', align: 'center' },
  { key: 'sender',    label: '발송자',  width: '90px',  align: 'center' },
]
</script>

<template>
  <div class="space-y-4">
    <!-- 페이지 타이틀 -->
    <PageTitleBar title="메일 이력" description="발송된 메일 이력을 조회합니다." />

    <!-- 키워드 검색 + 상세검색 토글 -->
    <FilterToolbarCard
      v-model="filterKeyword"
      placeholder="제목, 거래처 검색..."
      :advanced-open="isFilterOpen"
      @toggle-advanced="isFilterOpen = !isFilterOpen"
    />

    <!-- 상세검색 패널 -->
    <CollapsibleFilterCard :open="isFilterOpen" @toggle="isFilterOpen = !isFilterOpen">
      <div class="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4">
        <!-- 기간 -->
        <div class="col-span-2">
          <FormField label="발송일 기간">
            <DateRangeField
              :start="filterDateFrom"
              :end="filterDateTo"
              @update:start="filterDateFrom = $event"
              @update:end="filterDateTo = $event"
              @reset="filterDateFrom = ''; filterDateTo = ''"
            />
          </FormField>
        </div>

        <!-- 유형 -->
        <FormField label="유형">
          <BaseSelect
            v-model="filterType"
            :options="typeOptions"
            placeholder="유형 선택"
          />
        </FormField>

        <!-- 상태 -->
        <FormField label="상태">
          <BaseSelect
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="상태 선택"
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
      </div>

      <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">초기화</BaseButton>
        <BaseButton size="sm" @click="applySearch">검색</BaseButton>
      </div>
    </CollapsibleFilterCard>

    <!-- 테이블 -->
    <BaseTable :columns="columns" :rows="filteredEmails" row-key="id">

      <!-- 항목 번호 -->
      <template #cell-index="{ row }">
        <span class="text-xs font-medium text-slate-500">
          {{ emails.findIndex((e) => e.id === row.id) + 1 }}
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

      <!-- 첨부 -->
      <template #cell-attachment="{ row }">
        <button
          v-if="row.hasAttachment"
          type="button"
          class="mx-auto flex items-center justify-center text-slate-400 transition hover:text-brand-500"
          @click="openDetail(row)"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
            <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
          </svg>
        </button>
        <span v-else class="text-slate-300">—</span>
      </template>

      <!-- 상태 배지 -->
      <template #cell-status="{ row }">
        <StatusBadge :value="row.status" />
      </template>

    </BaseTable>

    <!-- 하단 카운트 -->
    <div class="px-1 text-xs text-slate-500">
      총 {{ filteredEmails.length }}건
    </div>

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
        <InfoField label="유형"    :value="selectedEmail?.type" />
        <InfoField label="첨부파일">
          <div class="flex items-center gap-1.5 text-sm text-brand-600">
            <svg class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            <span>{{ selectedEmail?.title?.replace('[SalesBoost] ', '') }}.pdf</span>
          </div>
        </InfoField>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="closeDetail">닫기</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
