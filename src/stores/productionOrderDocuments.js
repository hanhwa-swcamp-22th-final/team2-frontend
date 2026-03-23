import { ref } from 'vue'
import { createProductionOrderSeeds } from '@/stores/documentSeedRepository'

const productionOrderDocuments = ref(createProductionOrderSeeds())

export function useProductionOrderDocuments() {
  return productionOrderDocuments
}
