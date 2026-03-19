<script setup>
import InstructionSheetTemplate from './InstructionSheetTemplate.vue'

defineProps({
  document: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <InstructionSheetTemplate :document="document" kind="shipment" />
</template>
