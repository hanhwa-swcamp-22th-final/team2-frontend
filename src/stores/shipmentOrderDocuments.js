import { ref } from 'vue'

function createInitialShipmentOrderDocuments() {
  return [
    {
      id: 'SO2026001',
      status: '출하완료',
      issueDate: '2026/02/24',
      poId: 'PO26001',
      clientName: 'COOLSAY SDN BHD',
      country: '말레이시아',
      clientAddress: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
      itemName: 'H-Beam 482x300x11x15',
      manager: '김영업',
      dueDate: '2026/04/20',
      requestedBy: '김영업',
      plannedShipDate: '2026/04/18',
      remarks: '포장 완료 후 부산항 반입 예정',
      items: [
        { name: 'H-Beam 482x300x11x15', quantity: '30', unit: 'EA', unitPrice: '$850', amount: '$25,500', remark: '포장 완료' },
      ],
    },
    {
      id: 'SO2026002',
      status: '준비완료',
      issueDate: '2026/03/03',
      poId: 'PO26002',
      clientName: 'TechBridge GmbH',
      country: '독일',
      clientAddress: 'Am Sandtorkai 35, 20457 Hamburg, Germany',
      itemName: 'H-Beam 482x300x11x15',
      manager: '김영업',
      dueDate: '2026/05/25',
      requestedBy: '김영업',
      plannedShipDate: '2026/05/23',
      remarks: '독일향 선적 서류 사전 점검 필요',
      items: [
        { name: 'H-Beam 482x300x11x15', quantity: '80', unit: 'EA', unitPrice: '€855', amount: '€68,400', remark: '서류 검토 대기' },
      ],
    },
    {
      id: 'SO2026003',
      status: '준비완료',
      issueDate: '2026/03/14',
      poId: 'PO26003',
      clientName: 'Pacific Trading Inc.',
      country: '미국',
      clientAddress: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
      itemName: 'Lubricant Oil SAE 10W-40',
      manager: '정영업',
      dueDate: '2026/06/05',
      requestedBy: '정영업',
      plannedShipDate: '2026/06/02',
      remarks: '수입국 라벨 부착 여부 최종 확인 필요',
      items: [
        { name: 'Lubricant Oil SAE 10W-40', quantity: '520', unit: 'EA', unitPrice: '$30', amount: '$15,600', remark: '라벨링 확인 필요' },
      ],
    },
  ]
}

const shipmentOrderDocuments = ref(createInitialShipmentOrderDocuments())

export function useShipmentOrderDocuments() {
  return shipmentOrderDocuments
}
