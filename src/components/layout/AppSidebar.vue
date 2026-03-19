<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchNavigationItems } from '@/api/navigation'
import { RouterLink, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const route = useRoute()
const navigationItems = ref([])

const sectionOrder = ['basic', 'sales', 'orders', 'status', 'activity', 'admin']

const groupedNavigationItems = computed(() => {
  const sectionMap = new Map()

  navigationItems.value.forEach((item) => {
    const sectionKey = item.section || 'service'

    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        key: sectionKey,
        label: item.sectionLabel || sectionKey,
        items: [],
      })
    }

    sectionMap.get(sectionKey).items.push(item)
  })

  return [...sectionMap.values()].sort((a, b) => {
    return sectionOrder.indexOf(a.key) - sectionOrder.indexOf(b.key)
  })
})

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }

  return route.path.startsWith(path)
}

onMounted(async () => {
  try {
    navigationItems.value = await fetchNavigationItems()
  } catch (error) {
    console.error('Failed to fetch navigation items:', error)
  }
})
</script>

<template>
  <aside
    class="fixed inset-y-3 left-3 z-30 flex w-[220px] flex-col overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm transition-transform duration-200"
    :class="uiStore.sidebarOpen ? 'translate-x-0' : '-translate-x-[188px]'"
  >
    <button
      type="button"
      class="absolute -right-3 top-1/2 z-40 hidden h-16 w-3 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-slate-300 bg-slate-200 text-slate-500 transition-colors duration-200 hover:bg-brand-100 hover:text-brand-600 lg:flex"
      :aria-label="uiStore.sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'"
      @click="uiStore.toggleSidebar"
    >
      <i
        class="fas text-[8px] transition-transform duration-200"
        :class="uiStore.sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'"
        aria-hidden="true"
      ></i>
    </button>

    <div class="flex h-[77px] flex-shrink-0 items-center border-b border-slate-200 px-4">
      <div class="flex w-full items-center gap-3">
        <RouterLink to="/" class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
            <img src="/salesboost.svg" alt="SalesBoost" class="h-9 w-9 object-contain" />
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-lg font-bold text-slate-900">SalesBoost</h1>
            <p class="mt-0.5 text-[11px] text-slate-400">해외 B2B 영업관리 시스템</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      <section
        v-for="section in groupedNavigationItems"
        :key="section.key"
        class="space-y-1.5"
      >
        <div class="px-2">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {{ section.label }}
          </p>
        </div>

        <RouterLink
          v-for="item in section.items"
          :key="item.id ?? item.path"
          :to="item.path"
          class="mx-1 flex items-center gap-3 rounded-lg px-4 py-2.5 text-[12.5px] transition"
          :class="isActive(item.path) ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
          <i
            class="fas w-4 flex-shrink-0 text-center text-[13px]"
            :class="[item.icon, isActive(item.path) ? 'text-brand' : 'text-slate-400']"
          />
          <span class="font-medium">{{ item.label }}</span>
        </RouterLink>
      </section>
    </nav>

    <div class="border-t border-slate-100 px-4 py-3">
      <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
        운영 준비 완료
      </div>
    </div>
  </aside>
</template>
