<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import FormField from '@/components/common/FormField.vue'
import { fetchAssignableUsers } from '@/api/documents'

const props = defineProps({
  open: { type: Boolean, default: false },
  po: { type: Object, default: () => null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

// 생산담당자 후보 (role=production, active). 모달 오픈 시점에 로드.
const candidates = ref([])
const loading = ref(false)
const loadError = ref('')
const selectedUserId = ref(null)

const options = computed(() => candidates.value.map((u) => ({
  label: `${u.userName ?? ''}${u.departmentName ? ` (${u.departmentName})` : ''}`,
  value: u.userId,
})))

const selectedCandidate = computed(() => candidates.value.find((u) => u.userId === selectedUserId.value))

const detailRows = computed(() => {
  if (!props.po) return []
  return [
    { label: '원천 PO', value: props.po.id ?? '-' },
    { label: '거래처', value: props.po.clientName ?? '-' },
    { label: '국가', value: props.po.country ?? '-' },
    { label: '납기일', value: props.po.deliveryDate ?? '-' },
  ]
})

async function loadCandidates() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchAssignableUsers('production')
    candidates.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('생산담당자 후보 조회 실패', e)
    loadError.value = '생산담당자 후보를 불러오지 못했습니다. 미지정으로 발행 시 PO 영업담당자가 자동 할당됩니다.'
    candidates.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    selectedUserId.value = null
    loadCandidates()
  }
})

function handleConfirm() {
  // 드롭다운 미선택 시 null 전달 → 백엔드가 PO 영업담당자 승계.
  emit('confirm', {
    assigneeUserId: selectedUserId.value ?? null,
    assigneeName: selectedCandidate.value?.userName ?? null,
  })
}
</script>

<template>
  <BaseModal :open="open" title="생산지시서 발행" width="max-w-xl" @close="emit('cancel')">
    <div class="space-y-4 text-sm">
      <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 leading-6 text-slate-700">
        선택한 PO 기준으로 생산지시서를 발행합니다. 발행 시 지정한 담당자만 생산완료 처리가 가능합니다.
      </div>

      <dl class="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div
          v-for="row in detailRows"
          :key="row.label"
          class="rounded-md border border-slate-200 bg-white px-4 py-3"
        >
          <dt class="text-xs font-medium text-slate-500">{{ row.label }}</dt>
          <dd class="mt-1 text-sm font-medium text-slate-800">{{ row.value }}</dd>
        </div>
      </dl>

      <FormField label="생산담당자" hint="미선택 시 PO 영업담당자가 자동 할당됩니다.">
        <BaseSelect
          v-model="selectedUserId"
          :options="options"
          :placeholder="loading ? '불러오는 중...' : (candidates.length ? '생산담당자 선택' : '등록된 생산담당자 없음')"
          :disabled="loading || !candidates.length"
        />
        <p v-if="loadError" class="mt-1 text-xs text-amber-600">{{ loadError }}</p>
      </FormField>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('cancel')">취소</BaseButton>
      <BaseButton :disabled="saving" @click="handleConfirm">{{ saving ? '발행 중...' : '발행' }}</BaseButton>
    </template>
  </BaseModal>
</template>
