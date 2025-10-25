<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">Keypair Manager</h1>
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

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- Add New Keypair -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Add New Keypair</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Generate New -->
              <button
                @click="showGenerateModal = true"
                class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-chorus-500 hover:bg-chorus-50 transition-colors"
              >
                <div class="text-center">
                  <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">Generate New Keypair</h3>
                  <p class="mt-1 text-sm text-gray-500">Create a new anonymous identity</p>
                </div>
              </button>

              <!-- Import Existing -->
              <button
                @click="showImportModal = true"
                class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-chorus-500 hover:bg-chorus-50 transition-colors"
              >
                <div class="text-center">
                  <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">Import Keypair</h3>
                  <p class="mt-1 text-sm text-gray-500">Import from file or paste data</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Stored Keypairs -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-medium text-gray-900">Stored Keypairs</h2>
              
              <!-- Selection Controls -->
              <div class="flex items-center space-x-3">
                <!-- Select All Button -->
                <button
                  v-if="storedKeys.length > 0"
                  @click="toggleSelectAll"
                  class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  {{ isAllSelected ? 'Deselect All' : 'Select All' }}
                </button>
                
                <!-- Bulk Actions -->
                <div v-if="selectedKeys.length > 0" class="flex items-center space-x-3">
                  <span class="text-sm text-gray-600">
                    {{ selectedKeys.length }} selected
                  </span>
                  <button
                    @click="bulkDelete"
                    class="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md"
                  >
                    Delete Selected
                  </button>
                  <button
                    @click="clearSelection"
                    class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="isLoading" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-chorus-600 mx-auto"></div>
              <p class="mt-2 text-sm text-gray-600">Loading keypairs...</p>
            </div>

            <div v-else-if="storedKeys.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No keypairs stored</h3>
              <p class="mt-1 text-sm text-gray-500">Generate or import a keypair to get started</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="key in storedKeys"
                :key="key.keyId"
                @click="toggleKeySelection(key.keyId)"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                :class="{ 
                  'ring-2 ring-chorus-500 bg-chorus-50': key.isDefault,
                  'ring-2 ring-blue-500 bg-blue-50': selectedKeys.includes(key.keyId)
                }"
              >
                <div class="flex items-center space-x-3">
                  <!-- Checkbox for multi-select -->
                  <input
                    type="checkbox"
                    :checked="selectedKeys.includes(key.keyId)"
                    @change="toggleKeySelection(key.keyId)"
                    @click.stop
                    class="h-5 w-5 text-chorus-600 focus:ring-chorus-500 border-gray-300 rounded cursor-pointer"
                  />
                  <div class="flex-shrink-0">
                    <div 
                      class="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      :style="{ backgroundColor: key.isDefault ? '#0ea5e9' : '#6b7280' }"
                    >
                      {{ key.displayName?.charAt(0).toUpperCase() || 'K' }}
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <h3 class="text-sm font-medium text-gray-900 truncate">
                        {{ key.displayName || `Key ${key.keyId.slice(-6)}` }}
                      </h3>
                      <span v-if="key.isDefault" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-chorus-100 text-chorus-800">
                        Default
                      </span>
                    </div>
                    <p class="text-sm text-gray-500">
                      Created {{ formatDate(key.createdAt) }}
                    </p>
                    <p v-if="key.userId" class="text-xs text-gray-400">
                      User ID: {{ key.userId.slice(0, 8) }}...
                    </p>
                  </div>
                </div>
                
                <div class="flex items-center space-x-2" @click.stop>
                  <button
                    @click="editKeyName(key)"
                    class="text-gray-400 hover:text-gray-600"
                    title="Edit name"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    v-if="!key.isDefault"
                    @click="setAsDefault(key.keyId)"
                    class="text-gray-400 hover:text-chorus-600"
                    title="Set as default"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  
                  <button
                    @click="useKeypair(key)"
                    class="text-chorus-600 hover:text-chorus-700 font-medium"
                  >
                    Use
                  </button>
                  
                  <button
                    @click="deleteKeypair(key.keyId)"
                    class="text-red-400 hover:text-red-600"
                    title="Delete keypair"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate Modal -->
    <div v-if="showGenerateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Generate New Keypair</h3>
          
          <div class="mb-4">
            <label for="keyName" class="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              id="keyName"
              v-model="newKeyName"
              type="text"
              placeholder="My Keypair"
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-chorus-500 focus:border-chorus-500"
            />
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              @click="showGenerateModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              @click="generateKeypair"
              :disabled="isGenerating"
              class="px-4 py-2 text-sm font-medium text-white bg-chorus-600 hover:bg-chorus-700 rounded-md disabled:opacity-50"
            >
              {{ isGenerating ? 'Generating...' : 'Generate' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Name Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Keypair Name</h3>
          
          <div class="mb-4">
            <label for="editKeyName" class="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              id="editKeyName"
              v-model="editingKeyName"
              type="text"
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-chorus-500 focus:border-chorus-500"
            />
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              @click="showEditModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              @click="saveKeyName"
              :disabled="isSaving"
              class="px-4 py-2 text-sm font-medium text-white bg-chorus-600 hover:bg-chorus-700 rounded-md disabled:opacity-50"
            >
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { KeyStore } from '@/services/keystore'
import type { StoredKey } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()
const keyStore = new KeyStore()

const storedKeys = ref<StoredKey[]>([])
const isLoading = ref(false)
const showGenerateModal = ref(false)
const showImportModal = ref(false)
const showEditModal = ref(false)
const newKeyName = ref('')
const editingKeyName = ref('')
const editingKeyId = ref('')
const isGenerating = ref(false)
const isSaving = ref(false)
const selectedKeys = ref<string[]>([])

// Computed property for select all state
const isAllSelected = computed(() => {
  return storedKeys.value.length > 0 && selectedKeys.value.length === storedKeys.value.length
})

onMounted(async () => {
  await loadKeypairs()
})

async function loadKeypairs() {
  try {
    isLoading.value = true
    storedKeys.value = await keyStore.listKeys()
  } catch (error) {
    console.error('Failed to load keypairs:', error)
  } finally {
    isLoading.value = false
  }
}

async function generateKeypair() {
  try {
    isGenerating.value = true
    const name = newKeyName.value.trim() || `Key ${Date.now().toString().slice(-6)}`
    
    // Generate and store the keypair
    const { keyPair } = await keyStore.generateAndStoreKey(undefined, true, name)
    
    // Register the keypair with the server
    console.log('🔐 Registering new keypair with server...')
    await authStore.register(keyPair, name, '#0ea5e9')
    console.log('✅ Keypair registered successfully')
    
    await loadKeypairs()
    
    showGenerateModal.value = false
    newKeyName.value = ''
  } catch (error) {
    console.error('Failed to generate keypair:', error)
    // Show error to user
    alert(`Failed to generate keypair: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    isGenerating.value = false
  }
}

async function setAsDefault(keyId: string) {
  try {
    await keyStore.setDefaultKey(keyId)
    await loadKeypairs()
  } catch (error) {
    console.error('Failed to set default key:', error)
  }
}

async function useKeypair(key: StoredKey) {
  try {
    // Get the actual keypair
    const keyPair = await keyStore.getKeyPair(key.keyId)
    if (!keyPair) {
      throw new Error('Keypair not found')
    }
    
    // Try to login with this keypair
    try {
      await authStore.login(keyPair)
      // Redirect to feed on successful login
      router.push('/feed')
    } catch (loginError: any) {
      // Check if it's a 404 "User not found" error
      if (loginError.response?.status === 404 && 
          loginError.response?.data?.detail === 'User not found') {
        // Keypair exists locally but isn't registered with server
        console.log('Keypair not registered with server, registering now...')
        
        // Register the keypair with the server
        await authStore.register(keyPair, key.displayName || `Key ${key.keyId.slice(-6)}`, '#0ea5e9')
        console.log('✅ Keypair registered successfully')
        
        // Now try to login again
        await authStore.login(keyPair)
        router.push('/feed')
      } else {
        // Some other error occurred
        throw loginError
      }
    }
  } catch (error) {
    console.error('Failed to use keypair:', error)
    // Show error to user
    alert(`Failed to use keypair: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function deleteKeypair(keyId: string) {
  if (!confirm('Are you sure you want to delete this keypair? This action cannot be undone.')) {
    return
  }
  
  try {
    await keyStore.deleteKey(keyId)
    await loadKeypairs()
  } catch (error) {
    console.error('Failed to delete keypair:', error)
  }
}

function editKeyName(key: StoredKey) {
  editingKeyId.value = key.keyId
  editingKeyName.value = key.displayName || ''
  showEditModal.value = true
}

async function saveKeyName() {
  try {
    isSaving.value = true
    await keyStore.updateKeyDisplayName(editingKeyId.value, editingKeyName.value)
    await loadKeypairs()
    
    showEditModal.value = false
    editingKeyName.value = ''
    editingKeyId.value = ''
  } catch (error) {
    console.error('Failed to update key name:', error)
  } finally {
    isSaving.value = false
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}

function goBack() {
  router.push('/auth')
}

// Multi-select functions
function toggleKeySelection(keyId: string) {
  const index = selectedKeys.value.indexOf(keyId)
  if (index > -1) {
    selectedKeys.value.splice(index, 1)
  } else {
    selectedKeys.value.push(keyId)
  }
}

function clearSelection() {
  selectedKeys.value = []
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    // Deselect all
    selectedKeys.value = []
  } else {
    // Select all
    selectedKeys.value = storedKeys.value.map(key => key.keyId)
  }
}

async function bulkDelete() {
  if (selectedKeys.value.length === 0) return
  
  const count = selectedKeys.value.length
  const message = `Are you sure you want to delete ${count} keypair${count > 1 ? 's' : ''}? This action cannot be undone.`
  
  if (!confirm(message)) {
    return
  }
  
  try {
    // Delete all selected keypairs
    for (const keyId of selectedKeys.value) {
      await keyStore.deleteKey(keyId)
    }
    
    // Clear selection and reload
    selectedKeys.value = []
    await loadKeypairs()
  } catch (error) {
    console.error('Failed to delete keypairs:', error)
  }
}
</script>
