import masterData from '../../db.json'

function createBuyersByClientId(buyersData = []) {
  return buyersData.reduce((map, buyer) => {
    const clientId = String(buyer.clientId)
    const label = buyer.position ? `${buyer.name} (${buyer.position})` : buyer.name
    const buyers = map.get(clientId) ?? []
    buyers.push(label)
    map.set(clientId, buyers)
    return map
  }, new Map())
}

export function createDocumentClientRows({
  clientsData = masterData.clients ?? [],
  countriesData = masterData.countries ?? [],
  currenciesData = masterData.currencies ?? [],
  buyersData = masterData.buyers ?? [],
} = {}) {
  const countryMap = new Map(
    countriesData.map((country) => [String(country.id), country.nameKr ?? country.name ?? '-']),
  )
  const currencyMap = new Map(
    currenciesData.map((currency) => [String(currency.id), currency.code ?? '-']),
  )
  const buyersByClientId = createBuyersByClientId(buyersData)

  return clientsData.map((client) => ({
    id: String(client.id),
    code: client.code ?? '-',
    name: client.name ?? '-',
    country: countryMap.get(String(client.countryId)) ?? '-',
    city: client.city ?? '-',
    currency: currencyMap.get(String(client.currencyId)) ?? '-',
    manager: client.manager ?? '-',
    tel: client.tel ?? '-',
    email: client.email ?? '-',
    address: client.address ?? '-',
    status: client.status ?? '-',
    buyers: buyersByClientId.get(String(client.id)) ?? [],
  }))
}
