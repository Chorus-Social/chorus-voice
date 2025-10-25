<!--
  Chorus Voice - Main Application Component
  
  This is the root component that provides the main application layout
  including the navigation header and main content area.
  
  Features:
  - Conditional header display based on authentication state
  - Responsive navigation with user avatar
  - Router view for page content
  - User profile management integration
  
  Security:
  - Header only shows on authenticated pages
  - User data is managed through Pinia stores
  - No sensitive data exposed in template
-->
<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Header with Avatar (only show on authenticated pages) -->
    <header v-if="showHeader" class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo/Brand -->
          <div class="flex items-center">
            <router-link to="/feed" class="flex items-center space-x-2">
              <div class="h-8 w-8 bg-chorus-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">C</span>
              </div>
              <span class="text-xl font-bold text-gray-900">Chorus</span>
            </router-link>
          </div>
          
          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8">
            <router-link 
              to="/feed" 
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'text-chorus-600 bg-chorus-50': $route.name === 'feed' }"
            >
              Feed
            </router-link>
            <router-link 
              to="/create" 
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              :class="{ 'text-chorus-600 bg-chorus-50': $route.name === 'create' }"
            >
              Create Post
            </router-link>
          </nav>
          
          <!-- Avatar/Profile -->
          <div class="flex items-center space-x-4">
            <button
              @click="goToProfile"
              class="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <div 
                class="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                :style="{ backgroundColor: user?.accent_color || '#0ea5e9' }"
              >
                {{ avatarInitial }}
              </div>
              <span class="hidden sm:block text-sm font-medium">
                {{ displayName }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <main :class="{ 'pt-0': !showHeader }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * App.vue - Main Application Logic
 * 
 * This script handles the main application state and navigation logic.
 * It manages the conditional header display and user authentication state.
 */

import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

// Initialize stores and router
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const configStore = useConfigStore()

// Load configuration on application startup
onMounted(() => {
  configStore.loadConfig()
})

// Reactive user data from auth store
const user = computed(() => authStore.user)

/**
 * Determines whether to show the navigation header
 * Only displays on authenticated pages to maintain clean UI
 */
const showHeader = computed(() => {
  const authenticatedPages = ['feed', 'create', 'profile']
  return authenticatedPages.includes(route.name as string)
})

/**
 * Gets the user's display name with fallback to anonymous
 * Provides consistent user identification across the app
 */
const displayName = computed(() => {
  return user.value?.display_name || 'Anonymous User'
})

/**
 * Generates avatar initial from display name
 * Creates a consistent visual identifier for users
 */
const avatarInitial = computed(() => {
  const name = displayName.value
  if (name === 'Anonymous User') {
    return 'A'
  }
  return name.charAt(0).toUpperCase()
})

/**
 * Navigates to the user profile page
 * Used by the header avatar click handler
 */
function goToProfile() {
  router.push('/profile')
}
</script>
