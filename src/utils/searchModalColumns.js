function formatUnitPrice(value) {
  return `₩${Number(value || 0).toLocaleString()}`
}

export const clientSearchColumns = [
  { key: 'code', label: '코드', align: 'center', width: '110px' },
  { key: 'name', label: '거래처명', align: 'left', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '110px' },
  { key: 'city', label: '도시', align: 'center', width: '120px' },
  { key: 'currency', label: '통화', align: 'center', width: '90px' },
  { key: 'manager', label: '담당자', align: 'center', width: '120px' },
  { key: 'tel', label: '연락처', align: 'left', width: '170px' },
  { key: 'status', label: '상태', align: 'center', width: '90px' },
]

export const productSearchColumns = [
  { key: 'code', label: '코드', align: 'center', width: '110px' },
  { key: 'name', label: '품목명', align: 'left', width: '210px' },
  { key: 'nameKr', label: '국문명', align: 'left', width: '180px' },
  { key: 'spec', label: '규격', align: 'left', width: '280px' },
  { key: 'unit', label: '단위', align: 'center', width: '80px' },
  { key: 'unitPrice', label: '기준단가', align: 'right', width: '120px', format: formatUnitPrice },
  { key: 'hsCode', label: 'HS Code', align: 'center', width: '110px' },
  { key: 'status', label: '상태', align: 'center', width: '90px' },
]
