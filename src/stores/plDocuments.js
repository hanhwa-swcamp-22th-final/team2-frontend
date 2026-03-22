import { ref } from 'vue'

import { resolveIncotermsLabel, resolvePaymentTermLabel, resolvePortLabel } from '@/utils/ciplMaster'

const plSeedRecords = [
  {
    id: 'PL26001',
    status: '발행완료',
    issueDate: '2026/02/18',
    clientName: 'COOLSAY SDN BHD',
    clientAddress: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
    buyer: 'Mr. Ahmad Razak (Purchasing Manager)',
    country: '말레이시아',
    itemName: 'H-Beam 482x300x11x15',
    grossWeight: '18,520',
    bookingNo: 'KMTC-240218-01',
    incotermCode: 'FOB',
    namedPlace: 'BUSAN',
    paymentTermsId: 1,
    deliveryDate: '2026/04/15',
    portOfDischargeCode: '',
    portOfDischargeFallback: 'KLANG, MALAYSIA',
    carrier: 'KMTC BUSAN',
    poId: 'PO26001',
    shipmentOrderId: 'SO2026001',
    remarks: 'SAME AS CONSIGNEE',
    totalQuantity: '362 EA',
    totalNetWeight: '17,980',
    totalGrossWeight: '18,520',
    totalMeasurement: '24.80',
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '30', netWeight: '12,800', grossWeight: '13,050', measurement: '16.20' },
      { name: 'Lubricant Oil SAE 10W-40', quantity: '200', netWeight: '2,940', grossWeight: '3,080', measurement: '4.10' },
      { name: 'Industrial Grease EP-2', quantity: '100', netWeight: '1,120', grossWeight: '1,180', measurement: '2.20' },
      { name: 'Hydraulic Oil ISO VG 46', quantity: '32', netWeight: '1,120', grossWeight: '1,210', measurement: '2.30' },
    ],
  },
  {
    id: 'PL26002',
    status: '발행완료',
    issueDate: '2026/02/28',
    clientName: 'TechBridge GmbH',
    clientAddress: 'Am Sandtorkai 35, 20457 Hamburg, Germany',
    buyer: 'Ms. Hanna Schneider (Procurement Lead)',
    country: '독일',
    itemName: 'H-Beam 482x300x11x15',
    grossWeight: '24,860',
    bookingNo: 'HL-240228-07',
    incotermCode: 'CIF',
    namedPlace: 'HAMBURG',
    paymentTermsId: 2,
    deliveryDate: '2026/05/20',
    portOfDischargeCode: 'DEHAM',
    portOfDischargeFallback: 'HAMBURG, GERMANY',
    carrier: 'HAPAG-LLOYD',
    poId: 'PO26002',
    shipmentOrderId: 'SO2026002',
    remarks: 'SAME AS CONSIGNEE',
    totalQuantity: '58 EA',
    totalNetWeight: '24,120',
    totalGrossWeight: '24,860',
    totalMeasurement: '31.40',
    items: [
      { name: 'H-Beam 482x300x11x15', quantity: '40', netWeight: '15,900', grossWeight: '16,260', measurement: '20.10' },
      { name: 'Steel Girder 340x250x9x14', quantity: '18', netWeight: '8,220', grossWeight: '8,600', measurement: '11.30' },
    ],
  },
  {
    id: 'PL26003',
    status: '발행대기',
    issueDate: '2026/03/12',
    clientName: 'Pacific Trading Inc.',
    clientAddress: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
    buyer: 'Mr. Jacob Miller (Import Manager)',
    country: '미국',
    itemName: 'Lubricant Oil SAE 10W-40',
    grossWeight: '7,430',
    bookingNo: 'ONE-240312-03',
    incotermCode: 'CFR',
    namedPlace: 'LOS ANGELES',
    paymentTermsId: 1,
    deliveryDate: '2026/06/01',
    portOfDischargeCode: 'USLAX',
    portOfDischargeFallback: 'LOS ANGELES, USA',
    carrier: 'ONE BLUE',
    poId: 'PO26003',
    shipmentOrderId: 'SO2026003',
    remarks: 'SAME AS CONSIGNEE',
    totalQuantity: '440 EA',
    totalNetWeight: '7,060',
    totalGrossWeight: '7,430',
    totalMeasurement: '10.60',
    items: [
      { name: 'Lubricant Oil SAE 10W-40', quantity: '320', netWeight: '5,120', grossWeight: '5,350', measurement: '7.90' },
      { name: 'Industrial Grease EP-2', quantity: '120', netWeight: '1,940', grossWeight: '2,080', measurement: '2.70' },
    ],
  },
]

function createInitialPlDocuments() {
  return plSeedRecords.map((record) => ({
    ...record,
    incoterms: resolveIncotermsLabel(record.incotermCode, record.namedPlace),
    paymentTerms: resolvePaymentTermLabel(record.paymentTermsId, 'T/T REMITTANCE'),
    portOfDischarge: resolvePortLabel(record.portOfDischargeCode, record.portOfDischargeFallback),
  }))
}

const plDocuments = ref(createInitialPlDocuments())

export function usePlDocuments() {
  return plDocuments
}
