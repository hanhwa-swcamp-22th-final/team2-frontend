import { ref } from 'vue'
import { createCiDocumentSeeds } from '@/stores/documentSeedRepository'

const ciDocuments = ref(createCiDocumentSeeds())

export function useCiDocuments() {
  return ciDocuments
}
