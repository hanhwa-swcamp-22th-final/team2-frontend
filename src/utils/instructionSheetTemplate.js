function text(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function hasRenderableItem(item) {
  if (!item || typeof item !== 'object') return false

  return ['name', 'quantity', 'unitPrice', 'amount', 'modelName', 'spec', 'dueDate', 'remark']
    .some((field) => text(item[field]) !== '')
}

export function getInstructionSheetConfig(kind = 'production') {
  return kind === 'shipment'
    ? {
        kind,
        title: '출 하 지 시 서',
        quantityLabel: '출하지시수량',
        dueLabel: '출하예정일',
      }
    : {
        kind: 'production',
        title: '생 산 지 시 서',
        quantityLabel: '생산지시수량',
        dueLabel: '납기일',
      }
}

export function buildInstructionSheetDocument(source, kind = 'production') {
  const config = getInstructionSheetConfig(kind)
  const doc = source && typeof source === 'object' ? source : {}
  const baseItems = Array.isArray(doc.items) && doc.items.length
    ? doc.items
    : [
        {
          name: doc.itemName,
          quantity: doc.quantity,
          unitPrice: doc.unitPrice,
          amount: doc.amount,
          modelName: doc.poId,
          spec: doc.country,
          dueDate: doc.dueDate || doc.deliveryDate,
          remark: doc.remarks || doc.status,
        },
      ]

  const rows = baseItems
    .filter(hasRenderableItem)
    .map((item, index) => ({
      no: index + 1,
      clientName: text(item.clientName, text(doc.clientName)),
      modelName: text(item.modelName, text(doc.poId)),
      itemName: text(item.itemName || item.name, text(doc.itemName)),
      spec: text(item.spec, text(doc.country)),
      quantity: text(item.quantity, text(doc.quantity)),
      dueDate: text(item.dueDate, text(doc.dueDate || doc.deliveryDate)),
      remark: text(item.remark, text(doc.remarks || doc.status)),
    }))

  const minimumBodyRows = 12
  const fillerRows = Array.from({ length: Math.max(0, minimumBodyRows - rows.length) }, (_, index) => ({
    no: '',
    clientName: '',
    modelName: '',
    itemName: '',
    spec: '',
    quantity: '',
    dueDate: '',
    remark: '',
    fillerKey: `filler-${index}`,
  }))

  return {
    ...config,
    id: text(doc.id),
    poId: text(doc.poId),
    clientName: text(doc.clientName),
    dueDate: text(doc.dueDate || doc.deliveryDate),
    manager: text(doc.manager),
    issueDate: text(doc.issueDate),
    department: text(doc.department, '영업부'),
    status: text(doc.status),
    remarks: text(doc.remarks),
    rows,
    renderRows: [...rows, ...fillerRows],
    metaFields: [
      { label: '지시번호', value: text(doc.id) },
      { label: 'PO번호', value: text(doc.poId) },
      { label: '거래처명', value: text(doc.clientName) },
      { label: config.dueLabel, value: text(doc.dueDate || doc.deliveryDate) },
    ],
    changeLogTitle: '문서변경현황',
    changeLogRows: [
      { department: '기술관리', signer: '' },
      { department: '생산관리', signer: '' },
      { department: '기타', signer: '' },
    ],
    brandMark: 'SB',
    brandName: 'SalesBoost',
    footerCode: '',
    footerCompany: 'SalesBoost',
    footerPaper: 'A4(210 x 297mm)',
  }
}
