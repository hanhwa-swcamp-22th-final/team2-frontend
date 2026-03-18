<script setup>
import { computed, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import InfoField from '@/components/common/InfoField.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'

// ── 더미 데이터 ────────────────────────────────────────────
const clients = ref([
  { id: 'CLI001', name: 'GlobalTech',   nameKr: '글로벌텍',  country: 'USA'     },
  { id: 'CLI002', name: 'EuroSupply',   nameKr: '유로서플라이', country: 'Germany' },
  { id: 'CLI003', name: 'AsiaConnect',  nameKr: '아시아커넥트', country: 'Japan'   },
])

const contacts = ref([
  { id: '1', clientId: 'CLI001', name: 'James Carter',  position: 'Team Leader', email: 'james.carter@globaltech.com',  tel: '+1-212-736-3110', signImageUrl: null },
  { id: '2', clientId: 'CLI001', name: 'Sarah Johnson', position: 'Team Member', email: 'sarah.johnson@globaltech.com', tel: '+1-212-736-3111', signImageUrl: null },
  { id: '3', clientId: 'CLI001', name: 'Michael Brown', position: 'Team Member', email: 'michael.brown@globaltech.com', tel: '+1-212-736-3112', signImageUrl: null },
  { id: '4', clientId: 'CLI002', name: 'Hans Müller',   position: 'Team Leader', email: 'hans.muller@eurosupply.de',    tel: '+49-30-1234-5678', signImageUrl: null },
  { id: '5', clientId: 'CLI002', name: 'Anna Schmidt',  position: 'Team Member', email: 'anna.schmidt@eurosupply.de',   tel: '+49-30-1234-5679', signImageUrl: null },
  { id: '6', clientId: 'CLI003', name: 'Yuki Tanaka',   position: 'Team Leader', email: 'yuki.tanaka@asiaconnect.jp',   tel: '+81-3-1234-5678',  signImageUrl: null },
  { id: '7', clientId: 'CLI003', name: 'Kenji Sato',    position: 'Team Member', email: 'kenji.sato@asiaconnect.jp',    tel: '+81-3-1234-5679',  signImageUrl: null },
])

// ── 검색 ───────────────────────────────────────────────────
const searchInput = ref('')    // 입력 중인 값 (버튼 클릭 전까지 화면에 반영 안 됨)
const searchKeyword = ref('')  // 실제 적용된 필터 값

const clientSearchOptions = computed(() =>
  clients.value.map((c) => ({ label: `${c.name} (${c.nameKr})`, value: c.id })),
)

function applySearch() {
  searchKeyword.value = searchInput.value
}

const filteredClients = computed(() => {
  if (!searchKeyword.value) return clients.value
  return clients.value.filter((c) => c.id === searchKeyword.value)
})

function getContactsByClient(clientId) {
  return contacts.value.filter((c) => c.clientId === clientId)
}



// ── 상세 모달 ──────────────────────────────────────────────
const selectedContact = ref(null)
const isDetailOpen = ref(false)

function openDetail(contact) {
  selectedContact.value = contact
  isDetailOpen.value = true
}

function closeDetail() {
  isDetailOpen.value = false
  selectedContact.value = null
}

function getClientName(clientId) {
  const client = clients.value.find((c) => c.id === clientId)
  return client ? `${client.name} (${client.nameKr})` : '-'
}

// ── 등록/수정 모달 ─────────────────────────────────────────
const isFormOpen = ref(false)
const isEditMode = ref(false)
const formClientId = ref('')
const formName = ref('')
const formPosition = ref('')
const formEmail = ref('')
const formTel = ref('')

const positionOptions = [
  { label: 'Team Leader', value: 'Team Leader' },
  { label: 'Team Member', value: 'Team Member' },
]

const clientOptions = computed(() =>
  clients.value.map((c) => ({ label: `${c.name} (${c.nameKr})`, value: c.id })),
)

function openCreate() {
  isEditMode.value = false
  formClientId.value = ''
  formName.value = ''
  formPosition.value = ''
  formEmail.value = ''
  formTel.value = ''
  isFormOpen.value = true
}

function openEdit(contact) {
  isEditMode.value = true
  formClientId.value = contact.clientId
  formName.value = contact.name
  formPosition.value = contact.position
  formEmail.value = contact.email
  formTel.value = contact.tel
  isDetailOpen.value = false
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

// ── 삭제 확인 모달 ─────────────────────────────────────────
const deleteTarget = ref(null)
const isDeleteOpen = ref(false)

function openDelete(contact) {
  deleteTarget.value = contact
  isDetailOpen.value = false
  isDeleteOpen.value = true
}

function closeDelete() {
  isDeleteOpen.value = false
  deleteTarget.value = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- 페이지 타이틀 -->
    <PageTitleBar title="컨택 리스트" description="거래처별 담당자 연락처를 조회하고 관리합니다.">
      <template #actions>
        <div class="w-64">
          <SearchableCombobox
            v-model="searchInput"
            :options="clientSearchOptions"
            placeholder="거래처 검색..."
          />
        </div>
        <BaseButton variant="ghost" @click="applySearch">
          <template #leading>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.473 9.766l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clip-rule="evenodd" />
            </svg>
          </template>
          검색
        </BaseButton>
        <BaseButton @click="openCreate">
          <template #leading>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </template>
          연락처 등록
        </BaseButton>
      </template>
    </PageTitleBar>

    <!-- 거래처별 카드 그룹 -->
    <div
      v-for="client in filteredClients"
      :key="client.id"
      class="space-y-3"
    >
      <!-- 거래처 그룹 헤더 -->
      <div>
        <h3 class="text-sm font-bold text-slate-800">{{ client.name }}</h3>
        <p class="text-xs text-slate-400">{{ client.nameKr }} · {{ client.country }}</p>
      </div>

      <!-- 컨택 카드 그리드 -->
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="contact in getContactsByClient(client.id)"
          :key="contact.id"
          class="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          @click="openDetail(contact)"
        >
          <!-- 이름 -->
          <div class="mb-3">
            <p class="text-sm font-semibold text-slate-800">{{ contact.name }}</p>
            <p class="text-xs text-slate-500">{{ contact.position }}</p>
          </div>
          <!-- 연락처 정보 -->
          <div class="space-y-1.5 text-xs">
            <div class="flex items-start gap-2 text-slate-600">
              <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
              </svg>
              <span class="break-all">{{ contact.email }}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-600">
              <svg class="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clip-rule="evenodd" />
              </svg>
              <span>{{ contact.tel }}</span>
            </div>
          </div>
          <!-- 수정/삭제 -->
          <div class="mt-3 flex justify-end gap-3 border-t border-slate-100 pt-2" @click.stop>
            <button type="button" class="text-xs text-brand-500 transition hover:text-brand-700" @click="openEdit(contact)">수정</button>
            <button type="button" class="text-xs text-slate-400 transition hover:text-red-500" @click="openDelete(contact)">삭제</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 결과 없음 -->
    <div
      v-if="filteredClients.length === 0"
      class="py-16 text-center text-sm text-slate-400"
    >
      검색 결과가 없습니다.
    </div>

    <!-- 상세 모달 -->
    <BaseModal
      :open="isDetailOpen"
      :title="selectedContact?.name ?? '연락처 상세'"
      width="max-w-md"
      @close="closeDetail"
    >
      <div class="space-y-4">
        <!-- 이름 -->
        <div>
          <p class="text-lg font-bold text-slate-900">{{ selectedContact?.name }}</p>
          <p class="text-sm text-slate-500">{{ selectedContact?.position }}</p>
        </div>
        <div class="space-y-3">
          <InfoField label="거래처" :value="getClientName(selectedContact?.clientId)" />
          <InfoField label="직위" :value="selectedContact?.position" />
          <InfoField label="이메일" :value="selectedContact?.email" />
          <InfoField label="전화" :value="selectedContact?.tel" />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="closeDetail">닫기</BaseButton>
        <BaseButton @click="openEdit(selectedContact)">수정</BaseButton>
      </template>
    </BaseModal>

    <!-- 등록/수정 모달 -->
    <BaseModal
      :open="isFormOpen"
      :title="isEditMode ? '연락처 수정' : '연락처 등록'"
      width="max-w-lg"
      @close="closeForm"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-slate-700">
              거래처 <span class="text-red-500">*</span>
            </p>
            <SearchableCombobox
              v-model="formClientId"
              :options="clientOptions"
              placeholder="거래처 검색/선택..."
            />
          </div>
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-slate-700">
              이름 <span class="text-red-500">*</span>
            </p>
            <BaseTextField v-model="formName" placeholder="연락처 이름" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-slate-700">직위</p>
            <BaseSelect v-model="formPosition" :options="positionOptions" placeholder="직위 선택" />
          </div>
          <div class="space-y-1.5">
            <p class="text-sm font-semibold text-slate-700">
              이메일 <span class="text-red-500">*</span>
            </p>
            <BaseTextField v-model="formEmail" placeholder="이메일" type="email" />
          </div>
        </div>
        <div class="space-y-1.5">
          <p class="text-sm font-semibold text-slate-700">전화</p>
          <BaseTextField v-model="formTel" placeholder="전화번호" />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="closeForm">취소</BaseButton>
        <BaseButton @click="closeForm">{{ isEditMode ? '수정' : '등록' }}</BaseButton>
      </template>
    </BaseModal>

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :open="isDeleteOpen"
      title="연락처 삭제"
      message="아래 연락처를 삭제하시겠습니까?"
      :detail="`${deleteTarget?.name} (${deleteTarget?.position})`"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="closeDelete"
      @cancel="closeDelete"
    />
  </div>
</template>
