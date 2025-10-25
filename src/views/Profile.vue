<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading/Auth Check -->
    <div v-if="!authStore.isAuthenticated" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-chorus-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-600">Checking authentication...</p>
      </div>
    </div>
    
    <!-- Profile Content (only show if authenticated) -->
    <div v-else>
      <!-- Header -->
      <div class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="goBack"
              class="text-gray-600 hover:text-gray-900"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- Profile Card -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-8">
            <!-- Avatar and Basic Info -->
            <div class="flex items-center space-x-6">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div 
                  class="h-24 w-24 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  :style="{ backgroundColor: user?.accent_color || '#0ea5e9' }"
                >
                  {{ avatarInitial }}
                </div>
              </div>
              
              <!-- User Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <h2 v-if="!isEditingName" class="text-2xl font-bold text-gray-900">
                    {{ displayName }}
                  </h2>
                  <div v-else class="flex items-center space-x-2">
                    <input
                      v-model="editingDisplayName"
                      type="text"
                      class="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-chorus-600 focus:outline-none"
                      @keyup.enter="saveDisplayName"
                      @keyup.escape="cancelEditName"
                      ref="nameInput"
                    />
                    <button
                      @click="saveDisplayName"
                      class="text-green-600 hover:text-green-700"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      @click="cancelEditName"
                      class="text-red-600 hover:text-red-700"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <!-- Privacy Warning when editing -->
                  <div v-if="isEditingName" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div class="ml-2">
                        <p class="text-xs font-medium text-red-800">
                          Privacy Warning: Never use your real name or any identifying information
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    v-if="!isEditingName"
                    @click="startEditName"
                    class="text-gray-400 hover:text-gray-600"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  User ID: {{ user?.user_id }}
                </p>
                <p class="text-sm text-gray-500 mt-2">
                  Member since {{ formatDate(user?.created) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Details -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-6">
            <h3 class="text-lg font-medium text-gray-900 mb-6">Profile Details</h3>
            
            <dl class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Display Name</dt>
                <dd class="mt-1 text-sm text-gray-900 flex items-center space-x-2">
                  <span v-if="!isEditingName">{{ displayName || 'Not set' }}</span>
                  <div v-else class="flex items-center space-x-2">
                    <input
                      v-model="editingDisplayName"
                      type="text"
                      class="text-sm text-gray-900 bg-transparent border-b border-chorus-600 focus:outline-none"
                      @keyup.enter="saveDisplayName"
                      @keyup.escape="cancelEditName"
                    />
                    <button
                      @click="saveDisplayName"
                      class="text-green-600 hover:text-green-700"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      @click="cancelEditName"
                      class="text-red-600 hover:text-red-700"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <!-- Privacy Warning when editing (mobile view) -->
                  <div v-if="isEditingName" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-3 w-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div class="ml-1">
                        <p class="text-red-800 font-medium">
                          Privacy: Never use your real name or identifying information
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    v-if="!isEditingName"
                    @click="startEditName"
                    class="text-gray-400 hover:text-gray-600"
                  >
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">User ID</dt>
                <dd class="mt-1 text-sm text-gray-900 font-mono break-all">
                  {{ user?.user_id }}
                </dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">Public Key</dt>
                <dd class="mt-1 text-sm text-gray-900 font-mono break-all">
                  {{ user?.pubkey }}
                </dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">Account Type</dt>
                <dd class="mt-1">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="tierClass"
                  >
                    {{ tierLabel }}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">Accent Color</dt>
                <dd class="mt-1 flex items-center space-x-2">
                  <div 
                    class="w-6 h-6 rounded-full border border-gray-300"
                    :style="{ backgroundColor: user?.accent_color || '#0ea5e9' }"
                  ></div>
                  <div class="flex items-center space-x-2">
                    <span v-if="!isEditingColor" class="text-sm text-gray-900 font-mono">
                      {{ user?.accent_color || '#0ea5e9' }}
                    </span>
                    <div v-else class="flex items-center space-x-2">
                      <input
                        v-model="editingAccentColor"
                        type="color"
                        class="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        @change="saveAccentColor"
                      />
                      <button
                        @click="saveAccentColor"
                        class="text-green-600 hover:text-green-700"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        @click="cancelEditColor"
                        class="text-red-600 hover:text-red-700"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <button
                      v-if="!isEditingColor"
                      @click="startEditColor"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </dd>
              </div>
              
              <div>
                <dt class="text-sm font-medium text-gray-500">Account Created</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ formatDate(user?.created) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Keypair Information -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-6">
            <h3 class="text-lg font-medium text-gray-900 mb-6">Keypair Information</h3>
            
            <!-- Security Notice -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-yellow-800">
                    Security Notice
                  </h3>
                  <p class="mt-1 text-sm text-yellow-700">
                    This is your own profile. Private key information is only visible to you for security reasons.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-2">
                  Public Key (Base64)
                </label>
                <div class="bg-gray-50 rounded-lg p-3">
                  <code class="text-xs font-mono break-all text-gray-900">
                    {{ user?.pubkey }}
                  </code>
                  <button
                    @click="copyToClipboard(user?.pubkey || '')"
                    class="ml-2 text-xs text-chorus-600 hover:text-chorus-500"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-2">
                  Public Key Hash
                </label>
                <div class="bg-gray-50 rounded-lg p-3">
                  <code class="text-xs font-mono break-all text-gray-900">
                    {{ user?.pubkey_hash }}
                  </code>
                  <button
                    @click="copyToClipboard(user?.pubkey_hash || '')"
                    class="ml-2 text-xs text-chorus-600 hover:text-chorus-500"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <!-- Private Key Information (Only for profile owner) -->
              <div v-if="isProfileOwner">
                <label class="block text-sm font-medium text-gray-500 mb-2">
                  Private Key Status
                </label>
                <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div class="flex items-center">
                    <svg class="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span class="text-sm text-green-800">
                      Private key is securely stored locally and never transmitted to the server.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Helpful Message for Users -->
        <div v-if="!hasPendingChanges && isProfileOwner" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">
                Profile Information
              </h3>
              <p class="mt-1 text-sm text-blue-700">
                Click on your display name or accent color to edit them. Changes are saved locally first, then you can sync them to the server.
              </p>
            </div>
          </div>
        </div>

        <!-- Pending Changes Notice with Save Button -->
        <div v-if="hasPendingChanges" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">
                  You have unsaved changes
                </h3>
                <p class="mt-1 text-sm text-yellow-700">
                  Your changes have been saved locally. Click "Save Changes" to sync them with the server.
                </p>
              </div>
            </div>
            <!-- Save Button - Prominently placed -->
            <button
              @click="saveChangesToServer"
              :disabled="isSaving"
              class="ml-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <span v-if="isSaving" class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </span>
              <span v-else class="flex items-center">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Save Changes
              </span>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="isProfileOwner" class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-6">
            <h3 class="text-lg font-medium text-gray-900 mb-6">Actions</h3>
            
            <div class="space-y-4">
              <button
                @click="downloadKeypair"
                class="w-full sm:w-auto bg-chorus-600 text-white px-4 py-2 rounded-md hover:bg-chorus-700 transition-colors"
              >
                Download Keypair Backup
              </button>
              
              <button
                @click="logout"
                class="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors ml-0 sm:ml-4"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div> <!-- End of authenticated content wrapper -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

// Check authentication on mount
onMounted(() => {
  console.log('🔒 Profile component mounted, checking authentication...')
  console.log('👤 User:', authStore.user)
  console.log('🔑 Is authenticated:', authStore.isAuthenticated)
  
  if (!authStore.isAuthenticated) {
    console.log('❌ User not authenticated, redirecting to auth page')
    router.push('/auth')
    return
  }
  
  console.log('✅ User authenticated, showing profile')
})

// Display name editing
const isEditingName = ref(false)
const editingDisplayName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

// Accent color editing
const isEditingColor = ref(false)
const editingAccentColor = ref('#0ea5e9')

// Pending changes tracking
const hasPendingChanges = ref(false)
const isSaving = ref(false)

// Profile owner detection (for now, always true since we don't have user profiles yet)
// In the future, this would check if the current user is viewing their own profile
const isProfileOwner = computed(() => {
  // For now, always true since this is the user's own profile
  // In the future, this would compare current user ID with profile user ID
  return true
})

const displayName = computed(() => {
  const name = user.value?.display_name || 'Anonymous User'
  // Sanitize display name to prevent XSS
  return name.replace(/[<>]/g, '')
})

const avatarInitial = computed(() => {
  const name = displayName.value
  if (name === 'Anonymous User') {
    return 'A'
  }
  return name.charAt(0).toUpperCase()
})

const tierLabel = computed(() => {
  const tier = user.value?.tier
  switch (tier) {
    case 'new':
      return 'New User'
    case 'veteran':
      return 'Veteran'
    default:
      return 'Unknown'
  }
})

const tierClass = computed(() => {
  const tier = user.value?.tier
  switch (tier) {
    case 'new':
      return 'bg-green-100 text-green-800'
    case 'veteran':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

function formatDate(date: any): string {
  if (!date) return 'Unknown'
  
  if (typeof date === 'boolean') {
    return date ? 'Recently' : 'Unknown'
  }
  
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString()
  }
  
  return 'Unknown'
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // You could add a toast notification here
    console.log('Copied to clipboard:', text)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

function downloadKeypair() {
  // Redirect to keypair download page
  router.push('/download-keypair')
}

function logout() {
  authStore.logout()
  router.push('/auth')
}

function goBack() {
  router.back()
}

// Display name editing functions
async function startEditName() {
  isEditingName.value = true
  editingDisplayName.value = displayName.value
  await nextTick()
  nameInput.value?.focus()
}

function cancelEditName() {
  isEditingName.value = false
  editingDisplayName.value = ''
}

async function saveDisplayName() {
  const newName = editingDisplayName.value.trim()
  if (!newName) {
    cancelEditName()
    return
  }
  
  try {
    // Save locally first
    if (user.value) {
      user.value.display_name = newName
      authStore.saveAuthState()
      hasPendingChanges.value = true
    }
    
    isEditingName.value = false
    editingDisplayName.value = ''
    
    console.log('Display name updated locally to:', newName)
  } catch (error) {
    console.error('Failed to update display name:', error)
    // You could add a toast notification here
  }
}

// Accent color editing functions
function startEditColor() {
  isEditingColor.value = true
  editingAccentColor.value = user.value?.accent_color || '#0ea5e9'
}

function cancelEditColor() {
  isEditingColor.value = false
  editingAccentColor.value = '#0ea5e9'
}

async function saveAccentColor() {
  const newColor = editingAccentColor.value
  if (!newColor) {
    cancelEditColor()
    return
  }
  
  try {
    // Save locally first
    if (user.value) {
      user.value.accent_color = newColor
      authStore.saveAuthState()
      hasPendingChanges.value = true
    }
    
    isEditingColor.value = false
    
    console.log('Accent color updated locally to:', newColor)
  } catch (error) {
    console.error('Failed to update accent color:', error)
    // You could add a toast notification here
  }
}

// Save changes to server
async function saveChangesToServer() {
  if (!user.value) {
    console.error('No user data available')
    return
  }
  
  try {
    console.log('💾 Starting to save changes to server...')
    console.log('👤 Current user data:', {
      display_name: user.value.display_name,
      accent_color: user.value.accent_color
    })
    isSaving.value = true
    
    // Prepare updates object with current user data
    const updates: { display_name?: string; accent_color?: string } = {}
    
    if (user.value.display_name !== undefined) {
      updates.display_name = user.value.display_name
    }
    if (user.value.accent_color !== undefined) {
      updates.accent_color = user.value.accent_color
    }
    
    console.log('📤 Sending profile updates to server:', updates)
    
    // Send updates to server
    const result = await authStore.updateProfile(updates)
    console.log('📥 Server response:', result)
    
    // Clear pending changes flag
    hasPendingChanges.value = false
    
    console.log('✅ Changes saved to server successfully')
    alert('✅ Profile updated successfully!')
  } catch (error) {
    console.error('❌ Failed to save changes to server:', error)
    alert(`❌ Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    isSaving.value = false
  }
}
</script>
