import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for managing user accent colors throughout the application
 * Provides reactive accent color values and utility functions
 */
export function useAccentColor() {
  const authStore = useAuthStore()
  
  // Get the user's accent color with fallback
  const accentColor = computed(() => authStore.user?.accent_color || '#0ea5e9')
  
  // Get a darker version for hover states
  const accentColorHover = computed(() => {
    const color = accentColor.value
    return adjustColor(color, -20)
  })
  
  // Get a lighter version for backgrounds
  const accentColorLight = computed(() => {
    const color = accentColor.value
    return adjustColor(color, 40)
  })
  
  // Get a very light version for subtle backgrounds
  const accentColorSubtle = computed(() => {
    const color = accentColor.value
    return adjustColor(color, 80)
  })
  
  /**
   * Adjust color brightness by a given amount
   * @param color - Hex color string
   * @param amount - Amount to adjust (-255 to 255)
   * @returns Adjusted hex color string
   */
  function adjustColor(color: string, amount: number): string {
    // Remove # if present
    const hex = color.replace('#', '')
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Adjust brightness
    const newR = Math.max(0, Math.min(255, r + amount))
    const newG = Math.max(0, Math.min(255, g + amount))
    const newB = Math.max(0, Math.min(255, b + amount))
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  }
  
  /**
   * Get CSS custom properties for accent colors
   * Can be used in :style bindings
   */
  const cssProperties = computed(() => ({
    '--accent-color': accentColor.value,
    '--accent-color-hover': accentColorHover.value,
    '--accent-color-light': accentColorLight.value,
    '--accent-color-subtle': accentColorSubtle.value
  }))
  
  return {
    accentColor,
    accentColorHover,
    accentColorLight,
    accentColorSubtle,
    adjustColor,
    cssProperties
  }
}
