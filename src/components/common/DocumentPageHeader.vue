<script setup>
import PageHeader from './PageHeader.vue'
</script>

<template>
  <PageHeader v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]>
      <slot :name="name" />
    </template>
  </PageHeader>
</template>
