import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import type { Post, PostWithVotes, CreatePostData, PostFilters, Community } from '@/types/post'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<PostWithVotes[]>([])
  const communities = ref<Community[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string>('')
  const hasMore = ref<boolean>(true)
  const currentPage = ref<number>(0)
  
  const postsByCommunity = computed(() => {
    const grouped: Record<string, PostWithVotes[]> = {}
    posts.value.forEach(post => {
      const communityId = post.community_id?.toString() || 'general'
      if (!grouped[communityId]) {
        grouped[communityId] = []
      }
      grouped[communityId].push(post)
    })
    return grouped
  })
  
  /**
   * Load posts from the API with optimized data transformation
   * 
   * This function handles post loading with proper error handling and
   * data transformation from API response to application state.
   * 
   * Performance optimizations:
   * - Uses API service caching for repeated requests
   * - Efficient data transformation with map()
   * - Proper pagination state management
   * 
   * @param filters - Post filtering and pagination parameters
   */
  async function loadPosts(filters: PostFilters = {}) {
    try {
      isLoading.value = true
      error.value = ''
      
      const response = await apiService.getPosts({
        limit: filters.limit || 50,
        before: filters.before,
        community_slug: filters.community_slug
      })
      
      // Convert PostResponse to PostWithVotes by adding vote_score and user_vote
      // This transformation is done efficiently with a single map operation
      const postsWithVotes: PostWithVotes[] = response.map(post => ({
        ...post,
        vote_score: post.upvotes - post.downvotes,
        user_vote: null // TODO: Get actual user vote from API
      }))
      
      if (filters.before) {
        // Append to existing posts for pagination
        posts.value.push(...postsWithVotes)
      } else {
        posts.value = postsWithVotes
      }
      
      hasMore.value = response.length === (filters.limit || 50)
      currentPage.value++
      
    } catch (err) {
      error.value = `Failed to load posts: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Load more posts (pagination)
   */
  async function loadMorePosts(filters: PostFilters = {}) {
    if (!hasMore.value || isLoading.value) return
    
    const lastPost = posts.value[posts.value.length - 1]
    const before = lastPost ? lastPost.order_index : undefined
    
    await loadPosts({
      ...filters,
      before
    })
  }
  
  /**
   * Refresh posts
   */
  async function refreshPosts(filters: PostFilters = {}) {
    posts.value = []
    hasMore.value = true
    currentPage.value = 0
    await loadPosts(filters)
  }
  
  /**
   * Get a specific post
   */
  async function getPost(postId: number): Promise<Post | null> {
    try {
      const post = await apiService.getPost(postId)
      return post
    } catch (err) {
      error.value = `Failed to get post: ${err instanceof Error ? err.message : 'Unknown error'}`
      return null
    }
  }
  
  /**
   * Create a new post
   */
  async function createPost(postData: CreatePostData): Promise<Post | null> {
    try {
      isLoading.value = true
      error.value = ''
      
      // This would normally include PoW generation and content hashing
      // For now, we'll create a simplified version
      const post: any = {
        content_md: postData.content_md,
        community_internal_slug: postData.community_internal_slug,
        parent_post_id: postData.parent_post_id,
        pow_nonce: 'placeholder', // Would be generated
        pow_difficulty: 15,
        content_hash: 'placeholder' // Would be computed
      }
      
      const newPost = await apiService.createPost(post)
      
      // Add to local posts array
      posts.value.unshift(newPost as PostWithVotes)
      
      return newPost
    } catch (err) {
      error.value = `Failed to create post: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Delete a post
   */
  async function deletePost(postId: number): Promise<void> {
    try {
      await apiService.deletePost(postId)
      
      // Remove from local posts array
      const index = posts.value.findIndex(p => p.id === postId)
      if (index !== -1) {
        posts.value.splice(index, 1)
      }
    } catch (err) {
      error.value = `Failed to delete post: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    }
  }
  
  /**
   * Load communities
   */
  async function loadCommunities(): Promise<void> {
    try {
      isLoading.value = true
      error.value = ''
      
      const response = await apiService.getCommunities()
      communities.value = response
    } catch (err) {
      error.value = `Failed to load communities: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Get posts for a specific community
   */
  async function getCommunityPosts(communityId: number, filters: PostFilters = {}): Promise<Post[]> {
    try {
      const response = await apiService.getCommunityPosts(communityId, filters)
      return response
    } catch (err) {
      error.value = `Failed to load community posts: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    }
  }
  
  /**
   * Clear all posts
   */
  function clearPosts() {
    posts.value = []
    hasMore.value = true
    currentPage.value = 0
  }
  
  return {
    // State
    posts,
    communities,
    isLoading,
    error,
    hasMore,
    currentPage,
    
    // Computed
    postsByCommunity,
    
    // Actions
    loadPosts,
    loadMorePosts,
    refreshPosts,
    getPost,
    createPost,
    deletePost,
    loadCommunities,
    getCommunityPosts,
    clearPosts
  }
})
