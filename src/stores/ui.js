import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  return {
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
  }
})
