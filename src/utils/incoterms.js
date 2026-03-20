export const shippingStageDefinitions = [
  { key: 'packing', label: '포장', icon: 'fa-box' },
  { key: 'loading', label: '적하', icon: 'fa-dolly' },
  { key: 'inland-origin', label: '내륙운송', icon: 'fa-truck' },
  { key: 'export-clearance', label: '수출통관', icon: 'fa-stamp' },
  { key: 'terminal-origin', label: '선적터미널', icon: 'fa-warehouse' },
  { key: 'on-board', label: '본선적재', icon: 'fa-ship' },
  { key: 'main-carriage', label: '해상운송', icon: 'fa-water' },
  { key: 'terminal-destination', label: '도착터미널', icon: 'fa-anchor' },
  { key: 'import-clearance', label: '수입통관', icon: 'fa-passport' },
  { key: 'inland-destination', label: '내륙운송', icon: 'fa-truck-moving' },
  { key: 'unloading', label: '양하', icon: 'fa-boxes-stacked' },
]

export const fallbackIncotermsCatalog = [
  {
    id: '1',
    code: 'EXW',
    name: 'Ex Works',
    nameKr: '공장인도',
    description: '매도인은 자신의 구내에서 물품을 인도하며 상차, 운송, 통관 비용은 매수인이 부담합니다.',
    transportMode: 'Any mode',
    sellerSegments: 1,
    defaultNamedPlace: 'SEOUL',
    namedPlacePlaceholder: '예: SEOUL',
  },
  {
    id: '2',
    code: 'FCA',
    name: 'Free Carrier',
    nameKr: '운송인인도',
    description: '매도인이 지정 장소에서 수출통관 후 운송인에게 물품을 인도합니다.',
    transportMode: 'Any mode',
    sellerSegments: 4,
    defaultNamedPlace: 'BUSAN',
    namedPlacePlaceholder: '예: BUSAN',
  },
  {
    id: '3',
    code: 'FAS',
    name: 'Free Alongside Ship',
    nameKr: '선측인도',
    description: '매도인이 지정 선적항의 본선 옆에 물품을 두면 인도가 완료됩니다.',
    transportMode: 'Sea / Inland Waterway',
    sellerSegments: 5,
    defaultNamedPlace: 'BUSAN',
    namedPlacePlaceholder: '예: BUSAN',
  },
  {
    id: '4',
    code: 'FOB',
    name: 'Free On Board',
    nameKr: '본선인도',
    description: '매도인이 지정 선적항에서 본선 적재까지 책임지며 이후 비용과 위험은 매수인이 부담합니다.',
    transportMode: 'Sea / Inland Waterway',
    sellerSegments: 6,
    defaultNamedPlace: 'BUSAN',
    namedPlacePlaceholder: '예: BUSAN',
  },
  {
    id: '5',
    code: 'CFR',
    name: 'Cost and Freight',
    nameKr: '운임포함인도',
    description: '매도인이 목적항까지의 운임을 부담하되 위험은 본선 적재 시점에 이전됩니다.',
    transportMode: 'Sea / Inland Waterway',
    sellerSegments: 7,
    defaultNamedPlace: 'LOS ANGELES',
    namedPlacePlaceholder: '예: LOS ANGELES',
  },
  {
    id: '6',
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    nameKr: '운임·보험료포함인도',
    description: '매도인이 목적항까지의 운임과 보험을 부담하며 위험은 본선 적재 시점에 이전됩니다.',
    transportMode: 'Sea / Inland Waterway',
    sellerSegments: 7,
    defaultNamedPlace: 'HAMBURG',
    namedPlacePlaceholder: '예: HAMBURG',
  },
  {
    id: '7',
    code: 'CPT',
    name: 'Carriage Paid To',
    nameKr: '운송비지급인도',
    description: '매도인이 지정 목적지까지 운송비를 지급하지만 위험은 최초 운송인 인도 시 이전됩니다.',
    transportMode: 'Any mode',
    sellerSegments: 7,
    defaultNamedPlace: 'SINGAPORE',
    namedPlacePlaceholder: '예: SINGAPORE',
  },
  {
    id: '8',
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    nameKr: '운송비·보험료지급인도',
    description: '매도인이 지정 목적지까지 운송비와 보험을 지급하며 위험은 최초 운송인 인도 시 이전됩니다.',
    transportMode: 'Any mode',
    sellerSegments: 7,
    defaultNamedPlace: 'ROTTERDAM',
    namedPlacePlaceholder: '예: ROTTERDAM',
  },
  {
    id: '9',
    code: 'DAP',
    name: 'Delivered At Place',
    nameKr: '도착장소인도',
    description: '매도인이 지정 도착장소까지 운송한 후 하차 전 상태로 인도합니다.',
    transportMode: 'Any mode',
    sellerSegments: 10,
    defaultNamedPlace: 'TOKYO',
    namedPlacePlaceholder: '예: TOKYO',
  },
  {
    id: '10',
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    nameKr: '도착장소양하인도',
    description: '매도인이 지정 도착장소까지 운송하고 양하까지 완료한 후 인도합니다.',
    transportMode: 'Any mode',
    sellerSegments: 11,
    defaultNamedPlace: 'SINGAPORE',
    namedPlacePlaceholder: '예: SINGAPORE',
  },
  {
    id: '11',
    code: 'DDP',
    name: 'Delivered Duty Paid',
    nameKr: '관세지급인도',
    description: '매도인이 수입통관과 관세를 포함한 대부분의 비용과 위험을 부담해 최종 목적지까지 인도합니다.',
    transportMode: 'Any mode',
    sellerSegments: 11,
    defaultNamedPlace: 'SEOUL',
    namedPlacePlaceholder: '예: SEOUL',
  },
]

export function normalizeIncoterms(value, namedPlace = '') {
  if (value && typeof value === 'object') {
    return normalizeIncoterms(value.code ?? value.incoterms ?? '', value.namedPlace ?? value.place ?? namedPlace)
  }

  const parts = String(value ?? '').trim().split(/\s+/).filter(Boolean)

  return {
    code: parts[0] ?? '',
    namedPlace: String(namedPlace ?? '').trim() || parts.slice(1).join(' '),
  }
}

export function getIncotermMeta(code, catalog = fallbackIncotermsCatalog) {
  const normalizedCode = String(code ?? '').trim().toUpperCase()
  return catalog.find((item) => item.code === normalizedCode) ?? catalog.find((item) => item.code === 'FOB') ?? fallbackIncotermsCatalog[0]
}

export function resolveIncotermState(value, namedPlace = '', catalog = fallbackIncotermsCatalog) {
  const normalized = normalizeIncoterms(value, namedPlace)
  const meta = getIncotermMeta(normalized.code, catalog)

  return {
    code: normalized.code || meta.code,
    namedPlace: normalized.namedPlace,
    meta,
  }
}

export function formatIncotermsLabel(value, namedPlace = '') {
  const normalized = normalizeIncoterms(value, namedPlace)
  return [normalized.code, normalized.namedPlace].filter(Boolean).join(' ') || '-'
}
