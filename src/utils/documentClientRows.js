function createBuyersByClientId(buyersData = []) {
  return buyersData.reduce((map, buyer) => {
    const clientId = String(buyer.clientId)
    const label = buyer.buyerPosition ? `${buyer.buyerName} (${buyer.buyerPosition})` : buyer.buyerName
    const buyers = map.get(clientId) ?? []
    buyers.push(label)
    map.set(clientId, buyers)
    return map
  }, new Map())
}

export function createDocumentClientRows({
  clientsData = [],
  countriesData = [],
  currenciesData = [],
  buyersData = [],
} = {}) {
  const countryMap = new Map(
    countriesData.map((country) => [String(country.countryId), country.countryNameKr ?? country.countryName ?? '-']),
  )
  const currencyMap = new Map(
    currenciesData.map((currency) => [String(currency.currencyId), currency.currencyCode ?? '-']),
  )
  const buyersByClientId = createBuyersByClientId(buyersData)

  return clientsData.map((client) => ({
    id: String(client.clientId),
    code: client.clientCode ?? '-',
    name: client.clientName ?? '-',
    country: countryMap.get(String(client.countryId)) ?? client.countryName ?? '-',
    city: client.clientCity ?? '-',
    currency: currencyMap.get(String(client.currencyId)) ?? '-',
    manager: client.clientManager ?? '-',
    tel: client.clientTel ?? '-',
    email: client.clientEmail ?? '-',
    address: client.clientAddress ?? '-',
    status: client.clientStatus ?? '-',
    buyers: buyersByClientId.get(String(client.clientId)) ?? [],
  }))
}
