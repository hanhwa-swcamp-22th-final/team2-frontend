import { ref } from 'vue'
import { createPiDocumentSeeds } from '@/stores/documentSeedRepository'

const piDocuments = ref(createPiDocumentSeeds())

export function usePiDocuments() {
  return piDocuments
}
