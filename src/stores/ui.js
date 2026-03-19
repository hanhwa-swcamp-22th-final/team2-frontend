import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)
  const sidebarOpen = ref(isDesktop.value)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function handleResize() {
    const wasDesktop = isDesktop.value
    isDesktop.value = window.innerWidth >= 1024

    if (!wasDesktop && isDesktop.value) {
      sidebarOpen.value = true
    } else if (wasDesktop && !isDesktop.value) {
      sidebarOpen.value = false
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }

  function dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
    }
  }

  return {
    isDesktop,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    dispose,
  }
})
