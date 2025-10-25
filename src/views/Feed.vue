<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header Actions -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Feed</h1>
          <p class="text-sm text-gray-600">Discover posts from the community</p>
        </div>
        <button
          @click="router.push('/create')"
          class="btn-primary"
        >
          New Post
        </button>
      </div>
      
      <!-- Community Filter -->
      <div class="mb-6">
        <select
          v-model="selectedCommunity"
          @change="handleCommunityChange"
          class="input-field max-w-xs"
        >
          <option value="">All Communities</option>
          <option
            v-for="community in communities"
            :key="community.id"
            :value="community.internal_slug"
          >
            {{ community.display_name }}
          </option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && posts.length === 0" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-chorus-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Failed to load posts
            </h3>
            <p class="mt-1 text-sm text-red-700">
              {{ error }}
            </p>
            <button
              @click="refreshPosts"
              class="mt-2 text-sm text-red-600 hover:text-red-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>

      <!-- Posts Feed -->
      <div v-else-if="posts.length > 0" class="space-y-6">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @vote="handleVote"
          @delete="handleDelete"
        />
        
        <!-- Load More Button -->
        <div v-if="hasMore" class="text-center py-6">
          <button
            @click="loadMorePosts"
            :disabled="isLoading"
            class="btn-secondary"
            :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Loading...
            </span>
            <span v-else>Load More Posts</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading" class="text-center py-12">
        <div class="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 class="mt-4 text-lg font-medium text-gray-900">No posts yet</h3>
        <p class="mt-2 text-sm text-gray-600">
          Be the first to share something with the community.
        </p>
        <button
          @click="router.push('/create')"
          class="mt-4 btn-primary"
        >
          Create First Post
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import PostCard from '@/components/PostCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()

const selectedCommunity = ref('')

const posts = computed(() => postsStore.posts)
const communities = computed(() => postsStore.communities)
const isLoading = computed(() => postsStore.isLoading)
const error = computed(() => postsStore.error)
const hasMore = computed(() => postsStore.hasMore)

async function loadPosts() {
  try {
    await postsStore.loadPosts({
      community_slug: selectedCommunity.value || undefined
    })
  } catch (err) {
    console.error('Failed to load posts:', err)
  }
}

async function loadMorePosts() {
  try {
    await postsStore.loadMorePosts({
      community_slug: selectedCommunity.value || undefined
    })
  } catch (err) {
    console.error('Failed to load more posts:', err)
  }
}

async function refreshPosts() {
  try {
    await postsStore.refreshPosts({
      community_slug: selectedCommunity.value || undefined
    })
  } catch (err) {
    console.error('Failed to refresh posts:', err)
  }
}

async function handleCommunityChange() {
  await refreshPosts()
}

async function handleVote(postId: number, direction: 1 | -1) {
  // TODO: Implement voting
  console.log('Vote:', postId, direction)
}

async function handleDelete(postId: number) {
  try {
    await postsStore.deletePost(postId)
  } catch (err) {
    console.error('Failed to delete post:', err)
  }
}

// Logout is handled by the App.vue header

onMounted(async () => {
  // Check authentication
  if (!authStore.isAuthenticated) {
    router.push('/auth')
    return
  }
  
  // Load communities and posts
  try {
    await postsStore.loadCommunities()
    await loadPosts()
  } catch (err) {
    console.error('Failed to initialize feed:', err)
  }
})
</script>
