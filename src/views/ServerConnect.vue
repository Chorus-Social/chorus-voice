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
          Connect to Chorus
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Enter your Chorus Stage server URL to get started
        </p>
      </div>

      <!-- Connection Form -->
      <form @submit.prevent="handleConnect" class="mt-8 space-y-6">
        <div>
          <label for="stage-url" class="block text-sm font-medium text-gray-700">
            Stage Server URL
          </label>
          <div class="mt-1">
            <input
              id="stage-url"
              v-model="stageURL"
              type="text"
              placeholder="localhost:8001 or https://stage.example.com"
              class="input-field"
              :class="{ 'border-red-500': !isValidURL && stageURL }"
              required
            />
          </div>
          <p v-if="!isValidURL && stageURL" class="mt-1 text-sm text-red-600">
            Please enter a valid URL
          </p>
          <p class="mt-1 text-sm text-gray-500">
            Examples: localhost:8001, https://stage.chorus.example.com
          </p>
        </div>

        <!-- Connection Status -->
        <div v-if="isLoading" class="flex items-center justify-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-chorus-600"></div>
          <span class="ml-3 text-sm text-gray-600">Testing connection...</span>
        </div>

        <div v-else-if="connectionError" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Connection Failed
              </h3>
              <p class="mt-1 text-sm text-red-700">
                {{ connectionError }}
              </p>
            </div>
          </div>
        </div>

        <div v-else-if="isConnected" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM16.707 7.293a1 1 0 00-1.414-1.414L10 10.586 4.707 5.293a1 1 0 00-1.414 1.414L8.586 12l-5.293 5.293a1 1 0 101.414 1.414L10 13.414l5.293 5.293a1 1 0 001.414-1.414L11.414 12l5.293-5.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                Connected Successfully
              </h3>
              <p class="mt-1 text-sm text-green-700">
                Connected to {{ normalizedURL }}
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4">
          <button
            type="button"
            @click="handleTestConnection"
            :disabled="!isValidURL || isLoading"
            class="flex-1 btn-secondary"
            :class="{ 'opacity-50 cursor-not-allowed': !isValidURL || isLoading }"
          >
            Test Connection
          </button>
          <button
            type="submit"
            :disabled="!isValidURL || !isConnected || isLoading"
            class="flex-1 btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !isValidURL || !isConnected || isLoading }"
          >
            Continue
          </button>
        </div>
      </form>

      <!-- Help Text -->
      <div class="text-center">
        <p class="text-xs text-gray-500">
          Need help? Check the <a href="#" class="text-chorus-600 hover:text-chorus-500">documentation</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'

const router = useRouter()
const configStore = useConfigStore()

const stageURL = ref('')

const isValidURL = computed(() => configStore.isValidURL)
const isConnected = computed(() => configStore.isConnected)
const connectionError = computed(() => configStore.connectionError)
const isLoading = computed(() => configStore.isLoading)
const normalizedURL = computed(() => configStore.normalizedURL)

// Watch for URL changes
watch(stageURL, (newURL) => {
  configStore.setStageURL(newURL)
})

async function handleTestConnection() {
  await configStore.testConnection()
}

async function handleConnect() {
  if (!isConnected.value) {
    await handleTestConnection()
  }
  
  if (isConnected.value) {
    router.push('/auth')
  }
}

onMounted(() => {
  configStore.loadConfig()
  stageURL.value = configStore.stageURL
})
</script>
