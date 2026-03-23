import { ref } from 'vue'

function createInitialProductionOrderDocuments() {
  return [
    {
      id: 'MO2026001',
      status: '완료',
      issueDate: '2026/02/24',
      poId: 'PO26001',
      country: '말레이시아',
      clientName: 'COOLSAY SDN BHD',
      clientAddress: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
      itemName: 'H-Beam 482x300x11x15',
      manager: '김영업',
      dueDate: '2026/04/20',
      department: '영업부',
      productionSite: '부산 1공장',
      requestedBy: '김영업',
      completionTarget: '2026/04/18',
      remarks: 'PO 기준 납기보다 2일 선행 생산 완료 요청',
      linkedDocuments: [{ id: 'PO26001', status: '확정' }],
      items: [
        { name: 'H-Beam 482x300x11x15', quantity: '30', unit: 'EA', unitPrice: '$850', amount: '$25,500', remark: '절단 사양 확인 완료' },
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
      itemName: 'H-Beam 482x300x11x15',
      manager: '김영업',
      dueDate: '2026/05/25',
      department: '영업부',
      productionSite: '포항 2공장',
      requestedBy: '김영업',
      completionTarget: '2026/05/22',
      remarks: '도장 공정 포함, 출하 전 외관 검사 필요',
      linkedDocuments: [{ id: 'PO26002', status: '발송' }],
      items: [
        { name: 'H-Beam 482x300x11x15', quantity: '80', unit: 'EA', unitPrice: '€855', amount: '€68,400', remark: '도장 공정 대기' },
      ],
    },
    {
      id: 'MO2026003',
      status: '대기',
      issueDate: '2026/03/14',
      poId: 'PO26003',
      country: '미국',
      clientName: 'Pacific Trading Inc.',
      clientAddress: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
      itemName: 'Lubricant Oil SAE 10W-40',
      manager: '정영업',
      dueDate: '2026/06/05',
      department: '영업부',
      productionSite: '울산 포장센터',
      requestedBy: '정영업',
      completionTarget: '2026/06/03',
      remarks: '신규 거래처 첫 생산, 라벨링 시안 확인 필요',
      linkedDocuments: [{ id: 'PO26003', status: '초안' }],
      items: [
        { name: 'Lubricant Oil SAE 10W-40', quantity: '520', unit: 'EA', unitPrice: '$30', amount: '$15,600', remark: '라벨 확인 대기' },
      ],
    },
  ]
}

const productionOrderDocuments = ref(createInitialProductionOrderDocuments())

export function useProductionOrderDocuments() {
  return productionOrderDocuments
}
