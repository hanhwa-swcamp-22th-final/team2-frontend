<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import { isValidEmail, isValidTel, MAX_LEN } from '@/utils/validators'
import { getPhoneInfoByCountry, formatPhoneInput } from '@/utils/phoneFormat'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  client: { type: Object, default: null },
  countries: { type: Array, default: () => [] },
  ports: { type: Array, default: () => [] },
  currencies: { type: Array, default: () => [] },
  paymentTerms: { type: Array, default: () => [] },
  departments: { type: Array, default: () => [] },
  teams: { type: Array, default: () => [] },
  defaultDepartmentId: { type: [Number, String], default: null },
  defaultTeamId: { type: [Number, String], default: null },
  lockTeam: { type: Boolean, default: false },
  allClients: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const form = ref(getInitialForm())
const errors = ref({})

const countryOptions = computed(() =>
  props.countries.map((c) => ({ label: `${c.countryNameKr} (${c.countryName})`, value: c.countryId })),
)

const portOptions = computed(() => {
  if (!form.value.countryId) return []
  const cid = String(form.value.countryId)
  return props.ports
    .filter((p) => String(p.countryId) === cid)
    .map((p) => ({ label: p.portName, value: p.id }))
})

const paymentTermsOptions = computed(() =>
  props.paymentTerms.map((p) => ({ label: `${p.paymentTermCode} (${p.paymentTermDescription})`, value: p.paymentTermId })),
)

const currencyOptions = computed(() =>
  props.currencies.map((c) => ({ label: `${c.currencyCode} (${c.currencySymbol})`, value: c.currencyId })),
)

