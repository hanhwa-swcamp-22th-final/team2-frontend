import { useAuthStore } from './auth'
import { ref } from 'vue'
import { fetchCommercialInvoices } from '@/api/documents'

function formatDate(value) {
  return String(value ?? '').replace(/-/g, '/')
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  })
}

function formatCurrencyAmount(amount, currencyCode) {
  const symbols = { USD: '$', EUR: '€', JPY: '¥', GBP: '£', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CNY: '¥', MYR: 'RM', THB: '฿', VND: '₫', IDR: 'Rp', INR: '₹', SAR: '﷼', BRL: 'R$', SEK: 'kr', CHF: 'CHF', KRW: '₩' }
  const symbol = symbols[currencyCode] ?? ''
  return `${symbol}${formatNumber(amount, 0)}`
}

function mapCiResponse(row) {
  const items = (row.items ?? []).map((item) => ({
    name: item.itemName ?? item.name ?? '-',
    hsCode: item.hsCode ?? '-',
    quantity: String(item.quantity ?? 1),
    unitPrice: formatNumber(Number(item.unitPrice ?? 0), 2),
    amount: formatNumber(Number(item.amount ?? 0), 2),
    remark: item.remark ?? '',
  }))

  return {
    id: row.ciId,
    status: row.status ?? '발행대기',
    issueDate: formatDate(row.invoiceDate ?? row.issueDate),
    clientId: row.clientId ?? row.client_id ?? null,
    clientName: row.clientName ?? '-',
    clientEmail: row.clientEmail ?? row.client_email ?? '',
    clientAddress: row.clientAddress ?? '-',
    buyer: row.buyerName ?? '-',
    country: row.country ?? '-',
    currencyCode: row.currencyCode ?? 'USD',
    currency: row.currencyCode ?? 'USD',
    itemName: items[0]?.name ?? row.itemName ?? '-',
    amount: formatCurrencyAmount(row.totalAmount, row.currencyCode),
    totalAmount: formatNumber(Number(row.totalAmount ?? 0), 2),
    incotermCode: row.incotermsCode ?? '',
    incoterms: row.incotermsCode ? `${row.incotermsCode}${row.namedPlace ? ` ${row.namedPlace}` : ''}` : '-',
    namedPlace: row.namedPlace ?? '',
    paymentTermsId: row.paymentTermsId ?? null,
    paymentTerms: row.paymentTerms ?? '-',
    deliveryDate: formatDate(row.deliveryDate),
    portOfDischargeCode: row.portOfDischargeCode ?? '',
    portOfDischargeFallback: row.portOfDischarge ?? '-',
    portOfDischarge: row.portOfDischarge ?? '-',
    carrier: row.carrier ?? '-',
    poId: row.poId ?? '',
    shipmentOrderId: row.shipmentOrderId ?? '',
    remarks: row.remarks ?? '-',
    manager: row.managerName ?? '-',
    items,
  }
}

const ciDocuments = ref([])
let loading = null

export async function loadCiDocuments() {
  try {
    const data = await fetchCommercialInvoices()
    ciDocuments.value = (Array.isArray(data) ? data : []).map(mapCiResponse)
  } catch (e) {
    console.error('Failed to load CI documents:', e)
  }
}

export function useCiDocuments() {
  if (!loading && useAuthStore().isLoggedIn) {
    loading = loadCiDocuments()
  }
  return ciDocuments
}
