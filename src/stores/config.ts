import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'

export const useConfigStore = defineStore('config', () => {
  const stageURL = ref<string>('')
  const isConnected = ref<boolean>(false)
  const connectionError = ref<string>('')
  const isLoading = ref<boolean>(false)
  
  const isValidURL = computed(() => {
    if (!stageURL.value) return false
    try {
      const url = new URL(stageURL.value.startsWith('http') ? stageURL.value : `http://${stageURL.value}`)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  })
  
  const normalizedURL = computed(() => {
    if (!stageURL.value) return ''
    try {
      const url = new URL(stageURL.value.startsWith('http') ? stageURL.value : `http://${stageURL.value}`)
      return url.toString().replace(/\/$/, '')
    } catch {
      return stageURL.value
    }
  })
  
  /**
   * Set the Stage URL
   */
  function setStageURL(url: string) {
    stageURL.value = url
    connectionError.value = ''
  }
  
  /**
   * Test connection to the Stage server
   */
  async function testConnection(): Promise<boolean> {
    if (!isValidURL.value) {
      connectionError.value = 'Invalid URL format'
      return false
    }
    
    isLoading.value = true
    connectionError.value = ''
    
    try {
      const success = await apiService.testConnection(normalizedURL.value)
      isConnected.value = success
      
      if (success) {
        // Set the base URL for the API service
        apiService.setBaseURL(normalizedURL.value)
        // Store the URL in localStorage for persistence
        localStorage.setItem('stage_url', normalizedURL.value)
      } else {
        connectionError.value = 'Failed to connect to Stage server'
      }
      
      return success
    } catch (error) {
      connectionError.value = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      isConnected.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Load saved configuration
   */
  function loadConfig() {
    console.log('🔧 Loading config from localStorage...')
    const savedURL = localStorage.getItem('stage_url')
    console.log('💾 Saved URL from localStorage:', savedURL)
    
    if (savedURL) {
      console.log('✅ Found saved URL, setting and testing connection')
      setStageURL(savedURL)
      // Auto-test connection if we have a saved URL
      testConnection()
    } else {
      // Set default development server URL
      const defaultURL = 'http://localhost:8001'
      console.log('🔧 No saved URL, setting default:', defaultURL)
      setStageURL(defaultURL)
      
      // Don't auto-test connection for default URL to avoid errors
    }
  }
  
  /**
   * Clear configuration
   */
  function clearConfig() {
    stageURL.value = ''
    isConnected.value = false
    connectionError.value = ''
    localStorage.removeItem('stage_url')
  }
  
  return {
    // State
    stageURL,
    isConnected,
    connectionError,
    isLoading,
    
    // Computed
    isValidURL,
    normalizedURL,
    
    // Actions
    setStageURL,
    testConnection,
    loadConfig,
    clearConfig
  }
})
