<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 flex items-center justify-center">
          <div class="h-12 w-12 bg-chorus-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl">C</span>
          </div>
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          Welcome to Chorus
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Create your anonymous identity or sign in
        </p>
      </div>

      <!-- Auth Options -->
      <div class="space-y-4">
        <!-- New User Registration -->
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">New to Chorus?</h3>
          <p class="text-sm text-gray-600 mb-4">
            Create a new anonymous identity. Your keys are generated locally and never leave your device.
          </p>
          
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div>
              <label for="display-name" class="block text-sm font-medium text-gray-700">
                Display Name (Optional)
              </label>
              <input
                id="display-name"
                v-model="registerForm.displayName"
                type="text"
                placeholder="Choose a display name"
                class="input-field mt-1"
              />
            </div>
            
            <div>
              <label for="accent-color" class="block text-sm font-medium text-gray-700">
                Accent Color (Optional)
              </label>
              <input
                id="accent-color"
                v-model="registerForm.accentColor"
                type="color"
                class="mt-1 h-10 w-full rounded-lg border border-gray-300"
              />
            </div>
            
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
            >
              <span v-if="isLoading" class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Identity...
              </span>
              <span v-else>Create New Identity</span>
            </button>
            
            <!-- Test PoW Button -->
            <button
              @click="testProofOfWork"
              :disabled="isLoading"
              class="w-full mt-2 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Proof of Work
            </button>
          </form>
        </div>

        <!-- Existing User Login -->
        <div class="card">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Already have an identity?</h3>
          <p class="text-sm text-gray-600 mb-4">
            Import your keypair to sign in with your existing account.
          </p>
          
          <!-- Login Method Tabs -->
          <div class="mb-4">
            <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                @click="loginMethod = 'file'"
                :class="[
                  'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors',
                  loginMethod === 'file'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                📁 Upload File
              </button>
              <button
                @click="loginMethod = 'paste'"
                :class="[
                  'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors',
                  loginMethod === 'paste'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                📋 Paste JSON
              </button>
              <button
                @click="loginMethod = 'fields'"
                :class="[
                  'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors',
                  loginMethod === 'fields'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                📝 Enter Fields
              </button>
            </div>
          </div>
          
          <!-- File Upload Method -->
          <div v-if="loginMethod === 'file'" class="space-y-4">
            <div>
              <label for="keypair-file" class="block text-sm font-medium text-gray-700 mb-2">
                Select Keypair File
              </label>
              <input
                id="keypair-file"
                ref="fileInput"
                type="file"
                accept=".json"
                @change="handleFileUpload"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-chorus-50 file:text-chorus-700 hover:file:bg-chorus-100"
              />
              <p class="mt-1 text-xs text-gray-500">
                Select the JSON keypair file you downloaded during registration
              </p>
            </div>
          </div>
          
          <!-- Paste JSON Method -->
          <div v-if="loginMethod === 'paste'" class="space-y-4">
            <div>
              <label for="keypair-json" class="block text-sm font-medium text-gray-700 mb-2">
                Paste Keypair JSON
              </label>
              <textarea
                id="keypair-json"
                v-model="pastedKeypair"
                placeholder="Paste your keypair JSON here..."
                rows="6"
                class="input-field font-mono text-sm"
              ></textarea>
              <p class="mt-1 text-xs text-gray-500">
                Paste the contents of your keypair JSON file
              </p>
            </div>
          </div>
          
          <!-- Individual Fields Method -->
          <div v-if="loginMethod === 'fields'" class="space-y-4">
            <div>
              <label for="public-key-b64" class="block text-sm font-medium text-gray-700 mb-2">
                Public Key (Base64)
              </label>
              <input
                id="public-key-b64"
                v-model="keypairFields.publicKeyB64"
                type="text"
                placeholder="Enter your public key in base64 format..."
                class="input-field font-mono text-sm"
              />
              <p class="mt-1 text-xs text-gray-500">
                The base64-encoded public key from your text backup
              </p>
            </div>
            
            <div>
              <label for="public-key-hex" class="block text-sm font-medium text-gray-700 mb-2">
                Public Key (Hex) - Optional
              </label>
              <input
                id="public-key-hex"
                v-model="keypairFields.publicKeyHex"
                type="text"
                placeholder="Enter your public key in hex format..."
                class="input-field font-mono text-sm"
              />
              <p class="mt-1 text-xs text-gray-500">
                The hex-encoded public key (used for verification)
              </p>
            </div>
            
            <div>
              <label for="private-key-b64" class="block text-sm font-medium text-gray-700 mb-2">
                Private Key (Base64)
              </label>
              <input
                id="private-key-b64"
                v-model="keypairFields.privateKeyB64"
                type="text"
                placeholder="Enter your private key in base64 format..."
                class="input-field font-mono text-sm"
              />
              <p class="mt-1 text-xs text-gray-500">
                The base64-encoded private key from your text backup
              </p>
            </div>
            
            <div>
              <label for="user-id" class="block text-sm font-medium text-gray-700 mb-2">
                User ID - Optional
              </label>
              <input
                id="user-id"
                v-model="keypairFields.userId"
                type="text"
                placeholder="Enter your user ID..."
                class="input-field font-mono text-sm"
              />
              <p class="mt-1 text-xs text-gray-500">
                Your user ID for reference (optional)
              </p>
            </div>
            
            <!-- Parse Text Helper -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-800 mb-2">Quick Parse from Text Format</h4>
              <p class="text-xs text-blue-700 mb-3">
                If you have the text format backup, paste it below and click "Parse" to auto-fill the fields.
              </p>
              <textarea
                v-model="textToParse"
                placeholder="Paste your text format keypair backup here..."
                rows="4"
                class="w-full text-xs font-mono border border-blue-300 rounded p-2"
              ></textarea>
              <button
                @click="parseTextFormat"
                :disabled="!textToParse.trim()"
                class="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Parse Text
              </button>
            </div>
          </div>
          
          <!-- Login Button -->
          <button
            @click="handleLogin"
            :disabled="isLoading || !canLogin"
            class="w-full btn-secondary"
            :class="{ 'opacity-50 cursor-not-allowed': isLoading || !canLogin }"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              {{ isLoadingText }}
            </span>
            <span v-else>Sign In</span>
          </button>
          
          <!-- Recent Keypairs -->
          <div v-if="recentKeypairs.length > 0" class="mt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Recent Keypairs</h4>
            <div class="space-y-2">
              <div
                v-for="key in recentKeypairs"
                :key="key.keyId"
                class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
              >
                <div class="flex items-center space-x-3">
                  <div 
                    class="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    :style="{ backgroundColor: key.isDefault ? '#0ea5e9' : '#6b7280' }"
                  >
                    {{ key.displayName?.charAt(0).toUpperCase() || 'K' }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ key.displayName || `Key ${key.keyId.slice(-6)}` }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ formatDate(key.createdAt) }}
                    </p>
                  </div>
                </div>
                <button
                  @click="useKeypair(key)"
                  :disabled="isLoading"
                  class="px-3 py-1 text-xs font-medium text-chorus-600 bg-chorus-100 hover:bg-chorus-200 rounded-md disabled:opacity-50"
                >
                  Use
                </button>
              </div>
            </div>
            <div class="mt-3 text-center">
              <button
                @click="goToKeypairManager"
                class="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Manage All Keypairs →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Authentication Error
            </h3>
            <p class="mt-1 text-sm text-red-700">
              {{ error }}
            </p>
          </div>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">
              Privacy & Security
            </h3>
            <p class="mt-1 text-sm text-blue-700">
              Your private keys are generated and stored locally. They never leave your device.
              If you lose access to this device, you'll need to create a new identity.
            </p>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="text-center">
        <button
          @click="goBack"
          class="text-sm text-chorus-600 hover:text-chorus-500"
        >
          ← Back to Server Connection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { ProofOfWorkService } from '@/services/pow'
