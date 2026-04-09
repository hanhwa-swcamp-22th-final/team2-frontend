<script setup>
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import { useToast } from '@/composables/useToast'
import { sendDocumentEmail } from '@/api/emails'

const props = defineProps({
  open: { type: Boolean, default: false },
  // 'CI' | 'PL' | 'PI' | 'PO' 등 백엔드 docTypes 값
  docType: { type: String, required: true },
  // 거래처 ID (필수)
  clientId: { type: [Number, String], default: null },
  // 발주서 코드 (CI/PL 발송 시 필수)
  poId: { type: String, default: '' },
  // 모달 상단에 노출할 문서 식별자 (예: 'CI-2026-0001')
  documentLabel: { type: String, default: '' },
  // 기본 수신자 정보 (거래처 담당자 등)
  defaultRecipientName: { type: String, default: '' },
  defaultRecipientEmail: { type: String, default: '' },
})

const emit = defineEmits(['close', 'sent'])

const toast = useToast()

const recipientName = ref('')
const recipientEmail = ref('')
const subject = ref('')
const submitting = ref(false)

const canSubmit = computed(
  () =>
    !submitting.value &&
    !!recipientEmail.value.trim() &&
    !!subject.value.trim() &&
    !!props.clientId,
)

watch(
  () => props.open,
  (next) => {
    if (next) {
      recipientName.value = props.defaultRecipientName ?? ''
      recipientEmail.value = props.defaultRecipientEmail ?? ''
      subject.value = props.documentLabel
        ? `[${props.docType}] ${props.documentLabel} 송부드립니다.`
        : `[${props.docType}] 문서 송부`
    } else {
      submitting.value = false
    }
  },
)

function handleClose() {
  if (submitting.value) return
  emit('close')
}

async function handleSubmit() {
  if (!canSubmit.value) return
  if (!props.clientId) {
    toast.error('거래처 정보가 없어 메일을 발송할 수 없습니다.')
    return
  }

  submitting.value = true
  try {
    const payload = {
      clientId: Number(props.clientId),
      poId: props.poId || undefined,
      emailTitle: subject.value.trim(),
      emailRecipientName: recipientName.value.trim() || undefined,
      emailRecipientEmail: recipientEmail.value.trim(),
      docTypes: [props.docType],
    }
    const response = await sendDocumentEmail(payload)
    if (response?.status === 'SENT') {
      toast.success('메일을 발송했습니다.')
      emit('sent', response)
      emit('close')
    } else {
      toast.error(response?.message || '메일 발송에 실패했습니다.')
    }
  } catch (error) {
    const message = error?.response?.data?.message ?? '메일 발송에 실패했습니다.'
    toast.error(message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="`${docType} 메일 발송`"
    :description="documentLabel ? `${documentLabel} 을(를) 첨부하여 발송합니다.` : ''"
    width="max-w-lg"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          수신자명 (선택)
        </label>
        <BaseTextField
          v-model="recipientName"
          placeholder="거래처 담당자 이름"
          :disabled="submitting"
        />
      </div>

      <div>
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          수신자 이메일 <span class="text-rose-500">*</span>
        </label>
        <BaseTextField
          v-model="recipientEmail"
          type="email"
          placeholder="example@buyer.com"
          autocomplete="email"
          :disabled="submitting"
        />
      </div>

      <div>
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          제목 <span class="text-rose-500">*</span>
        </label>
        <BaseTextField v-model="subject" :disabled="submitting" />
      </div>

      <div class="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <p>첨부 파일은 서버에서 자동으로 생성되어 첨부됩니다 ({{ docType }} PDF).</p>
        <p v-if="!clientId" class="mt-1 text-rose-500">
          ⚠ 거래처 정보가 없어 발송할 수 없습니다.
        </p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" :disabled="submitting" @click="handleClose">
        취소
      </BaseButton>
      <BaseButton :disabled="!canSubmit" @click="handleSubmit">
        <template #leading>
          <i class="fas fa-paper-plane text-xs" aria-hidden="true"></i>
        </template>
        {{ submitting ? '발송 중...' : '발송' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
