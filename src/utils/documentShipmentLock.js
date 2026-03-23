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
