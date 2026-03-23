import { ref } from 'vue'
import { createShipmentOrderSeeds } from '@/stores/documentSeedRepository'

const shipmentOrderDocuments = ref(createShipmentOrderSeeds())

export function useShipmentOrderDocuments() {
  return shipmentOrderDocuments
}