const statusOptions = [
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

const selectedCountryName = computed(() => {
  if (!form.value.countryId) return ''
  const c = props.countries.find((c) => c.countryId === form.value.countryId)
  return c?.countryName ?? ''
})

const phoneInfo = computed(() => getPhoneInfoByCountry(selectedCountryName.value))

function handleTelInput(event) {
  const raw = event.target.value
  if (phoneInfo.value.code) {
    form.value.tel = formatPhoneInput(raw, phoneInfo.value.code, phoneInfo.value.format)
  }
}

function generateNextCode() {
  const codes = props.allClients.map((c) => c.clientCode ?? c.code)
  let maxNum = 0
  for (const code of codes) {
    const match = code.match(/^CLI(\d+)$/)
    if (match) maxNum = Math.max(maxNum, Number(match[1]))
  }
  return `CLI${String(maxNum + 1).padStart(3, '0')}`
}

function getInitialForm() {
  return {
    code: '',
    name: '',
    nameKr: '',
    countryId: null,
    city: '',
    portId: null,
    address: '',
    tel: '',
    email: '',
    paymentTermsId: null,
    currencyId: null,
    manager: '',
    buyerPosition: '',
    buyerEmail: '',
    buyerTel: '',
    departmentId: null,
    teamId: null,
    status: 'active',
    sealImage: null,
  }
}

const teamOptions = computed(() => {
  const filtered = form.value.departmentId
    ? props.teams.filter((t) => String(t.departmentId) === String(form.value.departmentId))
    : props.teams
  return filtered.map((t) => ({ label: t.teamName, value: t.teamId }))
})

const departmentOptions = computed(() =>
  props.departments.map((d) => ({ label: d.departmentName ?? d.name, value: d.departmentId ?? d.id })),
)

watch(() => form.value.departmentId, (deptId) => {
  const team = props.teams.find((t) => String(t.teamId) === String(form.value.teamId))
  if (team && String(team.departmentId) !== String(deptId)) {
    form.value.teamId = null
  }
})

watch(
  () => props.open,
  (isOpen) => {
    errors.value = {}
    if (isOpen && props.mode === 'edit' && props.client) {
      // countryName/portName 기반 ID 역매핑 fallback
      const resolvedCountryId = props.client.countryId
        ?? props.countries.find((c) => c.countryName === props.client.countryName)?.countryId
        ?? null
      const resolvedPortId = props.client.portId
        ?? props.ports.find((p) => p.portName === props.client.portName)?.id
        ?? null
      const resolvedTeamId = props.client.teamId ?? null
      const teamMatch = props.teams.find((t) => String(t.teamId) === String(resolvedTeamId))
      const resolvedDeptId = teamMatch?.departmentId ?? props.client.departmentId ?? null
      form.value = {
        code: props.client.clientCode ?? '',
        name: props.client.clientName ?? '',
        nameKr: props.client.clientNameKr ?? '',
        countryId: resolvedCountryId,
        city: props.client.clientCity ?? '',
        portId: resolvedPortId,
        address: props.client.clientAddress ?? '',
        tel: props.client.clientTel ?? '',
        email: props.client.clientEmail ?? '',
        paymentTermsId: props.client.paymentTermId ?? props.client.paymentTermsId ?? null,
        currencyId: props.client.currencyId ?? null,
        manager: props.client.clientManager ?? '',
        departmentId: resolvedDeptId,
        teamId: resolvedTeamId,
        status: props.client.clientStatus ?? 'active',
        sealImage: null,
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = getInitialForm()
      form.value.code = generateNextCode()
      // 작성자(현재 로그인 사용자) 팀으로 기본값 채움
      if (props.defaultTeamId) form.value.teamId = props.defaultTeamId
      if (props.defaultDepartmentId) form.value.departmentId = props.defaultDepartmentId
    }
  },
)

watch(
  () => form.value.countryId,
  (newId, oldId) => {
    if (oldId == null || newId === oldId) return
    // 국가 변경 시 해당 국가에 속하지 않는 항구·통화 초기화
    const cid = String(newId)
    const portBelongs = props.ports.some((p) => String(p.countryId) === cid && String(p.id) === String(form.value.portId))
    if (!portBelongs) form.value.portId = null

    // 국가 변경 시 전화번호 prefix 자동 세팅
    const info = phoneInfo.value
    if (info.code && !form.value.tel) {
      form.value.tel = `${info.code} `
    }
  },
)

function validate() {
  const e = {}

  // 코드는 백엔드 auto-generate (create 모드), 수정 모드는 disabled

  if (!form.value.name?.trim()) {
    e.name = '영문 거래처명을 입력하세요.'
  } else if (form.value.name.length > MAX_LEN.NAME) {
    e.name = `거래처명은 ${MAX_LEN.NAME}자 이내로 입력하세요.`
  }

  if (form.value.nameKr && form.value.nameKr.length > MAX_LEN.NAME_KR) {
    e.nameKr = `한글 거래처명은 ${MAX_LEN.NAME_KR}자 이내로 입력하세요.`
  }

  if (!form.value.countryId) {
    e.countryId = '국가를 선택하세요.'
  }

  if (!form.value.portId) {
    e.portId = '도착항을 선택하세요.'
  }

  if (!form.value.address?.trim()) {
    e.address = '주소를 입력하세요.'
  } else if (form.value.address.length > MAX_LEN.ADDRESS) {
    e.address = `주소는 ${MAX_LEN.ADDRESS}자 이내로 입력하세요.`
  }

  if (!form.value.manager?.trim()) {
    e.manager = '거래처 담당자(바이어)를 입력하세요.'
  } else if (form.value.manager.length > MAX_LEN.MANAGER) {
    e.manager = `담당자명은 ${MAX_LEN.MANAGER}자 이내로 입력하세요.`
  }

  // 바이어 정보 — 신규 등록 시만 필수 (수정 시 Client 만 수정, Buyer 는 상세 페이지에서)
  if (props.mode === 'create') {
    if (!form.value.buyerEmail?.trim()) {
      e.buyerEmail = '바이어 이메일을 입력하세요.'
    } else if (!isValidEmail(form.value.buyerEmail)) {
      e.buyerEmail = '올바른 이메일 형식을 입력하세요.'
    }
    if (form.value.buyerTel && !isValidTel(form.value.buyerTel)) {
      e.buyerTel = '올바른 전화번호 형식을 입력하세요.'
    }
  }

  if (!form.value.tel?.trim()) {
    e.tel = '거래처 연락처를 입력하세요.'
  } else if (!isValidTel(form.value.tel)) {
    e.tel = '올바른 전화번호 형식을 입력하세요. (예: +82 02-1234-5678)'
  }

  if (!form.value.email?.trim()) {
    e.email = '거래처 이메일을 입력하세요.'
  } else if (!isValidEmail(form.value.email)) {
    e.email = '올바른 이메일 형식을 입력하세요.'
  }

  if (!form.value.paymentTermsId) {
    e.paymentTermsId = '결제조건을 선택하세요.'
  }

  if (!form.value.currencyId) {
    e.currencyId = '통화를 선택하세요.'
  }

  if (!form.value.departmentId) {
    e.departmentId = '담당 부서를 선택하세요.'
  }

  if (!form.value.teamId) {
    e.teamId = '담당 팀을 선택하세요.'
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function handleSave() {
  if (!validate()) return
  const payload = {
    // 생성 시 code는 백엔드 auto-generate, 수정 시만 기존 code 유지
    ...(props.mode === 'edit' ? { clientCode: form.value.code } : {}),
    clientName: form.value.name,
    clientNameKr: form.value.nameKr,
    countryId: form.value.countryId,
    clientCity: form.value.city,
    portId: form.value.portId,
    clientAddress: form.value.address,
    clientTel: form.value.tel,
    clientEmail: form.value.email,
    paymentTermId: form.value.paymentTermsId,
    currencyId: form.value.currencyId,
    clientManager: form.value.manager,
    ...(props.mode === 'create' && {
      buyerPosition: form.value.buyerPosition || null,
      buyerEmail: form.value.buyerEmail,
      buyerTel: form.value.buyerTel || null,
    }),
    teamId: form.value.teamId,
  }
  emit('save', payload)
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? '거래처 등록' : `거래처 수정 – ${client?.clientName ?? client?.name ?? ''}`"
    width="max-w-3xl"
    @close="emit('close')"
  >
    <form class="space-y-6" @submit.prevent="handleSave">
      <!-- 기본 정보 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">기본 정보</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField v-if="mode === 'edit'" label="코드">
            <BaseTextField v-model="form.code" disabled />
          </FormField>
          <FormField label="영문 거래처명" required>
            <BaseTextField v-model="form.name" placeholder="영문 거래처명을 입력하세요" />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
          </FormField>
          <FormField label="한글 거래처명">
            <BaseTextField v-model="form.nameKr" placeholder="한글 거래처명을 입력하세요" />
          </FormField>
        </div>
      </div>

      <!-- 위치 정보 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">위치 정보</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="국가" required>
            <SearchableCombobox v-model="form.countryId" :options="countryOptions" placeholder="국가를 검색하세요" />
            <p v-if="errors.countryId" class="mt-1 text-xs text-red-500">{{ errors.countryId }}</p>
          </FormField>
          <FormField label="도시">
            <BaseTextField v-model="form.city" placeholder="도시를 입력하세요" />
          </FormField>
          <FormField label="도착항" required>
            <SearchableCombobox v-model="form.portId" :options="portOptions" :disabled="!form.countryId" :placeholder="form.countryId ? '도착항을 검색하세요' : '국가를 먼저 선택하세요'" />
            <p v-if="errors.portId" class="mt-1 text-xs text-red-500">{{ errors.portId }}</p>
          </FormField>
          <FormField label="주소" required>
            <BaseTextField v-model="form.address" placeholder="영문 주소를 입력하세요" />
            <p v-if="errors.address" class="mt-1 text-xs text-red-500">{{ errors.address }}</p>
          </FormField>
        </div>
      </div>

      <!-- 거래처 대표 연락처 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">거래처 대표 연락처</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="거래처 TEL (대표)" required>
            <BaseTextField
              v-model="form.tel"
              :placeholder="phoneInfo.placeholder"
              :maxlength="MAX_LEN.TEL"
              @input="handleTelInput"
            />
            <p v-if="errors.tel" class="mt-1 text-xs text-red-500">{{ errors.tel }}</p>
          </FormField>
          <FormField label="거래처 Email (대표)" required>
            <BaseTextField v-model="form.email" type="email" placeholder="contact@company.com" />
            <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
          </FormField>
        </div>
      </div>

      <!-- 최초 바이어 정보 (신규 등록 시만) -->
      <div v-if="mode === 'create'">
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          최초 바이어 정보
          <span class="ml-2 text-[11px] font-normal normal-case text-slate-400">
            거래처 등록 시 대표 바이어 1명 자동 등록 — 추가 바이어는 상세 페이지에서.
          </span>
        </h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="바이어 이름" required>
            <BaseTextField v-model="form.manager" placeholder="예: Mr. Ahmad Razak" />
            <p v-if="errors.manager" class="mt-1 text-xs text-red-500">{{ errors.manager }}</p>
          </FormField>
          <FormField label="바이어 직책">
            <BaseTextField v-model="form.buyerPosition" placeholder="예: Purchasing Manager" />
          </FormField>
          <FormField label="바이어 Email" required>
            <BaseTextField v-model="form.buyerEmail" type="email" placeholder="buyer@company.com" />
            <p v-if="errors.buyerEmail" class="mt-1 text-xs text-red-500">{{ errors.buyerEmail }}</p>
          </FormField>
          <FormField label="바이어 TEL">
            <BaseTextField v-model="form.buyerTel" :placeholder="phoneInfo.placeholder" />
            <p v-if="errors.buyerTel" class="mt-1 text-xs text-red-500">{{ errors.buyerTel }}</p>
          </FormField>
        </div>
      </div>

      <!-- 수정 모드: 거래처 담당자명만 -->
      <div v-else>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">거래처 담당자</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="거래처 담당자 (대표 바이어)" required>
            <BaseTextField v-model="form.manager" placeholder="예: Mr. Ahmad Razak" />
            <p v-if="errors.manager" class="mt-1 text-xs text-red-500">{{ errors.manager }}</p>
            <p v-else class="mt-1 text-xs text-slate-400">바이어 세부 정보는 거래처 상세 페이지에서 수정합니다.</p>
          </FormField>
        </div>
      </div>

      <!-- 거래 조건 -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">거래 조건</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="결제조건" required>
            <BaseSelect v-model="form.paymentTermsId" :options="paymentTermsOptions" placeholder="결제조건을 선택하세요" />
            <p v-if="errors.paymentTermsId" class="mt-1 text-xs text-red-500">{{ errors.paymentTermsId }}</p>
          </FormField>
          <FormField label="통화" required>
            <BaseSelect v-model="form.currencyId" :options="currencyOptions" :disabled="!form.countryId" :placeholder="form.countryId ? '통화를 선택하세요' : '국가를 먼저 선택하세요'" />
            <p v-if="errors.currencyId" class="mt-1 text-xs text-red-500">{{ errors.currencyId }}</p>
          </FormField>
          <FormField label="상태">
            <BaseSelect v-model="form.status" :options="statusOptions" placeholder="상태를 선택하세요" />
          </FormField>
        </div>
      </div>

      <!-- 담당 조직 (작성자 팀 기본 — admin 만 변경 가능) -->
      <div>
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          담당 조직
          <span v-if="lockTeam" class="ml-2 text-[11px] font-normal normal-case text-slate-400">
            본인 소속 팀으로 자동 지정 (관리자만 변경 가능)
          </span>
        </h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="담당 부서" required>
            <BaseSelect
              v-model="form.departmentId"
              :options="departmentOptions"
              :disabled="lockTeam"
              placeholder="부서를 선택하세요"
            />
            <p v-if="errors.departmentId" class="mt-1 text-xs text-red-500">{{ errors.departmentId }}</p>
          </FormField>
          <FormField label="담당 팀" required>
            <BaseSelect
              v-model="form.teamId"
              :options="teamOptions"
              :disabled="lockTeam || !form.departmentId"
              :placeholder="form.departmentId ? '팀을 선택하세요' : '부서를 먼저 선택하세요'"
            />
            <p v-if="errors.teamId" class="mt-1 text-xs text-red-500">{{ errors.teamId }}</p>
          </FormField>
        </div>
      </div>

      <FileUploadField
        v-model="form.sealImage"
        label="거래처 도장 이미지"
        accept="image/*"
        helper-text="거래처 도장 이미지를 업로드하세요. (PNG, JPG 권장)"
      />
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" :disabled="saving" @click="handleSave">{{ saving ? '저장 중...' : '저장' }}</BaseButton>
    </template>
  </BaseModal>
</template>
