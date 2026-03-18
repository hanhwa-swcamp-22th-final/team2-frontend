<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
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
        <svg
          v-if="row.hasAttachment"
          class="mx-auto h-4 w-4 text-slate-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a1.5 1.5 0 0 0 2.122 2.122L14 6.243a.25.25 0 0 1 .354.354l-3.13 3.132a3.5 3.5 0 0 1-4.95-4.95l4-4a5 5 0 0 1 7.071 7.07L10.5 15.5a7 7 0 0 1-9.9-9.9l4.743-4.742a.75.75 0 0 1 1.061 1.061l-4.743 4.742a5.5 5.5 0 0 0 7.779 7.779l6.843-6.843A3.5 3.5 0 0 0 11.5 2.5L5 9a2 2 0 0 0 2.829 2.828l5.5-5.5a.5.5 0 0 0-.707-.707L7 11.121A.5.5 0 1 1 6.293 10.414l5.5-5.5a2 2 0 0 1 2.829 2.829l-6.5 6.5a3.5 3.5 0 0 1-4.95-4.95l6.5-6.5a5 5 0 0 1 7.07 7.071l-6.84 6.843A7 7 0 0 1 .5 10a7 7 0 0 1 2.05-4.95l4.743-4.742a.75.75 0 0 1 1.06 1.06Z"
            clip-rule="evenodd"
          />
        </svg>
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
  </div>
</template>
