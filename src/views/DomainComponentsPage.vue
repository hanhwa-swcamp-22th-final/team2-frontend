<script setup>
import { reactive, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import DateRangeField from '@/components/common/DateRangeField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import ActivityDetailModal from '@/components/domain/activity/ActivityDetailModal.vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import FilterPanel from '@/components/domain/activity/FilterPanel.vue'
import DocumentHeaderActions from '@/components/domain/document/DocumentHeaderActions.vue'
import DocumentSummarySection from '@/components/domain/document/DocumentSummarySection.vue'
import LineItemTable from '@/components/domain/document/LineItemTable.vue'
import LinkedDocumentList from '@/components/domain/document/LinkedDocumentList.vue'

const filterState = reactive({
  keyword: '',
  typeValue: '',
  dateFrom: '2026-03-01',
  dateTo: '2026-03-17',
})

const isActivityModalOpen = ref(false)
const isSearchModalOpen = ref(false)
const selectedBuyer = ref('')
const uploadedSignature = ref(null)

const activityTypes = [
  { label: '미팅/협의', value: '미팅/협의' },
  { label: '메모/노트', value: '메모/노트' },
  { label: '이슈', value: '이슈' },
  { label: '코멘트', value: '코멘트' },
  { label: '일정', value: '일정' },
]

const documentSummaryFields = [
  { label: '문서번호', value: 'PI-2026-001' },
  { label: '거래처', value: 'COOLSAY SDN BHD' },
  { label: '담당자', value: '김영업' },
  { label: '상태', value: '확정', type: 'status' },
  { label: '통화', value: 'USD' },
  { label: '납기일', value: '2026/04/15' },
]

const lineItems = [
  { id: 1, description: 'H-Beam 482x300x11x15', qty: 30, unitPrice: 850, amount: 25500 },
  { id: 2, description: 'Lubricant Oil SAE 10W-40', qty: 200, unitPrice: 30, amount: 6000 },
]

const linkedDocuments = [
  { id: 1, code: 'PI-2026-001', label: 'Proforma Invoice', status: '확정' },
  { id: 2, code: 'PO-2026-001', label: 'Purchase Order', status: '생산중' },
  { id: 3, code: 'SO-2026-001', label: 'Shipment Order', status: '준비완료' },
]

const selectedActivity = {
  type: '미팅/협의',
  title: '초도 미팅 - 제품 사양 논의',
  client: 'COOLSAY SDN BHD',
  date: '2026/01/20',
  author: '김영업',
  content: 'COOLSAY 구매팀과 화상회의를 진행했고, 바이어 요청 사항을 다음 견적에 반영하기로 정리했습니다.',
}

const buyerOptions = [
  { label: 'Mr. Ahmad Razak', value: 'buyer-1', sublabel: 'COOLSAY SDN BHD' },
  { label: 'Herr Klaus Weber', value: 'buyer-2', sublabel: 'TechBridge GmbH' },
  { label: 'Tanaka Yuki', value: 'buyer-3', sublabel: 'Sakura Electronics' },
]

const searchModalColumns = [
  { key: 'code', label: 'PO 번호' },
  { key: 'client', label: '거래처' },
  { key: 'status', label: '상태' },
]

const searchModalRows = [
  { id: 1, code: 'PO-2026-001', client: 'COOLSAY SDN BHD', status: '생산중' },
  { id: 2, code: 'PO-2026-002', client: 'TechBridge GmbH', status: '확정' },
  { id: 3, code: 'PO-2026-003', client: 'Sakura Electronics', status: '출하완료' },
]

function resetFilters() {
  filterState.keyword = ''
  filterState.typeValue = ''
  filterState.dateFrom = ''
  filterState.dateTo = ''
}
</script>

<template>
  <div class="space-y-6">
    <PageTitleBar
      title="도메인 공통 컴포넌트 프리뷰"
      description="문서/활동 화면에서 반복되는 2차 공통 컴포넌트 기본 동작을 확인하는 테스트 페이지"
    >
      <template #actions>
        <BaseButton variant="secondary" @click="isActivityModalOpen = true">활동 상세 보기</BaseButton>
      </template>
    </PageTitleBar>

    <DocumentSummarySection :fields="documentSummaryFields" />

    <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <BaseCard title="DocumentHeaderActions" subtitle="문서 상세 상단 액션 묶음">
        <DocumentHeaderActions />
      </BaseCard>

      <BaseCard title="ActivityTypeBadge" subtitle="활동 유형별 상태 표현">
        <div class="flex flex-wrap gap-3">
          <ActivityTypeBadge
            v-for="type in activityTypes"
            :key="type.value"
            :value="type.value"
          />
        </div>
      </BaseCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <LineItemTable :items="lineItems" currency-symbol="$" />
      <LinkedDocumentList :documents="linkedDocuments" />
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <BaseCard title="SearchableCombobox" subtitle="검색 가능한 선택 입력 패턴">
        <div class="space-y-3">
          <SearchableCombobox
            v-model="selectedBuyer"
            :options="buyerOptions"
            placeholder="바이어 또는 거래처 검색"
          />
          <p class="text-sm text-slate-500">선택 값: {{ selectedBuyer || '-' }}</p>
        </div>
      </BaseCard>

      <BaseCard title="DateRangeField" subtitle="기간 선택 공통 패턴">
        <DateRangeField
          :start="filterState.dateFrom"
          :end="filterState.dateTo"
          @update:start="filterState.dateFrom = $event"
          @update:end="filterState.dateTo = $event"
          @reset="resetFilters"
        />
      </BaseCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <BaseCard title="SearchModal" subtitle="상세검색 / PO 검색 공통 모달">
        <div class="flex items-center justify-between gap-4">
          <p class="text-sm text-slate-500">검색 대상 목록에서 행을 선택하는 모달 패턴입니다.</p>
          <BaseButton @click="isSearchModalOpen = true">검색 모달 열기</BaseButton>
        </div>
      </BaseCard>

      <BaseCard title="FileUploadField" subtitle="도장/서명 이미지 업로드 공통 패턴">
        <FileUploadField
          v-model="uploadedSignature"
          label="서명 이미지 업로드"
          helper-text="사용자 또는 바이어 서명 이미지 업로드에 사용하는 공통 컴포넌트입니다."
        />
      </BaseCard>
    </section>

    <FilterPanel
      :keyword="filterState.keyword"
      :type-value="filterState.typeValue"
      :date-from="filterState.dateFrom"
      :date-to="filterState.dateTo"
      :type-options="activityTypes"
      @update:keyword="filterState.keyword = $event"
      @update:type-value="filterState.typeValue = $event"
      @update:date-from="filterState.dateFrom = $event"
      @update:date-to="filterState.dateTo = $event"
      @reset="resetFilters"
      @search="null"
    />

    <ActivityDetailModal
      :open="isActivityModalOpen"
      :activity="selectedActivity"
      @close="isActivityModalOpen = false"
    />

    <SearchModal
      :open="isSearchModalOpen"
      title="PO 검색"
      :columns="searchModalColumns"
      :rows="searchModalRows"
      :search-keyword="filterState.keyword"
      @update:search-keyword="filterState.keyword = $event"
      @select="isSearchModalOpen = false"
      @close="isSearchModalOpen = false"
    >
      <template #cell-status="{ value }">
        <span class="text-sm text-slate-700">{{ value }}</span>
      </template>
    </SearchModal>
  </div>
</template>
