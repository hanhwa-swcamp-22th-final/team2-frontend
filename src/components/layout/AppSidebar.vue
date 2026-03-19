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
  <!-- 모바일: 오버레이 방식 (기존 유지) -->
  <aside
    v-if="!uiStore.isDesktop"
    class="fixed inset-y-3 left-3 z-30 flex w-[220px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-transform duration-200"
    :class="uiStore.sidebarOpen ? 'translate-x-0' : '-translate-x-[260px]'"
  >
    <div class="flex h-[77px] flex-shrink-0 items-center border-b border-slate-200 px-4">
      <RouterLink to="/" class="flex items-center gap-3" @click="uiStore.closeSidebar">
        <div class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
          <img src="/salesboost.svg" alt="SalesBoost" class="h-9 w-9 object-contain" />
        </div>
        <div class="min-w-0">
          <h1 class="truncate text-lg font-bold text-slate-900">SalesBoost</h1>
          <p class="mt-0.5 text-[11px] text-slate-400">해외 B2B 영업관리 시스템</p>
        </div>
      </RouterLink>
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
          @click="uiStore.closeSidebar"
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

  <!-- 데스크톱: 접힘/펼침 방식 -->
  <aside
    v-else
    class="fixed inset-y-3 left-3 z-30 flex flex-col overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200"
    :class="uiStore.sidebarOpen ? 'w-[220px]' : 'w-[56px]'"
  >
    <!-- 토글 핸들 -->
    <button
      type="button"
      class="absolute -right-3 top-1/2 z-40 flex h-16 w-3 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-slate-300 bg-slate-200 text-slate-500 transition-colors duration-200 hover:bg-brand-100 hover:text-brand-600"
      :aria-label="uiStore.sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'"
      @click="uiStore.toggleSidebar"
    >
      <i
        class="fas text-[8px] transition-transform duration-200"
        :class="uiStore.sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'"
        aria-hidden="true"
      ></i>
    </button>

    <!-- 로고 영역 -->
    <div class="flex h-[77px] flex-shrink-0 items-center border-b border-slate-200 px-4">
      <RouterLink to="/" class="flex items-center gap-3">
        <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
          <img src="/salesboost.svg" alt="SalesBoost" class="h-9 w-9 object-contain" />
        </div>
        <div v-if="uiStore.sidebarOpen" class="min-w-0">
          <h1 class="truncate text-lg font-bold text-slate-900">SalesBoost</h1>
          <p class="mt-0.5 text-[11px] text-slate-400">해외 B2B 영업관리 시스템</p>
        </div>
      </RouterLink>
    </div>

    <!-- 네비게이션 -->
    <nav class="flex-1 overflow-y-auto py-4" :class="uiStore.sidebarOpen ? 'space-y-5 px-3' : 'space-y-2 px-1.5'">
      <section
        v-for="section in groupedNavigationItems"
        :key="section.key"
        :class="uiStore.sidebarOpen ? 'space-y-1.5' : 'space-y-1'"
      >
        <!-- 섹션 라벨: 펼침 시만 표시 -->
        <div v-if="uiStore.sidebarOpen" class="px-2">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {{ section.label }}
          </p>
        </div>
        <!-- 접힘 시 섹션 구분선 -->
        <div v-else class="mx-2 border-t border-slate-100" />

        <RouterLink
          v-for="item in section.items"
          :key="item.id ?? item.path"
          :to="item.path"
          :title="uiStore.sidebarOpen ? undefined : item.label"
          class="flex items-center rounded-lg transition"
          :class="[
            uiStore.sidebarOpen
              ? 'mx-1 gap-3 px-4 py-2.5 text-[12.5px]'
              : 'mx-auto h-9 w-9 justify-center',
            isActive(item.path)
              ? 'bg-slate-50 text-slate-900'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
          ]"
        >
          <i
            class="fas flex-shrink-0 text-center text-[13px]"
            :class="[item.icon, isActive(item.path) ? 'text-brand' : 'text-slate-400', uiStore.sidebarOpen ? 'w-4' : 'w-full']"
          />
          <span v-if="uiStore.sidebarOpen" class="font-medium">{{ item.label }}</span>
        </RouterLink>
      </section>
    </nav>

    <!-- 하단 상태 -->
    <div class="border-t border-slate-100 px-4 py-3">
      <div class="flex items-center gap-2 text-xs font-medium text-slate-400" :class="{ 'justify-center': !uiStore.sidebarOpen }">
        <span class="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400"></span>
        <span v-if="uiStore.sidebarOpen">운영 준비 완료</span>
      </div>
    </div>
  </aside>
</template>
