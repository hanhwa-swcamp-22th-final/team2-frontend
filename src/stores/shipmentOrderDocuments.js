import { ref } from 'vue'

function createInitialShipmentOrderDocuments() {
  return [
    {
      id: 'SO2026001',
      issueDate: '2026/02/24',
      poId: 'PO26001',
      clientName: 'COOLSAY SDN BHD',
      country: '말레이시아',
      itemName: 'H-Beam 482x300x11x15',
      manager: '김영업',
      status: '출하완료',
      dueDate: '2026/04/20',
    },
    {
      id: 'SO2026002',
      issueDate: '2026/03/03',
      poId: 'PO26002',
      clientName: 'TechBridge GmbH',
      country: '독일',
      itemName: 'H-Beam 482x300x11x15',
      manager: '김영업',
      status: '준비완료',
      dueDate: '2026/05/25',
    },
    {
      id: 'SO2026003',
      issueDate: '2026/03/14',
      poId: 'PO26003',
      clientName: 'Pacific Trading Inc.',
      country: '미국',
      itemName: 'Lubricant Oil SAE 10W-40',
      manager: '정영업',
      status: '준비완료',
      dueDate: '2026/06/05',
    },
  ]
}

const shipmentOrderDocuments = ref(createInitialShipmentOrderDocuments())

export function useShipmentOrderDocuments() {
  return shipmentOrderDocuments
}
