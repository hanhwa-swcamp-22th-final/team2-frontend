import { ref } from 'vue'
import { createPoDocumentSeeds } from '@/stores/documentSeedRepository'

const poDocuments = ref(createPoDocumentSeeds())

export function usePoDocuments() {
  return poDocuments
}
