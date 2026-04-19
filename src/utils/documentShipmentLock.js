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

/**
 * PO 의 Collection 수금완료 락. collection.status === '수금완료' 인 건이 있으면 잠금.
 */
export function getPoCollectionLockInfo(poId, collectionDocuments = []) {
  if (!poId) return { locked: false, references: [] }
  const references = collectionDocuments
    .filter((row) => String(row.poId ?? '') === String(poId) && row.status === '수금완료')
    .map((row) => ({ type: '수금완료', id: row.collectionId ?? row.id ?? '' }))
  return { locked: references.length > 0, references }
}

export function formatPoCollectionLockMessage(lockInfo) {
  if (!lockInfo?.locked || !lockInfo.references?.length) return ''
  const reference = lockInfo.references[0]
  return `수금완료된 건${reference.id ? ` (ID: ${reference.id})` : ''}이 있어 이 PO는 수정/삭제할 수 없습니다.`
}

/**
 * PI 의 간접 수금 락 — linked PO 중 하나라도 Collection PAID 이면 잠금.
 */
export function getPiCollectionLockInfo(piId, poDocuments = [], collectionDocuments = []) {
  if (!piId) return { locked: false, references: [] }
  const linkedPoIds = poDocuments
    .filter((row) => row.piId === piId || row.linkedPiId === piId)
    .map((row) => row.id)
  const references = linkedPoIds.flatMap((poId) => (
    collectionDocuments
      .filter((row) => String(row.poId ?? '') === String(poId) && row.status === '수금완료')
      .map((row) => ({ type: '수금완료', id: row.collectionId ?? row.id ?? '', poId }))
  ))
  return { locked: references.length > 0, references }
}

export function formatPiCollectionLockMessage(lockInfo) {
  if (!lockInfo?.locked || !lockInfo.references?.length) return ''
  const reference = lockInfo.references[0]
  return `수금완료된 건이 연결된 PO ${reference.poId}가 있어 이 PI는 수정/삭제할 수 없습니다.`
}

/**
 * 생산지시서(MO) 발행된 PO 는 MO 가 '생산완료' 되기 전까지 출하완료 처리 불가.
 * MO 자체가 없으면 출하만으로 진행 (영업담당자가 재고 보유 가정).
 */
export function getPoProductionGate(poId, productionOrderDocuments = []) {
  if (!poId) return { blocked: false, pendingIds: [] }
  const mos = productionOrderDocuments.filter((row) => row.poId === poId)
  if (mos.length === 0) return { blocked: false, pendingIds: [] }
  const pending = mos.filter((row) => row.status !== '생산완료')
  return { blocked: pending.length > 0, pendingIds: pending.map((r) => r.id) }
}

export function formatPoProductionGateMessage(gate) {
  if (!gate?.blocked) return ''
  const first = gate.pendingIds[0]
  return `생산지시서${first ? ` ${first}` : ''}가 생산완료 상태가 아니므로 출하완료 처리할 수 없습니다.`
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

  // PI→PO 1:N 허용 — 이미 연결된 PO가 있어도 선택 가능 (분할 주문/수정 발주).
  // 취소·결재대기·출하완료 락만 차단. 서버(PurchaseOrderCreationService)가 CONFIRMED PI 기준 최종 검증.
  return {
    selectable: !canceled && !approvalPending && !shipmentLockInfo.locked,
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
