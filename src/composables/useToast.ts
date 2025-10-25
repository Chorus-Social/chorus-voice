import { ref, readonly } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function addToast(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9)
    toasts.value.push({ ...toast, id })
    
    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }
  
  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  function success(title: string, message: string, duration?: number) {
    addToast({ type: 'success', title, message, duration })
  }
  
  function error(title: string, message: string, duration?: number) {
    addToast({ type: 'error', title, message, duration })
  }
  
  function info(title: string, message: string, duration?: number) {
    addToast({ type: 'info', title, message, duration })
  }
  
  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
    success,
    error,
    info
  }
}
