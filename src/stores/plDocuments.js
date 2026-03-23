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
    itemName: 'Wireless Presenter',
    grossWeight: '59.57',
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
    totalNetWeight: '56.68',
    totalGrossWeight: '59.57',
    totalMeasurement: '9.10',
    items: [
      { name: 'Wireless Presenter', quantity: '30', netWeight: '1.80', grossWeight: '1.95', measurement: '0.60' },
      { name: 'USB-C Hub 7-in-1', quantity: '200', netWeight: '24.00', grossWeight: '25.20', measurement: '3.20' },
      { name: 'Bluetooth Headset', quantity: '100', netWeight: '28.00', grossWeight: '29.40', measurement: '4.60' },
      { name: 'Wireless Mouse', quantity: '32', netWeight: '2.88', grossWeight: '3.02', measurement: '0.70' },
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
    itemName: 'Smart Projector FHD',
    grossWeight: '234.88',
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
    totalNetWeight: '225.40',
    totalGrossWeight: '234.88',
    totalMeasurement: '18.60',
    items: [
      { name: 'Smart Projector FHD', quantity: '40', netWeight: '112.00', grossWeight: '116.48', measurement: '8.40' },
      { name: 'All-in-One PC 24"', quantity: '18', netWeight: '113.40', grossWeight: '118.40', measurement: '10.20' },
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
    itemName: 'External SSD 1TB',
    grossWeight: '42.32',
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
    totalQuantity: '160 EA',
    totalNetWeight: '40.40',
    totalGrossWeight: '42.32',
    totalMeasurement: '4.00',
    items: [
      { name: 'External SSD 1TB', quantity: '80', netWeight: '4.00', grossWeight: '4.20', measurement: '0.80' },
      { name: 'Mechanical Keyboard', quantity: '40', netWeight: '34.00', grossWeight: '35.60', measurement: '2.40' },
      { name: 'Wireless Presenter', quantity: '40', netWeight: '2.40', grossWeight: '2.52', measurement: '0.80' },
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
