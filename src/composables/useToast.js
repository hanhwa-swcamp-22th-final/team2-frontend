import { readonly, ref } from 'vue'

const toasts = ref([])

function showToast({ type = 'info', title = '', message = '', duration = 2500 }) {
  const id = Date.now() + Math.random()
  const toast = { id, type, title, message }

  toasts.value.push(toast)

  if (duration > 0) {
    window.setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

function removeToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    showToast,
    removeToast,
    success(message, title = '완료') {
      return showToast({ type: 'success', title, message })
    },
    error(message, title = '오류') {
      return showToast({ type: 'error', title, message, duration: 3500 })
    },
    info(message, title = '알림') {
      return showToast({ type: 'info', title, message })
    },
    warning(message, title = '안내') {
      return showToast({ type: 'warning', title, message, duration: 3000 })
    },
  }
}
