function isShipmentCompletedStatus(status) {
  return String(status ?? '').trim() === '출하완료'
}

export function resolvePoShipmentDocumentStatus(
  poId,
  currentStatus,
  shipmentOrderDocuments = [],
  shipmentStatusDocuments = [],
) {
  if (!poId) return currentStatus

  const linkedShipmentStatuses = shipmentStatusDocuments.filter((row) => row.poId === poId)
  if (linkedShipmentStatuses.length > 0) {
    return linkedShipmentStatuses.some((row) => isShipmentCompletedStatus(row.status))
      ? '출하완료'
      : currentStatus
  }

  const linkedShipmentOrders = shipmentOrderDocuments.filter((row) => row.poId === poId)
  if (linkedShipmentOrders.some((row) => isShipmentCompletedStatus(row.status))) {
    return '출하완료'
  }

  return currentStatus
}

function getShipmentCompletionReferencesForPo(poId, shipmentOrderDocuments = [], shipmentStatusDocuments = []) {
  if (!poId) return []

  const shipmentOrderRefs = shipmentOrderDocuments
    .filter((row) => row.poId === poId && isShipmentCompletedStatus(row.status))
    .map((row) => ({
      type: '출하지시서',
      id: row.id,
      status: row.status,
    }))

  const shipmentStatusRefs = shipmentStatusDocuments
    .filter((row) => row.poId === poId && isShipmentCompletedStatus(row.status))
    .map((row) => ({
      type: '출하현황',
      id: row.id,
      status: row.status,
    }))

  return [...shipmentOrderRefs, ...shipmentStatusRefs]
}

export function getPoShipmentLockInfo(poId, shipmentOrderDocuments = [], shipmentStatusDocuments = []) {
  const references = getShipmentCompletionReferencesForPo(poId, shipmentOrderDocuments, shipmentStatusDocuments)

  return {
    locked: references.length > 0,
    references,
  }
}

export function getPiShipmentLockInfo(piId, poDocuments = [], shipmentOrderDocuments = [], shipmentStatusDocuments = []) {
  if (!piId) {
    return {
      locked: false,
      references: [],
      linkedPoIds: [],
    }
  }

  const linkedPoIds = poDocuments
    .filter((row) => row.piId === piId || row.linkedPiId === piId)
    .map((row) => row.id)

  const references = linkedPoIds.flatMap((poId) => (
    getShipmentCompletionReferencesForPo(poId, shipmentOrderDocuments, shipmentStatusDocuments)
      .map((reference) => ({
        ...reference,
        poId,
      }))
  ))

  return {
    locked: references.length > 0,
    references,
    linkedPoIds,
  }
}

export function formatPoShipmentLockMessage(lockInfo) {
  if (!lockInfo?.locked || !lockInfo.references?.length) {
    return ''
  }

  const reference = lockInfo.references[0]
  return `출하완료된 ${reference.type} ${reference.id}가 연결되어 있어 이 PO는 수정/삭제할 수 없습니다.`
}

export function formatPiShipmentLockMessage(lockInfo) {
  if (!lockInfo?.locked || !lockInfo.references?.length) {
    return ''
  }

  const reference = lockInfo.references[0]
  return `출하완료된 ${reference.type} ${reference.id}가 연결된 PO ${reference.poId}가 있어 이 PI는 수정/삭제할 수 없습니다.`
}

export function getPiPoSelectionInfo(
  piRow,
  poDocuments = [],
  shipmentOrderDocuments = [],
  shipmentStatusDocuments = [],
  productionDocuments = [],
  ciDocuments = [],
  plDocuments = [],
  currentPoId = '',
) {
  const shipmentLockInfo = getPiShipmentLockInfo(
    piRow?.id,
    poDocuments,
    shipmentOrderDocuments,
    shipmentStatusDocuments,
  )
  const canceled = String(piRow?.status ?? '').trim() === '취소'
  const approvalPending = String(piRow?.status ?? '').trim() === '결재대기'
  const activeLinkedPoRows = poDocuments.filter((row) => {
    const linkedPiId = row?.piId || row?.linkedPiId || ''
    const samePo = String(row?.id ?? '') === String(currentPoId ?? '')
    const canceledPo = String(row?.status ?? '').trim() === '취소'
    return linkedPiId === piRow?.id && !samePo && !canceledPo
  })
  const activeLinkedPoIds = activeLinkedPoRows.map((row) => row.id)
  const issuedReferences = [
    ...productionDocuments
      .filter((row) => activeLinkedPoIds.includes(row.poId))
      .map((row) => ({ type: '생산지시서', id: row.id, poId: row.poId, status: row.status })),
    ...shipmentOrderDocuments
      .filter((row) => activeLinkedPoIds.includes(row.poId))
      .map((row) => ({ type: '출하지시서', id: row.id, poId: row.poId, status: row.status })),
    ...shipmentStatusDocuments
      .filter((row) => activeLinkedPoIds.includes(row.poId))
      .map((row) => ({ type: '출하현황', id: row.id, poId: row.poId, status: row.status })),
    ...ciDocuments
      .filter((row) => activeLinkedPoIds.includes(row.poId))
      .map((row) => ({ type: 'CI', id: row.id, poId: row.poId, status: row.status })),
    ...plDocuments
      .filter((row) => activeLinkedPoIds.includes(row.poId))
      .map((row) => ({ type: 'PL', id: row.id, poId: row.poId, status: row.status })),
  ]

  return {
    selectable: !canceled && !approvalPending && !shipmentLockInfo.locked && activeLinkedPoRows.length === 0,
    canceled,
    approvalPending,
    shipmentLockInfo,
    activeLinkedPoRows,
    issuedReferences,
  }
}

export function formatPiPoSelectionMessage(selectionInfo, piId = '') {
  if (selectionInfo?.canceled) {
    return `${piId || '선택한 PI'}는 취소 상태라 PO 등록 기준 문서로 사용할 수 없습니다.`
  }

  if (selectionInfo?.approvalPending) {
    return `${piId || '선택한 PI'}는 결재대기 상태라 PO 등록 기준 문서로 사용할 수 없습니다.`
  }

  if (selectionInfo?.activeLinkedPoRows?.length) {
    const linkedPo = selectionInfo.activeLinkedPoRows[0]
    const issuedReference = selectionInfo.issuedReferences?.[0]

    if (issuedReference) {
      return `${piId || '선택한 PI'}는 이미 PO ${linkedPo.id}에 연결되어 있고 ${issuedReference.type} ${issuedReference.id}까지 발행되어 재사용할 수 없습니다.`
    }

    return `${piId || '선택한 PI'}는 이미 PO ${linkedPo.id}에 연결되어 있어 재사용할 수 없습니다.`
  }

  if (selectionInfo?.shipmentLockInfo?.locked) {
    return formatPiShipmentLockMessage(selectionInfo.shipmentLockInfo)
  }

  return ''
}
