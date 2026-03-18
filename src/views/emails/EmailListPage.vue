<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import InfoField from '@/components/common/InfoField.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

// ── 더미 데이터 ────────────────────────────────────────────
const emails = ref([
  {
    id: '1',
    client: 'GlobalTech',
    title: '[SalesBoost] PI-2025-001 발송',
    recipient: 'James Carter',
    email: 'james.carter@globaltech.com',
    type: 'PI 발송',
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
    type: 'PO 발송',
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
    type: 'CI 발송',
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
    type: 'PL 발송',
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
    type: 'PI 발송',
    hasAttachment: false,
    status: '대기',
    sentAt: '2025-03-06',
    sender: '김영희',
  },
  {
    id: '6',
    client: 'AsiaConnect',
    title: '[SalesBoost] PO-2025-002 발송',
    recipient: 'Kenji Sato',
    email: 'kenji.sato@asiaconnect.jp',
    type: 'PO 발송',
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
    type: 'CI 발송',
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
    type: 'PL 발송',
    hasAttachment: true,
    status: '실패',
    sentAt: '2025-03-03',
    sender: '김영희',
  },
])

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

    <!-- 테이블 -->
    <BaseTable :columns="columns" :rows="emails" row-key="id">

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
      총 {{ emails.length }}건
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
