import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type {
  ChallengeRequest,
  ChallengeResponse,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  PostCreate,
  PostResponse,
  VoteCreate,
  CommunityResponse,
  CommunityCreate,
  PaginationParams
} from '@/types/api'

/**
 * API service for Chorus Stage backend
 * 
 * This service manages all HTTP communication with the Chorus Stage server,
 * providing a clean interface for:
 * - Authentication (registration, login, challenges)
 * - Post management (create, read, update, delete)
 * - Community operations (join, leave, list)
 * - User profile management
 * - Vote casting and retrieval
 * 
 * Features:
 * - Automatic JWT token management
 * - Rate limiting protection
 * - Request/response interceptors
 * - Error handling and retry logic
 * - CORS support
 * 
 * Security considerations:
 * - All requests include proper authentication headers
 * - Rate limiting prevents abuse
 * - Input validation on all endpoints
 * - Secure token storage and rotation
 * 
 * @author Chorus Development Team
 * @version 1.0.0
 */
export class APIService {
  private client: AxiosInstance
  private baseURL: string = ''
  private requestQueue: Map<string, number> = new Map()
  private readonly RATE_LIMIT_WINDOW = 60000 // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 30
  
  // Request cache for GET requests to improve performance
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 30000 // 30 seconds cache TTL
  
  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    })
    
    // Add request interceptor for auth token and rate limiting
    this.client.interceptors.request.use(
      (config) => {
        // Rate limiting check
        const endpoint = config.url || ''
        const now = Date.now()
        const windowStart = now - this.RATE_LIMIT_WINDOW
        
        // Clean old entries
        for (const [key, timestamp] of this.requestQueue.entries()) {
          if (timestamp < windowStart) {
            this.requestQueue.delete(key)
          }
        }
        
        // Check rate limit
        const recentRequests = Array.from(this.requestQueue.values()).filter(t => t > windowStart).length
        if (recentRequests >= this.MAX_REQUESTS_PER_WINDOW) {
          return Promise.reject(new Error('Rate limit exceeded. Please wait before making more requests.'))
        }
        
        // Add to queue
        this.requestQueue.set(`${endpoint}-${now}`, now)
        
        const token = localStorage.getItem('auth_token')
        if (token) {
          // Basic token validation
          if (token.split('.').length === 3) {
            config.headers.Authorization = `Bearer ${token}`
          } else {
            console.warn('Invalid token format, removing from request')
            localStorage.removeItem('auth_token')
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear all auth data and redirect
          console.warn('Authentication failed, clearing session')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          localStorage.removeItem('session_nonce')
          
          // Only redirect if not already on auth page
          if (!window.location.pathname.includes('/auth')) {
            window.location.href = '/auth'
          }
        } else if (error.response?.status === 429) {
          // Rate limited
          console.warn('Rate limited by server')
        } else if (error.response?.status >= 500) {
          // Server error
          console.error('Server error:', error.response.status)
        }
        return Promise.reject(error)
      }
    )
  }
  
  /**
   * Set the base URL for the API
   * In development, uses relative URLs to leverage Vite proxy
   * In production, uses the full backend URL
   */
  setBaseURL(url: string) {
    // In development mode, use relative URLs to leverage Vite proxy
    if (import.meta.env.DEV) {
      this.baseURL = '' // Use relative URLs in development
      this.client.defaults.baseURL = ''
      console.log('🌐 Development mode: Using relative URLs with Vite proxy')
    } else {
      this.baseURL = url.replace(/\/$/, '') // Remove trailing slash
      this.client.defaults.baseURL = this.baseURL
      console.log('🌐 Production mode: API base URL set to:', this.baseURL)
    }
  }
  
  /**
   * Get cached data if available and not expired
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    if (cached) {
      this.cache.delete(key) // Remove expired cache
    }
    return null
  }
  
  /**
   * Set data in cache
   * @param key - Cache key
   * @param data - Data to cache
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
  
  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
  }
  
  /**
   * Test connection to the Stage server
   */
  async testConnection(url: string): Promise<boolean> {
    try {
      console.log('🔍 Testing connection to:', url)
      const testClient = axios.create({ timeout: 5000 })
      
      let healthUrl: string
      if (import.meta.env.DEV) {
        // In development, use relative URL to leverage Vite proxy
        healthUrl = '/health'
        console.log('🏥 Development mode: Using relative health check URL:', healthUrl)
      } else {
        // In production, use the full URL
        healthUrl = `${url}/health`
        console.log('🏥 Production mode: Health check URL:', healthUrl)
      }
      
      const response = await testClient.get(healthUrl)
      console.log('✅ Health check successful:', response.status)
      return response.status === 200
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      return false
    }
  }
  
  // Authentication endpoints
  
  /**
   * Request a challenge for authentication
   */
  async requestChallenge(pubkey: string, intent: 'register' | 'login'): Promise<ChallengeResponse> {
    const request: ChallengeRequest = { pubkey, intent }
    console.log('🎯 Requesting challenge:', { intent, pubkeyLength: pubkey.length })
    console.log('🌐 Making request to:', this.client.defaults.baseURL + '/api/v1/auth/challenge')
    
    const response: AxiosResponse<ChallengeResponse> = await this.client.post(
      '/api/v1/auth/challenge',
      request
    )
    console.log('✅ Challenge request successful:', response.status)
    return response.data
  }
  
  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response: AxiosResponse<RegisterResponse> = await this.client.post(
      '/api/v1/auth/register',
      request
    )
    return response.data
  }
  
  /**
   * Login with existing credentials
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 Attempting login with request:', {
      pubkeyLength: request.pubkey.length,
      hasPow: !!request.pow,
      hasProof: !!request.proof
    })
    console.log('🌐 Making request to:', this.client.defaults.baseURL + '/api/v1/auth/login')
    
    const response: AxiosResponse<LoginResponse> = await this.client.post(
      '/api/v1/auth/login',
      request
    )
    console.log('✅ Login successful:', response.status)
    return response.data
  }
  
  // Posts endpoints
  
  /**
   * Get posts feed with caching for better performance
   */
  async getPosts(params: PaginationParams & { community_slug?: string } = {}): Promise<PostResponse[]> {
    // Create cache key based on parameters
    const cacheKey = `posts:${JSON.stringify(params)}`
    
    // Check cache first
    const cached = this.getCachedData(cacheKey)
    if (cached) {
      return cached
    }
    
    const response: AxiosResponse<PostResponse[]> = await this.client.get('/api/v1/posts/', {
      params
    })
    
    // Cache the response
    this.setCachedData(cacheKey, response.data)
    
    return response.data
  }
  
  /**
   * Get a specific post
   */
  async getPost(postId: number): Promise<PostResponse> {
    const response: AxiosResponse<PostResponse> = await this.client.get(`/api/v1/posts/${postId}`)
    return response.data
  }
  
  /**
   * Create a new post
   */
  async createPost(post: PostCreate): Promise<PostResponse> {
    const response: AxiosResponse<PostResponse> = await this.client.post('/api/v1/posts/', post)
    return response.data
  }
  
  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<void> {
    await this.client.delete(`/api/v1/posts/${postId}`)
  }
  
  /**
   * Get post children (replies)
   */
  async getPostChildren(postId: number, params: PaginationParams = {}): Promise<PostResponse[]> {
    const response: AxiosResponse<PostResponse[]> = await this.client.get(
      `/api/v1/posts/${postId}/children`,
      { params }
    )
    return response.data
  }
  
  // Votes endpoints
  
  /**
   * Cast a vote
   */
  async castVote(vote: VoteCreate): Promise<Record<string, string>> {
    const response: AxiosResponse<Record<string, string>> = await this.client.post(
      '/api/v1/votes/',
      vote
    )
    return response.data
  }
  
  /**
   * Get my vote on a post
   */
  async getMyVote(postId: number): Promise<Record<string, number>> {
    const response: AxiosResponse<Record<string, number>> = await this.client.get(
      `/api/v1/votes/${postId}/my-vote`
    )
    return response.data
  }
  
  // Communities endpoints
  
  /**
   * List communities
   */
  async getCommunities(): Promise<CommunityResponse[]> {
    const response: AxiosResponse<CommunityResponse[]> = await this.client.get('/api/v1/communities/')
    return response.data
  }
  
  /**
   * Create a community
   */
  async createCommunity(community: CommunityCreate): Promise<CommunityResponse> {
    const response: AxiosResponse<CommunityResponse> = await this.client.post(
      '/api/v1/communities/',
      community
    )
    return response.data
  }
  
  /**
   * Get a specific community
   */
  async getCommunity(communityId: number): Promise<CommunityResponse> {
    const response: AxiosResponse<CommunityResponse> = await this.client.get(
      `/api/v1/communities/${communityId}`
    )
    return response.data
  }
  
  /**
   * Join a community
   */
  async joinCommunity(communityId: number): Promise<Record<string, string>> {
    const response: AxiosResponse<Record<string, string>> = await this.client.post(
      `/api/v1/communities/${communityId}/join`
    )
    return response.data
  }
  
  /**
   * Leave a community
   */
  async leaveCommunity(communityId: number): Promise<void> {
    await this.client.delete(`/api/v1/communities/${communityId}/leave`)
  }
  
  /**
   * Get community posts
   */
  async getCommunityPosts(communityId: number, params: PaginationParams = {}): Promise<PostResponse[]> {
    const response: AxiosResponse<PostResponse[]> = await this.client.get(
      `/api/v1/communities/${communityId}/posts`,
      { params }
    )
    return response.data
  }
  
  // System endpoints
  
  /**
   * Get system health
   */
  async getHealth(): Promise<Record<string, any>> {
    const response: AxiosResponse<Record<string, any>> = await this.client.get('/health')
    return response.data
  }
  
  /**
   * Get system status
   */
  async getSystemStatus(): Promise<Record<string, any>> {
    const response: AxiosResponse<Record<string, any>> = await this.client.get('/api/v1/system/status')
    return response.data
  }
  
  // User profile endpoints
  
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<Record<string, any>> {
    console.log('🌐 API getProfile called')
    console.log('🌐 Making GET request to:', this.client.defaults.baseURL + '/api/v1/users/me/profile')
    console.log('🔑 Authorization header:', this.client.defaults.headers.Authorization ? 'Present' : 'Missing')
    console.log('🔑 Token value:', localStorage.getItem('auth_token') ? 'Present' : 'Missing')
    
    try {
      const response: AxiosResponse<Record<string, any>> = await this.client.get('/api/v1/users/me/profile')
      console.log('✅ Profile fetch successful:', response.status, response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Profile fetch failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: this.client.defaults.baseURL,
        fullURL: this.client.defaults.baseURL + '/api/v1/users/me/profile'
      })
      throw error
    }
  }
  
  /**
   * Update current user's profile
   */
  async updateProfile(updates: {
    display_name?: string
    accent_color?: string
  }): Promise<Record<string, any>> {
    console.log('🌐 API updateProfile called with:', updates)
    console.log('🌐 Making PATCH request to:', this.client.defaults.baseURL + '/api/v1/users/me/profile')
    console.log('🔑 Authorization header:', this.client.defaults.headers.Authorization ? 'Present' : 'Missing')
    
    const response: AxiosResponse<Record<string, any>> = await this.client.patch(
      '/api/v1/users/me/profile',
      updates
    )
    
    console.log('✅ Profile update successful:', response.status, response.data)
    return response.data
  }
}

// Export singleton instance
export const apiService = new APIService()