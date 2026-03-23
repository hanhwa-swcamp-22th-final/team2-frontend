import { ref } from 'vue'

function createInitialProductionOrderDocuments() {
  return [
    {
      id: 'MO2026001',
      status: '생산완료',
      issueDate: '2026/02/24',
      poId: 'PO26001',
      country: '말레이시아',
      clientName: 'COOLSAY SDN BHD',
      clientAddress: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
      itemName: 'Wireless Presenter',
      manager: '김영업',
      dueDate: '2026/04/20',
      department: '영업부',
      productionSite: '부산 1공장',
      requestedBy: '김영업',
      completionTarget: '2026/04/18',
      remarks: 'PO 기준 납기보다 2일 선행 생산 완료 요청',
      linkedDocuments: [{ id: 'PO26001', status: '확정' }],
      items: [
        { name: 'Wireless Presenter', quantity: '30', unit: 'EA', remark: '기본 기능 검수 완료' },
        { name: 'USB-C Hub 7-in-1', quantity: '200', unit: 'EA', remark: '포트 기능 점검 예정' },
        { name: 'Bluetooth Headset', quantity: '100', unit: 'EA', remark: '배터리 테스트 진행' },
        { name: 'Wireless Mouse', quantity: '32', unit: 'EA', remark: '수신기 동작 확인' },
      ],
    },
    {
      id: 'MO2026002',
      status: '진행중',
      issueDate: '2026/03/03',
      poId: 'PO26002',
      country: '독일',
      clientName: 'TechBridge GmbH',
      clientAddress: 'Am Sandtorkai 35, 20457 Hamburg, Germany',
      itemName: 'Smart Projector FHD',
      manager: '김영업',
      dueDate: '2026/05/25',
      department: '영업부',
      productionSite: '포항 2공장',
      requestedBy: '김영업',
      completionTarget: '2026/05/22',
      remarks: '도장 공정 포함, 출하 전 외관 검사 필요',
      linkedDocuments: [{ id: 'PO26002', status: '발송' }],
      items: [
        { name: 'Smart Projector FHD', quantity: '40', unit: 'EA', remark: '렌즈 검사 대기' },
        { name: 'All-in-One PC 24"', quantity: '18', unit: 'EA', remark: '전원 테스트 진행중' },
      ],
    },
    {
      id: 'MO2026003',
      status: '진행중',
      issueDate: '2026/03/14',
      poId: 'PO26003',
      country: '미국',
      clientName: 'Pacific Trading Inc.',
      clientAddress: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
      itemName: 'External SSD 1TB',
      manager: '정영업',
      dueDate: '2026/06/05',
      department: '영업부',
      productionSite: '울산 포장센터',
      requestedBy: '정영업',
      completionTarget: '2026/06/03',
      remarks: '신규 거래처 첫 생산, 라벨링 시안 확인 필요',
      linkedDocuments: [{ id: 'PO26003', status: '초안' }],
      items: [
        { name: 'External SSD 1TB', quantity: '80', unit: 'EA', remark: '펌웨어 검수 필요' },
        { name: 'Mechanical Keyboard', quantity: '40', unit: 'EA', remark: '키 스위치 테스트 진행' },
        { name: 'Wireless Presenter', quantity: '40', unit: 'EA', remark: '동글 인식 확인' },
      ],
    },
  ]
}

const productionOrderDocuments = ref(createInitialProductionOrderDocuments())

export function useProductionOrderDocuments() {
  return productionOrderDocuments
}
