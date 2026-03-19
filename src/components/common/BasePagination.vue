<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  maxVisiblePages: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['update:currentPage'])

// ── computed ───────────────────────────────────────────────
const safeTotalPages = computed(() => Math.max(1, props.totalPages))

const isFirst = computed(() => props.currentPage === 1)
const isLast  = computed(() => props.currentPage === safeTotalPages.value)

const visiblePages = computed(() => {
  const total   = safeTotalPages.value
  const current = props.currentPage
  const max     = props.maxVisiblePages

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const half  = Math.floor((max - 1) / 2)
  let start   = current - half
  let end     = start + max - 1

  if (start < 1) {
    start = 1
    end   = max
  }

  if (end > total) {
    end   = total
    start = total - max + 1
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const showStartEllipsis = computed(() => visiblePages.value[0] > 1)
const showEndEllipsis   = computed(() => visiblePages.value[visiblePages.value.length - 1] < safeTotalPages.value)

// ── methods ────────────────────────────────────────────────
function goTo(page) {
  if (page < 1 || page > safeTotalPages.value || page === props.currentPage) return
  emit('update:currentPage', page)
}
</script>

<template>
  <div class="flex items-center justify-center gap-1">

    <!-- 맨 처음 -->
    <button
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-30"
      :class="isFirst ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'"
      :disabled="isFirst"
      aria-label="첫 페이지"
      @click="goTo(1)"
    >
      «
    </button>

    <!-- 이전 -->
    <button
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-30"
      :class="isFirst ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'"
      :disabled="isFirst"
      aria-label="이전 페이지"
      @click="goTo(currentPage - 1)"
    >
      ‹
    </button>

    <!-- 앞 말줄임 -->
    <template v-if="showStartEllipsis">
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-500 transition hover:bg-slate-100"
        @click="goTo(1)"
      >
        1
      </button>
      <span class="flex h-8 w-6 items-center justify-center text-xs text-slate-400">···</span>
    </template>

    <!-- 페이지 번호 -->
    <button
      v-for="page in visiblePages"
      :key="page"
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition"
      :class="page === currentPage
        ? 'bg-brand-500 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'"
      :aria-current="page === currentPage ? 'page' : undefined"
      @click="goTo(page)"
    >
      {{ page }}
    </button>

    <!-- 뒤 말줄임 -->
    <template v-if="showEndEllipsis">
      <span class="flex h-8 w-6 items-center justify-center text-xs text-slate-400">···</span>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-500 transition hover:bg-slate-100"
        @click="goTo(safeTotalPages)"
      >
        {{ safeTotalPages }}
      </button>
    </template>

    <!-- 다음 -->
    <button
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-30"
      :class="isLast ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'"
      :disabled="isLast"
      aria-label="다음 페이지"
      @click="goTo(currentPage + 1)"
    >
      ›
    </button>

    <!-- 맨 마지막 -->
    <button
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-30"
      :class="isLast ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'"
      :disabled="isLast"
      aria-label="마지막 페이지"
      @click="goTo(safeTotalPages)"
    >
      »
    </button>

  </div>
</template>
