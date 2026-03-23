import { ref } from 'vue'
import { createPlDocumentSeeds } from '@/stores/documentSeedRepository'

const plDocuments = ref(createPlDocumentSeeds())

export function usePlDocuments() {
  return plDocuments
}
