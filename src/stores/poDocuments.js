import { ref } from 'vue'

function createInitialPoDocuments() {
  return [
    {
      id: 'PO26001',
      piId: 'PI26001',
      linkedPiId: 'PI26001',
      issueDate: '2026/02/05',
      clientName: 'COOLSAY SDN BHD',
      clientAddress: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
      buyerName: 'Mr. Ahmad Razak (Purchasing Manager)',
      currency: 'USD',
      country: '말레이시아',
      itemName: 'H-Beam 482x300x11x15',
      amount: '$42,400',
      totalAmount: '$42,400',
      incoterms: 'FOB',
      namedPlace: 'BUSAN',
      manager: '김영업',
      status: '확정',
      deliveryDate: '2026/04/20',
      sourceDeliveryDate: '2026/04/15',
      deliveryDateOverride: true,
      items: [
        { name: 'H-Beam 482x300x11x15', qty: '30', unit: 'EA', unitPrice: '850', amount: '25500', remark: '' },
        { name: 'Lubricant Oil SAE 10W-40', qty: '200', unit: 'EA', unitPrice: '30', amount: '6000', remark: '' },
        { name: 'Industrial Grease EP-2', qty: '100', unit: 'EA', unitPrice: '45', amount: '4500', remark: '' },
        { name: 'Hydraulic Oil ISO VG 46', qty: '32', unit: 'EA', unitPrice: '200', amount: '6400', remark: '' },
      ],
      linkedDocuments: [
        { id: 'PI26001', status: '확정' },
        { id: 'SO2026001', status: '준비중' },
      ],
      revisionHistory: [],
    },
    {
      id: 'PO26002',
      piId: 'PI26002',
      linkedPiId: 'PI26002',
      issueDate: '2026/02/20',
      clientName: 'TechBridge GmbH',
      clientAddress: 'Am Sandtorkai 35, 20457 Hamburg, Germany',
      buyerName: 'Ms. Hanna Schneider (Procurement Lead)',
      currency: 'EUR',
      country: '독일',
      itemName: 'H-Beam 482x300x11x15',
      amount: '€68,400',
      totalAmount: '€68,400',
      incoterms: 'CIF',
      namedPlace: 'HAMBURG',
      manager: '김영업',
      status: '발송',
      deliveryDate: '2026/05/25',
      sourceDeliveryDate: '2026/05/20',
      deliveryDateOverride: true,
      items: [
        { name: 'H-Beam 482x300x11x15', qty: '80', unit: 'EA', unitPrice: '855', amount: '68400', remark: '' },
      ],
      linkedDocuments: [
        { id: 'PI26002', status: '발송' },
      ],
      revisionHistory: [],
    },
    {
      id: 'PO26003',
      piId: 'PI26003',
      linkedPiId: 'PI26003',
      issueDate: '2026/03/03',
      clientName: 'Pacific Trading Inc.',
      clientAddress: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
      buyerName: 'Mr. Jacob Miller (Import Manager)',
      currency: 'USD',
      country: '미국',
      itemName: 'Lubricant Oil SAE 10W-40',
      amount: '$15,600',
      totalAmount: '$15,600',
      incoterms: 'CFR',
      namedPlace: 'LOS ANGELES',
      manager: '정영업',
      status: '초안',
      deliveryDate: '2026/06/05',
      sourceDeliveryDate: '2026/06/01',
      deliveryDateOverride: true,
      items: [
        { name: 'Lubricant Oil SAE 10W-40', qty: '520', unit: 'EA', unitPrice: '30', amount: '15600', remark: '' },
      ],
      linkedDocuments: [
        { id: 'PI26003', status: '초안' },
      ],
      revisionHistory: [],
    },
  ]
}

const poDocuments = ref(createInitialPoDocuments())

export function usePoDocuments() {
  return poDocuments
}
