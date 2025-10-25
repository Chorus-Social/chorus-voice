<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center">
          <button
            @click="router.push('/feed')"
            class="text-gray-600 hover:text-gray-900 mr-4"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-gray-900">Create Post</h1>
        </div>
        
        <div class="flex items-center space-x-4">
          <button
            @click="handleSaveDraft"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            Save Draft
          </button>
          <button
            @click="router.push('/feed')"
            class="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Community Selection -->
        <div>
          <label for="community" class="block text-sm font-medium text-gray-700 mb-2">
            Community
          </label>
          <select
            id="community"
            v-model="form.community"
            class="input-field max-w-xs"
          >
            <option value="">Select a community</option>
            <option
              v-for="community in communities"
              :key="community.id"
              :value="community.internal_slug"
            >
              {{ community.display_name }}
            </option>
          </select>
        </div>

        <!-- Post Content -->
        <div>
          <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div class="border border-gray-300 rounded-lg overflow-hidden">
            <!-- Tab Navigation -->
            <div class="bg-gray-50 border-b border-gray-300">
              <nav class="flex">
                <button
                  type="button"
                  @click="activeTab = 'write'"
                  :class="[
                    'px-4 py-2 text-sm font-medium',
                    activeTab === 'write'
                      ? 'accent-text border-b-2 accent-border bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  ]"
                >
                  Write
                </button>
                <button
                  type="button"
                  @click="activeTab = 'preview'"
                  :class="[
                    'px-4 py-2 text-sm font-medium',
                    activeTab === 'preview'
                      ? 'accent-text border-b-2 accent-border bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  ]"
                >
                  Preview
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="min-h-96">
              <!-- Write Tab -->
              <div v-if="activeTab === 'write'" class="p-4">
                <textarea
                  id="content"
                  v-model="form.content"
                  rows="12"
                  placeholder="Share your thoughts with the community..."
                  class="w-full border-0 resize-none focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500"
                  required
                ></textarea>
              </div>

              <!-- Preview Tab -->
              <div v-else class="p-4 prose prose-sm max-w-none">
                <div v-html="renderedContent"></div>
                <div v-if="!form.content" class="text-gray-500 italic">
                  Start writing to see a preview...
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-2 flex justify-between text-sm text-gray-500">
            <span>{{ form.content.length }}/5000 characters</span>
            <span>Markdown supported</span>
          </div>
        </div>

        <!-- Proof of Work Status -->
        <div v-if="isGeneratingPoW" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <h3 class="text-sm font-medium text-blue-800">
                Generating Proof of Work
              </h3>
              <p class="text-sm text-blue-700">
                This may take a few seconds to complete...
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
                Failed to create post
              </h3>
              <p class="mt-1 text-sm text-red-700">
                {{ error }}
              </p>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-4">
          <button
            type="button"
            @click="router.push('/feed')"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!canSubmit || isSubmitting"
            class="btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !canSubmit || isSubmitting }"
          >
            <span v-if="isSubmitting" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Publishing...
            </span>
            <span v-else>Publish Post</span>
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import { CryptoService } from '@/services/crypto'
import { ProofOfWorkService } from '@/services/pow'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()

const activeTab = ref<'write' | 'preview'>('write')
const isSubmitting = ref(false)
const isGeneratingPoW = ref(false)
const error = ref('')

const form = ref({
  content: '',
  community: ''
})

const communities = computed(() => postsStore.communities)

const renderedContent = computed(() => {
  if (!form.value.content) return ''
  const html = marked(form.value.content)
  return DOMPurify.sanitize(html)
})

const canSubmit = computed(() => {
  return form.value.content.trim().length > 0 && 
         form.value.content.length <= 5000 &&
         !isSubmitting.value
})

async function handleSubmit() {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  error.value = ''
  
  try {
    // Generate proof of work
    isGeneratingPoW.value = true
    
    // For now, we'll use a simplified approach
    // In a real implementation, you'd get the target and difficulty from the server
    const target = 'placeholder-target'
    const difficulty = 15
    
    // For now, we'll use a placeholder since we need a real pubkey and action
    const powResult = await ProofOfWorkService.generateProof('create_post', 'placeholder-pubkey', target, difficulty, 'blake3')
    
    // Generate content hash
    const contentHash = CryptoService.hashHex(form.value.content)
    
    // Create post data
    const postData = {
      content_md: form.value.content,
      community_internal_slug: form.value.community || undefined,
      pow_nonce: powResult.nonce,
      pow_difficulty: difficulty,
      content_hash: contentHash
    }
    
    // Submit post
    await postsStore.createPost(postData)
    
    // Redirect to feed
    router.push('/feed')
    
  } catch (err) {
    error.value = `Failed to create post: ${err instanceof Error ? err.message : 'Unknown error'}`
    console.error('Post creation failed:', err)
  } finally {
    isSubmitting.value = false
    isGeneratingPoW.value = false
  }
}

function handleSaveDraft() {
  // TODO: Implement draft saving
  console.log('Save draft:', form.value)
}

onMounted(async () => {
  // Check authentication
  if (!authStore.isAuthenticated) {
    router.push('/auth')
    return
  }
  
  // Load communities
  try {
    await postsStore.loadCommunities()
  } catch (err) {
    console.error('Failed to load communities:', err)
  }
})
</script>
