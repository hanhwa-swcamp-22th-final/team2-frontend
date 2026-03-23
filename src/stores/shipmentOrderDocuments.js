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
      itemName: 'Wireless Presenter',
      manager: '김영업',
      dueDate: '2026/04/20',
      requestedBy: '김영업',
      plannedShipDate: '2026/04/18',
      remarks: '포장 완료 후 부산항 반입 예정',
      items: [
        { name: 'Wireless Presenter', quantity: '30', unit: 'EA', remark: '포장 완료' },
        { name: 'USB-C Hub 7-in-1', quantity: '200', unit: 'EA', remark: '박스 포장 완료' },
        { name: 'Bluetooth Headset', quantity: '100', unit: 'EA', remark: '완충 후 포장' },
        { name: 'Wireless Mouse', quantity: '32', unit: 'EA', remark: '수신기 동봉 확인' },
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
      itemName: 'Smart Projector FHD',
      manager: '김영업',
      dueDate: '2026/05/25',
      requestedBy: '김영업',
      plannedShipDate: '2026/05/23',
      remarks: '독일향 선적 서류 사전 점검 필요',
      items: [
        { name: 'Smart Projector FHD', quantity: '40', unit: 'EA', remark: '완충 포장 대기' },
        { name: 'All-in-One PC 24"', quantity: '18', unit: 'EA', remark: '모서리 보호재 적용' },
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
      itemName: 'External SSD 1TB',
      manager: '정영업',
      dueDate: '2026/06/05',
      requestedBy: '정영업',
      plannedShipDate: '2026/06/02',
      remarks: '수입국 라벨 부착 여부 최종 확인 필요',
      items: [
        { name: 'External SSD 1TB', quantity: '80', unit: 'EA', remark: '라벨링 확인 필요' },
        { name: 'Mechanical Keyboard', quantity: '40', unit: 'EA', remark: '언어 레이아웃 확인' },
        { name: 'Wireless Presenter', quantity: '40', unit: 'EA', remark: '배터리 분리 포장' },
      ],
    },
  ]
}

const shipmentOrderDocuments = ref(createInitialShipmentOrderDocuments())

export function useShipmentOrderDocuments() {
  return shipmentOrderDocuments
}
