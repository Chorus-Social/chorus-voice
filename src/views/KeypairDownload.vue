<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 flex items-center justify-center">
          <div class="h-12 w-12 bg-chorus-600 rounded-lg flex items-center justify-center">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          Download Your Keypair
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Save your keypair as a backup. You'll need this to access your account from other devices.
        </p>
      </div>

      <!-- Keypair Info -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Your Keypair Details</h3>
        
        <div class="space-y-4">
          <!-- Public Key -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Public Key
            </label>
            <div class="bg-gray-100 rounded-lg p-3 font-mono text-xs break-all">
              {{ publicKeyHex }}
            </div>
            <button
              @click="copyToClipboard(publicKeyHex)"
              class="mt-2 text-sm text-chorus-600 hover:text-chorus-500"
            >
              📋 Copy Public Key
            </button>
          </div>

          <!-- User ID -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <div class="bg-gray-100 rounded-lg p-3 font-mono text-xs break-all">
              {{ user?.user_id }}
            </div>
            <button
              @click="copyToClipboard(user?.user_id || '')"
              class="mt-2 text-sm text-chorus-600 hover:text-chorus-500"
            >
              📋 Copy User ID
            </button>
          </div>
        </div>
      </div>

      <!-- Download Options -->
      <div class="card">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Download Options</h3>
        
        <div class="space-y-4">
          <!-- JSON Format -->
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 class="font-medium text-gray-900">JSON Format</h4>
              <p class="text-sm text-gray-600">Complete keypair data in JSON format</p>
            </div>
            <button
              @click="downloadKeypair('json')"
              :disabled="isDownloading"
              class="btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': isDownloading }"
            >
              <span v-if="isDownloading">⏳</span>
              <span v-else>📄 Download JSON</span>
            </button>
          </div>

          <!-- Text Format -->
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 class="font-medium text-gray-900">Text Format</h4>
              <p class="text-sm text-gray-600">Human-readable keypair information</p>
            </div>
            <button
              @click="downloadKeypair('text')"
              :disabled="isDownloading"
              class="btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': isDownloading }"
            >
              <span v-if="isDownloading">⏳</span>
              <span v-else>📝 Download Text</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Security Warning -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">
              Important Security Notice
            </h3>
            <div class="mt-1 text-sm text-yellow-700">
              <ul class="list-disc list-inside space-y-1">
                <li>Store your keypair in a secure location</li>
                <li>Never share your private key with anyone</li>
                <li>If you lose this keypair, you cannot recover your account</li>
                <li>Consider using a password manager for storage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-4">
        <button
          @click="proceedToFeed"
          class="w-full btn-primary"
        >
          Continue to Feed
        </button>
        
        <button
          @click="downloadAll"
          :disabled="isDownloading"
          class="w-full btn-secondary"
          :class="{ 'opacity-50 cursor-not-allowed': isDownloading }"
        >
          <span v-if="isDownloading" class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            Downloading...
          </span>
          <span v-else>📦 Download All Formats</span>
        </button>
      </div>

      <!-- Success Message -->
      <div v-if="downloadSuccess" class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">
              Download Complete
            </h3>
            <p class="mt-1 text-sm text-green-700">
              Your keypair has been downloaded successfully.
            </p>
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
              Download Error
            </h3>
            <p class="mt-1 text-sm text-red-700">
              {{ error }}
            </p>
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
import { CryptoService } from '@/services/crypto'

const router = useRouter()
const authStore = useAuthStore()

const isDownloading = ref(false)
const downloadSuccess = ref(false)
const error = ref('')
const publicKeyHex = ref('')

const user = computed(() => authStore.user)

onMounted(async () => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    router.push('/auth')
    return
  }

  // Get the current keypair and display public key
  try {
    const keyPair = await authStore.getKeyPair()
    if (keyPair) {
      const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey)
      publicKeyHex.value = CryptoService.bytesToHex(new Uint8Array(publicKeyBytes))
    } else {
      error.value = 'No keypair found. Please try registering again.'
    }
  } catch (err) {
    error.value = 'Failed to load keypair information'
    console.error('Error loading keypair:', err)
  }
})

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // You could add a toast notification here
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

async function downloadKeypair(format: 'json' | 'text') {
  try {
    isDownloading.value = true
    error.value = ''
    downloadSuccess.value = false

    const keyPair = await authStore.getKeyPair()
    if (!keyPair || !user.value) {
      throw new Error('No keypair or user data available')
    }

    // Export keys to base64 for storage
    let publicKeyBase64: string
    let privateKeyBase64: string
    
    try {
      const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey)
      publicKeyBase64 = CryptoService.bytesToBase64(new Uint8Array(publicKeyBytes))
      
      // For private key, we need to export it as PKCS#8 format
      const privateKeyBytes = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
      privateKeyBase64 = CryptoService.bytesToBase64(new Uint8Array(privateKeyBytes))
    } catch (exportError) {
      const errorMessage = exportError instanceof Error ? exportError.message : 'Unknown error'
      throw new Error(`Failed to export keys: ${errorMessage}. The keys may not be extractable.`)
    }

    const keypairData = {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      publicKeyHex: publicKeyHex.value,
      userId: user.value.user_id,
      createdAt: new Date().toISOString(),
      version: '1.0',
      // Chorus-specific metadata
      chorusVersion: '1.0.0',
      chorusLabel: 'Chorus-Voice-Keypair',
      isChorusKey: true
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(keypairData, null, 2)
      filename = `chorus-keypair-${user.value.user_id.slice(0, 8)}.json`
      mimeType = 'application/json'
    } else {
      content = `Chorus Keypair Backup
====================

User ID: ${user.value.user_id}
Public Key (Base64): ${publicKeyBase64}
Public Key (Hex): ${publicKeyHex.value}
Private Key (Base64): ${privateKeyBase64}
Created: ${new Date().toISOString()}
Version: 1.0

Chorus Metadata:
- Chorus Version: 1.0.0
- Chorus Label: Chorus-Voice-Keypair
- Is Chorus Key: true

IMPORTANT SECURITY NOTICE:
- Store this file in a secure location
- Never share your private key with anyone
- If you lose this keypair, you cannot recover your account
- Consider using a password manager for storage
- This keypair is specifically for Chorus Voice and cannot be used with other applications

This keypair was generated using the SubtleCrypto API with Ed25519 algorithm.
`
      filename = `chorus-keypair-${user.value.user_id.slice(0, 8)}.txt`
      mimeType = 'text/plain'
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    downloadSuccess.value = true
  } catch (err) {
    error.value = `Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    console.error('Download error:', err)
  } finally {
    isDownloading.value = false
  }
}

async function downloadAll() {
  await downloadKeypair('json')
  // Small delay between downloads
  setTimeout(() => {
    downloadKeypair('text')
  }, 500)
}

function proceedToFeed() {
  router.push('/feed')
}
</script>
