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
    itemName: 'H-Beam 482x300x11x15',
    amount: '$42,400',
    totalAmount: '42,400.00',
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
      { name: 'H-Beam 482x300x11x15', hsCode: '7216.33', quantity: '30', unitPrice: '850.00', amount: '25,500.00', remark: '' },
      { name: 'Lubricant Oil SAE 10W-40', hsCode: '2710.19', quantity: '200', unitPrice: '30.00', amount: '6,000.00', remark: '' },
      { name: 'Industrial Grease EP-2', hsCode: '3403.19', quantity: '100', unitPrice: '45.00', amount: '4,500.00', remark: '' },
      { name: 'Hydraulic Oil ISO VG 46', hsCode: '2710.19', quantity: '32', unitPrice: '200.00', amount: '6,400.00', remark: '' },
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
    itemName: 'H-Beam 482x300x11x15',
    amount: '€68,400',
    totalAmount: '68,400.00',
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
      { name: 'H-Beam 482x300x11x15', hsCode: '7216.33', quantity: '40', unitPrice: '900.00', amount: '36,000.00', remark: '' },
      { name: 'Steel Girder 340x250x9x14', hsCode: '7216.32', quantity: '18', unitPrice: '1,800.00', amount: '32,400.00', remark: '' },
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
    itemName: 'Lubricant Oil SAE 10W-40',
    amount: '$15,600',
    totalAmount: '15,600.00',
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
      { name: 'Lubricant Oil SAE 10W-40', hsCode: '2710.19', quantity: '320', unitPrice: '30.00', amount: '9,600.00', remark: '' },
      { name: 'Industrial Grease EP-2', hsCode: '3403.19', quantity: '120', unitPrice: '50.00', amount: '6,000.00', remark: '' },
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
