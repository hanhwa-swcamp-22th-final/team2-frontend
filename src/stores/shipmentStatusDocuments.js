import { ref } from 'vue'

function createInitialShipmentStatusDocuments() {
  return [
    {
      id: 'SH26001',
      status: '출하준비',
      clientName: 'COOLSAY SDN BHD',
      poId: 'PO26001',
      shipmentOrderId: 'SO2026001',
      requestDate: '2026/03/26',
      dueDate: '2026/04/05',
      updatedAt: '2026/03/28 14:30',
      manager: '김영업',
      remarks: '출하 서류 검토 후 출하완료 처리 예정',
      items: [
        { name: 'Wireless Presenter', quantity: '30 EA' },
        { name: 'USB-C Hub 7-in-1', quantity: '200 EA' },
        { name: 'Bluetooth Headset', quantity: '100 EA' },
        { name: 'Wireless Mouse', quantity: '32 EA' },
      ],
    },
    {
      id: 'SH26004',
      status: '출하준비',
      clientName: 'Viet Steel JSC',
      poId: 'PO26004',
      shipmentOrderId: 'SO2026002',
      requestDate: '2026/03/29',
      dueDate: '2026/04/30',
      updatedAt: '2026/03/30 09:40',
      manager: '정영업',
      remarks: '독일향 선적 일정 확정 대기',
      items: [
        { name: 'Smart Projector FHD', quantity: '40 EA' },
        { name: 'All-in-One PC 24"', quantity: '18 EA' },
      ],
    },
    {
      id: 'SH26005',
      status: '출하완료',
      clientName: 'Pacific Trading Inc.',
      poId: 'PO26003',
      shipmentOrderId: 'SO2026003',
      requestDate: '2026/03/18',
      dueDate: '2026/06/05',
      updatedAt: '2026/03/31 18:10',
      manager: '정영업',
      remarks: '출하완료 및 후속 수출서류 전달 완료',
      items: [
        { name: 'External SSD 1TB', quantity: '80 EA' },
        { name: 'Mechanical Keyboard', quantity: '40 EA' },
        { name: 'Wireless Presenter', quantity: '40 EA' },
      ],
    },
  ]
}

const shipmentStatusDocuments = ref(createInitialShipmentStatusDocuments())

export function useShipmentStatusDocuments() {
  return shipmentStatusDocuments
}