import { KeyStore } from '@/services/keystore'
import type { StoredKey } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()
const configStore = useConfigStore()
const keyStore = new KeyStore()

const registerForm = ref({
  displayName: '',
  accentColor: '#0ea5e9'
})

// Login form state
const loginMethod = ref<'file' | 'paste' | 'fields'>('file')
const pastedKeypair = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const recentKeypairs = ref<StoredKey[]>([])

// Individual fields for text format
const keypairFields = ref({
  publicKeyB64: '',
  publicKeyHex: '',
  privateKeyB64: '',
  userId: ''
})

// Text parsing helper
const textToParse = ref('')

const isLoading = computed(() => authStore.isLoading)
const error = computed(() => authStore.error)

// Computed properties for login
const canLogin = computed(() => {
  if (loginMethod.value === 'file') {
    return fileInput.value?.files && fileInput.value.files.length > 0
  } else if (loginMethod.value === 'paste') {
    return pastedKeypair.value.trim().length > 0
  } else if (loginMethod.value === 'fields') {
    return keypairFields.value.publicKeyB64.trim().length > 0 && 
           keypairFields.value.privateKeyB64.trim().length > 0
  }
  return false
})

const isLoadingText = computed(() => {
  if (isLoading.value) {
    return 'Signing In...'
  }
  return 'Sign In'
})

async function handleRegister() {
  try {
    // Generate new keypair
    const keyPair = await authStore.generateKeyPair()
    
    // Register with the server
    await authStore.register(
      keyPair,
      registerForm.value.displayName || undefined,
      registerForm.value.accentColor
    )
    
    // Redirect to keypair download page
    router.push('/download-keypair')
  } catch (err) {
    console.error('Registration failed:', err)
    // Error is handled by the auth store
  }
}

