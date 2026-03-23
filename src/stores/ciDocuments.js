import { ref } from 'vue'

import { resolveIncotermsLabel, resolveMasterCurrency, resolvePaymentTermLabel, resolvePortLabel } from '@/utils/ciplMaster'

const ciSeedRecords = [
  {
    id: 'CI26001',
    status: '발행완료',
    issueDate: '2026/02/18',
    clientName: 'COOLSAY SDN BHD',
    clientAddress: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
    buyer: 'Mr. Ahmad Razak (Purchasing Manager)',
    country: '말레이시아',
    currencyCode: 'USD',
    itemName: 'Wireless Presenter',
    amount: '$21,870',
    totalAmount: '21,870.00',
    incotermCode: 'FOB',
    namedPlace: 'BUSAN',
    paymentTermsId: 1,
    deliveryDate: '2026/04/15',
    portOfDischargeCode: '',
    portOfDischargeFallback: 'KLANG, MALAYSIA',
    carrier: 'KMTC BUSAN',
    poId: 'PO26001',
    shipmentOrderId: 'SO2026001',
    remarks: 'T/T REMITTANCE',
    items: [
      { name: 'Wireless Presenter', hsCode: '8471.60', quantity: '30', unitPrice: '55.00', amount: '1,650.00', remark: '' },
      { name: 'USB-C Hub 7-in-1', hsCode: '8473.30', quantity: '200', unitPrice: '48.00', amount: '9,600.00', remark: '' },
      { name: 'Bluetooth Headset', hsCode: '8518.30', quantity: '100', unitPrice: '95.00', amount: '9,500.00', remark: '' },
      { name: 'Wireless Mouse', hsCode: '8471.60', quantity: '32', unitPrice: '35.00', amount: '1,120.00', remark: '' },
    ],
  },
  {
    id: 'CI26002',
    status: '발행완료',
    issueDate: '2026/02/28',
    clientName: 'TechBridge GmbH',
    clientAddress: 'Am Sandtorkai 35, 20457 Hamburg, Germany',
    buyer: 'Ms. Hanna Schneider (Procurement Lead)',
    country: '독일',
    currencyCode: 'EUR',
    itemName: 'Smart Projector FHD',
    amount: '€60,900',
    totalAmount: '60,900.00',
    incotermCode: 'CIF',
    namedPlace: 'HAMBURG',
    paymentTermsId: 2,
    deliveryDate: '2026/05/20',
    portOfDischargeCode: 'DEHAM',
    portOfDischargeFallback: 'HAMBURG, GERMANY',
    carrier: 'HAPAG-LLOYD',
    poId: 'PO26002',
    shipmentOrderId: 'SO2026002',
    remarks: 'L/C',
    items: [
      { name: 'Smart Projector FHD', hsCode: '8528.62', quantity: '40', unitPrice: '780.00', amount: '31,200.00', remark: '' },
      { name: 'All-in-One PC 24"', hsCode: '8471.41', quantity: '18', unitPrice: '1,650.00', amount: '29,700.00', remark: '' },
    ],
  },
  {
    id: 'CI26003',
    status: '발행대기',
    issueDate: '2026/03/12',
    clientName: 'Pacific Trading Inc.',
    clientAddress: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
    buyer: 'Mr. Jacob Miller (Import Manager)',
    country: '미국',
    currencyCode: 'USD',
    itemName: 'External SSD 1TB',
    amount: '$14,840',
    totalAmount: '14,840.00',
    incotermCode: 'CFR',
    namedPlace: 'LOS ANGELES',
    paymentTermsId: 1,
    deliveryDate: '2026/06/01',
    portOfDischargeCode: 'USLAX',
    portOfDischargeFallback: 'LOS ANGELES, USA',
    carrier: 'ONE BLUE',
    poId: 'PO26003',
    shipmentOrderId: 'SO2026003',
    remarks: 'T/T REMITTANCE',
    items: [
      { name: 'External SSD 1TB', hsCode: '8471.70', quantity: '80', unitPrice: '98.00', amount: '7,840.00', remark: '' },
      { name: 'Mechanical Keyboard', hsCode: '8471.60', quantity: '40', unitPrice: '120.00', amount: '4,800.00', remark: '' },
      { name: 'Wireless Presenter', hsCode: '8471.60', quantity: '40', unitPrice: '55.00', amount: '2,200.00', remark: '' },
    ],
  },
]

function createInitialCiDocuments() {
  return ciSeedRecords.map((record) => ({
    ...record,
    currency: resolveMasterCurrency(record.currencyCode, record.currencyCode),
    incoterms: resolveIncotermsLabel(record.incotermCode, record.namedPlace),
    paymentTerms: resolvePaymentTermLabel(record.paymentTermsId, record.remarks),
    portOfDischarge: resolvePortLabel(record.portOfDischargeCode, record.portOfDischargeFallback),
  }))
}

const ciDocuments = ref(createInitialCiDocuments())

export function useCiDocuments() {
  return ciDocuments
}
