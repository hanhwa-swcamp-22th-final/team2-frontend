<script setup>
defineProps({
  buyer: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-4">
    <p class="text-sm font-semibold text-ink">{{ buyer.name }}</p>
    <p class="mt-0.5 text-xs text-slate-500">{{ buyer.position }}</p>
    <div class="mt-3 space-y-1.5">
      <div class="flex items-center gap-2 text-xs text-slate-600">
        <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
          <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
        </svg>
        <span>{{ buyer.email || '-' }}</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-600">
        <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clip-rule="evenodd" />
        </svg>
        <span>{{ buyer.phone || '-' }}</span>
      </div>
    </div>
  </div>
</template>
