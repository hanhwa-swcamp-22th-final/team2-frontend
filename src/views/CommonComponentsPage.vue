<script setup>
import { reactive, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import InfoField from '@/components/common/InfoField.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'

const form = reactive({
  name: '김영업',
  email: 'kim@salesboost.com',
  department: 'sales',
  note: '초도 거래처 미팅 이후 후속 견적 전달 예정',
  search: '',
})

const isModalOpen = ref(false)

const departmentOptions = [
  { label: '영업1팀', value: 'sales' },
  { label: '생산팀', value: 'production' },
  { label: '출하팀', value: 'shipping' },
  { label: '경영지원', value: 'support' },
]

const tableColumns = [
  { key: 'name', label: '화면', align: 'center' },
  { key: 'owner', label: '담당', align: 'center' },
  { key: 'status', label: '상태', align: 'center' },
  { key: 'action', label: '작업', align: 'center' },
]

const tableRows = [
  { id: 1, name: '거래처 목록', owner: '영업', status: '활성' },
  { id: 2, name: 'PI 상세', owner: '문서', status: '확정' },
  { id: 3, name: '사용자 관리', owner: '관리', status: '비활성' },
]

const badgeGroups = [
  {
    title: '사용자 상태',
    values: ['활성', '비활성', '재직', '휴직', '퇴직'],
  },
  {
    title: '문서 상태',
    values: ['초안', '발송', '확정', '취소', '접수', '생산중', '출하완료'],
  },
  {
    title: '진행 상태',
    values: ['준비중', '준비완료', '대기', '진행중', '완료'],
  },
  {
    title: '수금 상태',
    values: ['완납', '미수금'],
  },
  {
    title: '출하 지연 상태',
    values: ['정상', '지연위험', '지연'],
  },
  {
    title: '메일/임시 상태',
    values: ['발송완료', '임시저장', '실패'],
  },
]

function handleSearch(value) {
  form.search = value
}
</script>

<template>
  <div class="space-y-6">
    <PageTitleBar
      title="공통 컴포넌트 프리뷰"
      description="1차 구현한 공통 컴포넌트의 기본 동작과 화면 톤을 한 번에 확인하는 테스트 페이지"
    >
      <template #actions>
        <BaseButton variant="ghost">문서 보기</BaseButton>
        <BaseButton @click="isModalOpen = true">모달 열기</BaseButton>
      </template>
    </PageTitleBar>

    <section class="grid gap-6 xl:grid-cols-2">
      <BaseCard title="Button" subtitle="variant, size, disabled, block 조합 확인">
        <div class="space-y-4">
          <div class="flex flex-wrap gap-3">
            <BaseButton>저장</BaseButton>
            <BaseButton variant="secondary">취소</BaseButton>
            <BaseButton variant="ghost">인쇄</BaseButton>
            <BaseButton variant="danger">삭제</BaseButton>
            <BaseButton disabled>비활성</BaseButton>
          </div>
          <div class="flex flex-wrap gap-3">
            <BaseButton size="sm">작은 버튼</BaseButton>
            <BaseButton size="lg" variant="secondary">큰 버튼</BaseButton>
          </div>
          <BaseButton block>전체 너비 버튼</BaseButton>
        </div>
      </BaseCard>

      <BaseCard title="StatusBadge" subtitle="상태값별 색상 매핑 확인">
        <div class="space-y-4">
          <div
            v-for="group in badgeGroups"
            :key="group.title"
            class="space-y-2"
          >
            <p class="text-xs font-semibold text-slate-500">{{ group.title }}</p>
            <div class="flex flex-wrap gap-3">
              <StatusBadge
                v-for="value in group.values"
                :key="value"
                :value="value"
              />
            </div>
          </div>
        </div>
      </BaseCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <BaseCard title="Input" subtitle="텍스트, 셀렉트, 텍스트에어리어, 검색 입력 테스트">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="text-sm font-medium text-slate-600">이름</p>
            <BaseTextField v-model="form.name" placeholder="이름을 입력하세요" />
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-slate-600">이메일</p>
            <BaseTextField v-model="form.email" type="email" placeholder="이메일을 입력하세요" />
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-slate-600">부서</p>
            <BaseSelect v-model="form.department" :options="departmentOptions" placeholder="부서를 선택하세요" />
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-slate-600">비고</p>
            <BaseTextarea v-model="form.note" placeholder="비고를 입력하세요" />
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-slate-600">검색</p>
            <SearchInput
              v-model="form.search"
              placeholder="검색어를 입력하세요"
              @search="handleSearch"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard title="InfoField" subtitle="상세 페이지에서 쓰는 라벨 + 값 표시 형식">
        <div class="space-y-4">
          <InfoField label="거래처" value="COOLSAY SDN BHD" />
          <InfoField label="통화" value="USD" />
          <InfoField label="담당자" value="김영업" />
          <InfoField label="상태">
            <StatusBadge value="확정" />
          </InfoField>
          <InfoField label="비고" stacked>
            <p class="leading-6 text-slate-600">
              초도 미팅 이후 바이어 요청 사항을 정리해 다음 견적에 반영합니다.
            </p>
          </InfoField>
        </div>
      </BaseCard>
    </section>

    <BaseCard title="Table" subtitle="컬럼, 데이터, 슬롯 셀 렌더링 확인">
      <BaseTable :columns="tableColumns" :rows="tableRows" row-key="id">
        <template #cell-status="{ value }">
          <StatusBadge :value="value" />
        </template>
        <template #cell-action>
          <div class="flex justify-center gap-2">
            <BaseButton size="sm" variant="ghost">보기</BaseButton>
            <BaseButton size="sm" variant="secondary">수정</BaseButton>
          </div>
        </template>
      </BaseTable>
    </BaseCard>

    <BaseModal
      :open="isModalOpen"
      title="BaseModal 동작 확인"
      description="열기, 닫기, footer slot, backdrop 닫힘 동작을 테스트할 수 있습니다."
      @close="isModalOpen = false"
    >
      <div class="space-y-3 text-sm text-slate-600">
        <p>현재 구현한 BaseModal의 기본 구조를 확인하는 테스트용 내용입니다.</p>
        <p>우상단 닫기 버튼 또는 배경 클릭으로 닫히는지 확인할 수 있습니다.</p>
      </div>

      <template #footer>
        <BaseButton variant="secondary" @click="isModalOpen = false">취소</BaseButton>
        <BaseButton @click="isModalOpen = false">확인</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
