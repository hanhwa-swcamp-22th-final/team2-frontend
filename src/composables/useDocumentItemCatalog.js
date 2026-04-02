import { computed, ref } from 'vue'

import { fetchItems } from '@/api/master'

const itemCatalog = ref([])
const isLoaded = ref(false)
let loadingPromise = null

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

async function loadItemCatalog() {
  if (isLoaded.value) return itemCatalog.value
  if (loadingPromise) return loadingPromise

  loadingPromise = fetchItems()
    .then((items) => {
      itemCatalog.value = Array.isArray(items) ? items : []
      isLoaded.value = true
      return itemCatalog.value
    })
    .catch(() => {
      itemCatalog.value = []
      isLoaded.value = true
      return itemCatalog.value
    })
    .finally(() => {
      loadingPromise = null
    })

  return loadingPromise
}

function findMasterItem(name) {
  const normalizedName = normalizeText(name)
  if (!normalizedName) return null

  return itemCatalog.value.find((item) => (
    normalizeText(item.itemName) === normalizedName
    || normalizeText(item.itemNameKr) === normalizedName
  )) ?? null
}

function parseNumericValue(value) {
  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function enrichDocumentItems(items = []) {
  return items.map((item) => {
    const masterItem = findMasterItem(item.name)
    const quantityValue = parseNumericValue(item.quantity ?? item.qty)
    const unitWeight = Number.parseFloat(masterItem?.itemWeight)
    const rowWeight = Number.isFinite(unitWeight) ? unitWeight * quantityValue : null

    return {
      ...item,
      spec: masterItem?.itemSpec ?? '',
      hsCode: masterItem?.itemHsCode ?? '',
      unit: item.unit || masterItem?.itemUnit || '',
      unitWeight: Number.isFinite(unitWeight) ? unitWeight : null,
      rowWeight,
    }
  })
}

export function useDocumentItemCatalog() {
  return {
    itemCatalog: computed(() => itemCatalog.value),
    isItemCatalogLoaded: computed(() => isLoaded.value),
    loadItemCatalog,
    findMasterItem,
    enrichDocumentItems,
  }
}
