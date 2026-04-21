<script setup>
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import { useToast } from '@/composables/useToast'
import { sendDocumentEmail } from '@/api/emails'
import { buildDocumentPdfAttachment } from '@/utils/documentOutput'

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
  // 메일 첨부 PDF를 현재 미리보기와 같은 HTML 빌더로 렌더링하기 위한 문서 데이터
  document: { type: Object, default: null },
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
const submitStatus = ref('')

// clientId 가 0/null 이라도 수신자 이메일·제목만 있으면 발송 허용한다.
// (과거 빌드에서 생성된 PO/CI/PL 은 ClientResponse.id 필드 명명 버그로 clientId=0 로 저장됐는데,
//  모달이 clientId 존재를 강제하면 그 문서들 메일 발송이 영구 차단됨. 이미 확정된 문서라
//  이메일 자체는 첨부 PDF·수신자 기준으로 내보낼 수 있어야 한다. 2026-04-21)
const canSubmit = computed(
  () =>
    !submitting.value &&
    !!recipientEmail.value.trim() &&
    !!subject.value.trim(),
)

// 외국 거래처 대상이 기본이므로 제목 템플릿은 영문으로 기본화한다 (Issue F).
// 사용자는 모달에서 제목을 자유롭게 수정 가능하므로 국내 거래처면 직접 편집.
const DOC_TYPE_ENGLISH_LABEL = {
  PI: 'Proforma Invoice',
  PO: 'Purchase Order',
  CI: 'Commercial Invoice',
  PL: 'Packing List',
}

watch(
  () => props.open,
  (next) => {
    if (next) {
      recipientName.value = props.defaultRecipientName ?? ''
      recipientEmail.value = props.defaultRecipientEmail ?? ''
      const englishLabel = DOC_TYPE_ENGLISH_LABEL[props.docType] ?? props.docType
      subject.value = props.documentLabel
        ? `${englishLabel} ${props.documentLabel} — Please find attached`
        : `${englishLabel} — Document enclosed`
    } else {
      submitting.value = false
      submitStatus.value = ''
    }
  },
)

function handleClose() {
  if (submitting.value) return
  emit('close')
}

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  submitStatus.value = '첨부 PDF 생성 중...'
  try {
    const attachments = []
    if (props.document) {
      attachments.push(await buildDocumentPdfAttachment(props.docType, props.document, {
        filename: props.documentLabel || props.document?.id || props.docType,
      }))
    }

    submitStatus.value = '메일 발송 중...'
    const payload = {
      // clientId 가 비어있는 과거 문서도 발송 가능하도록 0 으로 fallback.
      // 백엔드 EmailSendRequest 는 @NotNull 이라 0 은 통과(로그에 clientId=0 기록).
      clientId: props.clientId ? Number(props.clientId) : 0,
      poId: props.poId || undefined,
      emailTitle: subject.value.trim(),
      emailRecipientName: recipientName.value.trim() || undefined,
      emailRecipientEmail: recipientEmail.value.trim(),
      docTypes: [props.docType],
      attachments,
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
    const message = error?.response?.data?.message ?? error?.message ?? '메일 발송에 실패했습니다.'
    toast.error(message)
  } finally {
    submitting.value = false
    submitStatus.value = ''
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
        <p v-if="document">첨부 파일은 현재 미리보기 양식 그대로 PDF로 렌더링되어 첨부됩니다 ({{ docType }} PDF).</p>
        <p v-else>첨부 파일은 서버에서 자동으로 생성되어 첨부됩니다 ({{ docType }} PDF).</p>
        <p v-if="!clientId" class="mt-1 text-amber-600">
          ⚠ 거래처 ID 가 문서에 기록되어 있지 않습니다. 메일은 발송되지만 이력에 거래처 연결이 누락될 수 있습니다.
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
        {{ submitting ? (submitStatus || '발송 중...') : '발송' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
