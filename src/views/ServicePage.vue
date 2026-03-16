<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '@/components/BaseCard.vue'

const route = useRoute()

const serviceName = computed(() => String(route.meta.serviceName ?? '서비스 화면'))
const description = computed(() => String(route.meta.description ?? '서비스별 화면 설계 페이지'))

const sections = [
  { title: '목록 화면', detail: '검색영역, 필터, 테이블, 상태배지, 페이지네이션' },
  { title: '상세 화면', detail: '기본정보, 이력, 첨부, 관련 액션 배치' },
  { title: '등록/수정 화면', detail: '폼 레이아웃, 검증 메시지, 저장 플로우' },
]
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-[32px] bg-ink px-6 py-8 text-white shadow-panel">
      <p class="text-xs uppercase tracking-[0.32em] text-teal-200">Service Workspace</p>
      <h3 class="mt-3 text-3xl font-semibold">{{ serviceName }}</h3>
      <p class="mt-3 max-w-2xl text-sm text-slate-300">{{ description }}</p>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <BaseCard v-for="section in sections" :key="section.title" :title="section.title">
        <p class="text-sm leading-6 text-slate-600">{{ section.detail }}</p>
      </BaseCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <BaseCard title="공통 체크리스트" subtitle="화면만 설계하는 주간 기준">
        <ul class="space-y-3 text-sm text-slate-600">
          <li>실데이터 대신 의미 있는 더미 데이터 사용</li>
          <li>버튼 위치와 폼 폭은 공통 컴포넌트 기준으로 맞춤</li>
          <li>API 명세가 없어도 라우트와 화면 상태 전이는 먼저 확정</li>
        </ul>
      </BaseCard>

      <BaseCard title="다음 단계" subtitle="화면설계 이후 연결 포인트">
        <ul class="space-y-3 text-sm text-slate-600">
          <li>Pinia store에 서비스별 mock state 추가</li>
          <li>Axios 모듈을 실제 API base URL로 전환</li>
          <li>권한 분기와 RBAC 메뉴 노출 규칙 적용</li>
        </ul>
      </BaseCard>
    </section>
  </div>
</template>
