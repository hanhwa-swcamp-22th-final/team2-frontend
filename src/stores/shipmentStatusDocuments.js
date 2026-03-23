import { ref } from 'vue'
import { createShipmentStatusSeeds } from '@/stores/documentSeedRepository'

const shipmentStatusDocuments = ref(createShipmentStatusSeeds())

export function useShipmentStatusDocuments() {
  return shipmentStatusDocuments
}
