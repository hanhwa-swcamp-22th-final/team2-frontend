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
      itemName: 'Wireless Presenter',
      amount: '$21,870',
      totalAmount: '$21,870',
      incoterms: 'FOB',
      namedPlace: 'BUSAN',
      manager: '김영업',
      status: '확정',
      deliveryDate: '2026/04/20',
      sourceDeliveryDate: '2026/04/15',
      deliveryDateOverride: true,
      items: [
        { name: 'Wireless Presenter', qty: '30', unit: 'EA', unitPrice: '55', amount: '1650', remark: '' },
        { name: 'USB-C Hub 7-in-1', qty: '200', unit: 'EA', unitPrice: '48', amount: '9600', remark: '' },
        { name: 'Bluetooth Headset', qty: '100', unit: 'EA', unitPrice: '95', amount: '9500', remark: '' },
        { name: 'Wireless Mouse', qty: '32', unit: 'EA', unitPrice: '35', amount: '1120', remark: '' },
      ],
      linkedDocuments: [
        { id: 'PI26001', status: '확정' },
        { id: 'SO2026001', status: '준비완료' },
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
      itemName: 'Smart Projector FHD',
      amount: '€60,900',
      totalAmount: '€60,900',
      incoterms: 'CIF',
      namedPlace: 'HAMBURG',
      manager: '김영업',
      status: '발송',
      deliveryDate: '2026/05/25',
      sourceDeliveryDate: '2026/05/20',
      deliveryDateOverride: true,
      items: [
        { name: 'Smart Projector FHD', qty: '40', unit: 'EA', unitPrice: '780', amount: '31200', remark: '' },
        { name: 'All-in-One PC 24"', qty: '18', unit: 'EA', unitPrice: '1650', amount: '29700', remark: '' },
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
      itemName: 'External SSD 1TB',
      amount: '$14,840',
      totalAmount: '$14,840',
      incoterms: 'CFR',
      namedPlace: 'LOS ANGELES',
      manager: '정영업',
      status: '출하완료',
      deliveryDate: '2026/06/05',
      sourceDeliveryDate: '2026/06/01',
      deliveryDateOverride: true,
      items: [
        { name: 'External SSD 1TB', qty: '80', unit: 'EA', unitPrice: '98', amount: '7840', remark: '' },
        { name: 'Mechanical Keyboard', qty: '40', unit: 'EA', unitPrice: '120', amount: '4800', remark: '' },
        { name: 'Wireless Presenter', qty: '40', unit: 'EA', unitPrice: '55', amount: '2200', remark: '' },
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