async function handleLogin() {
  try {
    let keypairData: any = null
    
    if (loginMethod.value === 'file') {
      // Handle file upload
      const file = fileInput.value?.files?.[0]
      if (!file) {
        throw new Error('No file selected')
      }
      
      const text = await file.text()
      keypairData = JSON.parse(text)
    } else if (loginMethod.value === 'paste') {
      // Handle pasted JSON
      const text = pastedKeypair.value.trim()
      if (!text) {
        throw new Error('No keypair data provided')
      }
      
      keypairData = JSON.parse(text)
    } else if (loginMethod.value === 'fields') {
      // Handle individual fields
      const { publicKeyB64, privateKeyB64, publicKeyHex, userId } = keypairFields.value
      
      if (!publicKeyB64.trim() || !privateKeyB64.trim()) {
        throw new Error('Public key and private key are required')
      }
      
      // Validate base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
      if (!base64Regex.test(publicKeyB64.trim()) || !base64Regex.test(privateKeyB64.trim())) {
        throw new Error('Invalid base64 format for keys')
      }
      
      // Validate hex format if provided
      if (publicKeyHex.trim() && !/^[0-9a-fA-F]+$/.test(publicKeyHex.trim())) {
        throw new Error('Invalid hex format for public key')
      }
      
      keypairData = {
        publicKey: publicKeyB64.trim(),
        privateKey: privateKeyB64.trim(),
        publicKeyHex: publicKeyHex.trim() || undefined,
        userId: userId.trim() || undefined,
        version: '1.0'
      }
    }
    
    // Validate keypair data
    if (!keypairData.publicKey || !keypairData.privateKey) {
      throw new Error('Invalid keypair format. Missing publicKey or privateKey.')
    }
    
    // Import and login
    await authStore.importAndLogin(keypairData)
    
    // Redirect to feed
    router.push('/feed')
        } catch (err) {
          // Error is handled by the auth store
          console.error('Login failed:', err)
        }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    // File selection is handled in handleLogin
    console.log('File selected:', target.files[0].name)
  }
}

function parseTextFormat() {
  try {
    const text = textToParse.value.trim()
    if (!text) {
      throw new Error('No text to parse')
    }
    
    // Parse the text format keypair
    const lines = text.split('\n')
    const parsed = {
      publicKeyB64: '',
      publicKeyHex: '',
      privateKeyB64: '',
      userId: ''
    }
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('User ID:')) {
        parsed.userId = trimmed.replace('User ID:', '').trim()
      } else if (trimmed.startsWith('Public Key (Base64):')) {
        parsed.publicKeyB64 = trimmed.replace('Public Key (Base64):', '').trim()
      } else if (trimmed.startsWith('Public Key (Hex):')) {
        parsed.publicKeyHex = trimmed.replace('Public Key (Hex):', '').trim()
      } else if (trimmed.startsWith('Private Key (Base64):')) {
        parsed.privateKeyB64 = trimmed.replace('Private Key (Base64):', '').trim()
      }
    }
    
    // Validate that we found the required fields
    if (!parsed.publicKeyB64 || !parsed.privateKeyB64) {
      throw new Error('Could not find required public key and private key in the text format')
    }
    
    // Update the form fields
    keypairFields.value = parsed
    
    // Clear the text area
    textToParse.value = ''
    
    console.log('Successfully parsed text format keypair')
  } catch (err) {
    console.error('Failed to parse text format:', err)
    // Error is handled by the auth store
  }
}


function goBack() {
  router.push('/connect')
}

function goToKeypairManager() {
  router.push('/keypairs')
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

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}

async function testProofOfWork() {
  try {
    console.log('Starting PoW test...')
    const result = await ProofOfWorkService.testProofOfWork()
    console.log('PoW test result:', result)
    
    if (result) {
      alert('✅ Proof of Work test PASSED! Check console for details.')
    } else {
      alert('❌ Proof of Work test FAILED! Check console for details.')
    }
  } catch (error) {
    console.error('PoW test error:', error)
    alert('❌ Proof of Work test ERROR! Check console for details.')
  }
}

onMounted(async () => {
  console.log('🔧 Auth component mounted, loading config...')
  
  // Load config first
  configStore.loadConfig()
  
  console.log('📡 Config loaded:', {
    stageURL: configStore.stageURL,
    isConnected: configStore.isConnected,
    connectionError: configStore.connectionError
  })
  
  // Check if already authenticated
  if (authStore.isAuthenticated) {
    console.log('✅ Already authenticated, redirecting to feed')
    router.push('/feed')
    return
  }
  
  // Check if server is connected
  if (!configStore.isConnected) {
    console.log('❌ Server not connected, redirecting to connect page')
    router.push('/connect')
    return
  }
  
  console.log('✅ Server connected, proceeding with auth logic')
  
  // Load recent keypairs for quick access
  try {
    const allKeys = await keyStore.listKeys()
    // Sort by creation date (newest first) and take the 5 most recent
    recentKeypairs.value = allKeys
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
    
    console.log('Loaded recent keypairs:', recentKeypairs.value.length)
  } catch (err) {
    console.log('No stored keypairs found:', err)
    recentKeypairs.value = []
  }
})
</script>
