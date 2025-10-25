import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import { CryptoService } from '@/services/crypto'
import { ProofOfWorkService } from '@/services/pow'
import { KeyStore } from '@/services/keystore'
import type { User, KeyPair } from '@/types/auth'
import type { RegisterRequest, LoginRequest } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const sessionNonce = ref<string | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string>('')
  
  const isAuthenticated = computed(() => !!user.value) // Allow users who just registered (no token yet)
  const isFullyAuthenticated = computed(() => !!token.value && !!user.value) // Full authentication with token
  
  const keyStore = new KeyStore()
  
  /**
   * Load saved authentication state
   * 
   * Safely loads authentication data from localStorage with validation.
   * Performs basic token format validation and handles parsing errors gracefully.
   * 
   * Security considerations:
   * - Validates JWT token format before use
   * - Clears invalid data to prevent security issues
   * - Handles JSON parsing errors safely
   */
  function loadAuthState() {
    try {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('auth_user')
      const savedNonce = localStorage.getItem('session_nonce')
      
      if (savedToken && savedUser) {
        // Validate token format (basic JWT structure check)
        if (savedToken.split('.').length !== 3) {
          console.warn('Invalid token format, clearing auth state')
          clearAuthState()
          return
        }
        
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        sessionNonce.value = savedNonce
      }
    } catch (error) {
      console.error('Failed to load auth state:', error)
      clearAuthState()
    }
  }
  
  /**
   * Save authentication state
   */
  function saveAuthState() {
    if (token.value) {
      localStorage.setItem('auth_token', token.value)
    }
    if (user.value) {
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
    if (sessionNonce.value) {
      localStorage.setItem('session_nonce', sessionNonce.value)
    }
  }
  
  /**
   * Clear authentication state
   */
  function clearAuthState() {
    user.value = null
    token.value = null
    sessionNonce.value = null
    error.value = ''
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('session_nonce')
  }
  
  /**
   * Generate a new keypair
   */
  async function generateKeyPair(displayName?: string): Promise<KeyPair> {
    try {
      const { keyPair } = await keyStore.generateAndStoreKey(undefined, true, displayName) // Set as default
      return keyPair
    } catch (err) {
      error.value = `Failed to generate keypair: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    }
  }
  
  /**
   * Get existing keypair
   */
  async function getKeyPair(keyId?: string): Promise<KeyPair | null> {
    try {
      if (keyId) {
        return await keyStore.getKeyPair(keyId)
      } else {
        const defaultKey = await keyStore.getDefaultKey()
        if (defaultKey) {
          return await keyStore.getKeyPair(defaultKey.keyId)
        }
      }
      return null
    } catch (err) {
      error.value = `Failed to get keypair: ${err instanceof Error ? err.message : 'Unknown error'}`
      return null
    }
  }
  
  /**
   * Request authentication challenge
   */
  async function requestChallenge(pubkey: string, intent: 'register' | 'login'): Promise<{ challenge: string; difficulty: number; target: string }> {
    try {
      isLoading.value = true
      error.value = ''
      
      const response = await apiService.requestChallenge(pubkey, intent)
      
      return {
        challenge: response.signature_challenge,
        difficulty: response.pow_difficulty,
        target: response.pow_target
      }
    } catch (err) {
      error.value = `Failed to request challenge: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Register a new user
   */
  async function register(
    keyPair: KeyPair,
    displayName?: string,
    accentColor?: string
  ): Promise<User> {
    try {
      isLoading.value = true
      error.value = ''
      
      // Get public key as base64
      const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey)
      const publicKeyBase64 = CryptoService.bytesToBase64(new Uint8Array(publicKeyBytes))
      
      // Request challenge
      const { challenge, difficulty, target } = await requestChallenge(publicKeyBase64, 'register')
      
      // Generate proof of work
      console.debug('Generating PoW for target:', target, 'difficulty:', difficulty)
      
      // Convert public key to hex for PoW computation
      const publicKeyHex = CryptoService.bytesToHex(new Uint8Array(publicKeyBytes))
      
      const powResult = await ProofOfWorkService.generateProof(
        'register',
        publicKeyHex,
        target,
        difficulty,
        'blake3'
      )
      console.debug('PoW result:', powResult)
      
      // Sign the challenge
      console.debug('Registration challenge string:', challenge, 'Length:', challenge.length)
      const challengeBytes = CryptoService.base64ToBytes(challenge)
      const signature = await CryptoService.sign(keyPair.privateKey, challengeBytes)
      
      // Create registration request
      const request: RegisterRequest = {
        pubkey: publicKeyBase64,
        display_name: displayName || null,
        accent_color: accentColor || null,
        pow: {
          nonce: powResult.nonce,
          difficulty,
          target,
          hash_algorithm: 'blake3'
        },
        proof: {
          challenge,
          signature: CryptoService.bytesToBase64(signature)
        }
      }
      
      // Submit registration
      console.debug('Registration request:', JSON.stringify(request, null, 2))
      const response = await apiService.register(request)
      
      // Create user object
      const newUser: User = {
        user_id: response.user_id,
        pubkey: publicKeyBase64,
        pubkey_hash: CryptoService.hashHex(new Uint8Array(publicKeyBytes)),
        created: response.created,
        tier: 'new',
        display_name: displayName,
        accent_color: accentColor
      }
      
      user.value = newUser
      saveAuthState()
      
      return newUser
    } catch (err) {
      error.value = `Registration failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Login with existing credentials
   */
  async function login(keyPair: KeyPair): Promise<{ user: User; token: string; sessionNonce: string }> {
    try {
      console.log('🔐 Starting login process...')
      isLoading.value = true
      error.value = ''
      
      // Get public key as base64
      const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey)
      const publicKeyBase64 = CryptoService.bytesToBase64(new Uint8Array(publicKeyBytes))
      console.log('🔑 Public key length:', publicKeyBase64.length)
      
      // Request challenge
      console.log('📡 Requesting challenge for login...')
      const { challenge, difficulty, target } = await requestChallenge(publicKeyBase64, 'login')
      console.log('🎯 Challenge received:', { difficulty, targetLength: target.length })
      
      // Generate proof of work
      // Convert public key to hex for PoW computation
      const publicKeyHex = CryptoService.bytesToHex(new Uint8Array(publicKeyBytes))
      
      const powResult = await ProofOfWorkService.generateProof(
        'login',
        publicKeyHex,
        target,
        difficulty,
        'blake3'
      )
      
      // Sign the challenge
      console.debug('Login challenge string:', challenge, 'Length:', challenge.length)
      const challengeBytes = CryptoService.base64ToBytes(challenge)
      const signature = await CryptoService.sign(keyPair.privateKey, challengeBytes)
      
      // Create login request
      const request: LoginRequest = {
        pubkey: publicKeyBase64,
        pow: {
          nonce: powResult.nonce,
          difficulty,
          target,
          hash_algorithm: 'blake3'
        },
        proof: {
          challenge,
          signature: CryptoService.bytesToBase64(signature)
        }
      }
      
      // Submit login
      const response = await apiService.login(request)
      
      // Set token first so we can make authenticated requests
      token.value = response.access_token
      sessionNonce.value = response.session_nonce
      
      console.log('🔑 Token received:', {
        tokenLength: response.access_token.length,
        tokenParts: response.access_token.split('.').length,
        sessionNonceLength: response.session_nonce.length
      })
      
      // Create basic user object
      const userObj: User = {
        user_id: CryptoService.hashHex(new Uint8Array(publicKeyBytes)),
        pubkey: publicKeyBase64,
        pubkey_hash: CryptoService.hashHex(new Uint8Array(publicKeyBytes)),
        created: false, // We don't know this for login
        tier: 'veteran', // Assume veteran for login
        accent_color: undefined
      }
      
      user.value = userObj
      
      // Fetch user profile to get display_name and accent_color
      try {
        console.log('📥 Fetching user profile after login...')
        const profileData = await apiService.getProfile()
        console.log('👤 Profile data received:', profileData)
        
        // Update user object with profile data
        if (profileData.display_name !== undefined) {
          user.value.display_name = profileData.display_name
        }
        if (profileData.accent_color !== undefined) {
          user.value.accent_color = profileData.accent_color
        }
        
        console.log('✅ User object updated with profile data')
      } catch (profileError) {
        console.warn('⚠️ Failed to fetch profile after login:', profileError)
        
        // Check if it's a 404 (endpoint not implemented yet)
        if (profileError instanceof Error && 'response' in profileError) {
          const axiosError = profileError as any
          if (axiosError.response?.status === 404) {
            console.log('ℹ️ Profile endpoint not available yet, trying to get display name from stored keypair')
            
            // Try to get display name from the stored keypair metadata
            try {
              const storedKeys = await keyStore.listKeys()
              const currentKey = storedKeys.find(k => k.isDefault)
              if (currentKey?.displayName) {
                console.log('📝 Found display name in stored keypair:', currentKey.displayName)
                user.value.display_name = currentKey.displayName
              } else {
                user.value.display_name = 'Anonymous User'
              }
            } catch (keyError) {
              console.warn('Could not get display name from stored keypair:', keyError)
              user.value.display_name = 'Anonymous User'
            }
            
            user.value.accent_color = '#0ea5e9'
          }
        }
        
        // Continue with basic user object if profile fetch fails
      }
      
      saveAuthState()
      
      return { user: user.value, token: response.access_token, sessionNonce: response.session_nonce }
    } catch (err) {
      console.error('Auth store login failed:', err)
      
      // Check if it's a 404 "User not found" error
      if (err instanceof Error && 'response' in err) {
        const axiosError = err as any
        if (axiosError.response?.status === 404 && 
            axiosError.response?.data?.detail === 'User not found') {
          error.value = 'User not found. This keypair may not be registered yet. Please try registering first.'
        } else {
          error.value = `Login failed: ${err.message}`
        }
      } else {
        error.value = `Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Import keypair and login
   */
  async function importAndLogin(keypairData: {
    publicKey: string
    privateKey: string
    userId?: string
    version?: string
    displayName?: string
    chorusVersion?: string
    chorusLabel?: string
    isChorusKey?: boolean
  }): Promise<{ user: User; token: string; sessionNonce: string }> {
    try {
      isLoading.value = true
      error.value = ''
      
      // Import the keypair
      const { keyPair } = await keyStore.importKeyPair(keypairData)
      
      // Login with the imported keypair
      return await login(keyPair)
    } catch (err) {
      console.error('Import and login failed:', err)
      
      // Check if it's a 404 "User not found" error
      if (err instanceof Error && 'response' in err) {
        const axiosError = err as any
        if (axiosError.response?.status === 404 && 
            axiosError.response?.data?.detail === 'User not found') {
          error.value = 'User not found. This keypair may not be registered yet. Please try registering first.'
        } else {
          error.value = `Import and login failed: ${err.message}`
        }
      } else {
        error.value = `Import and login failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Fetch user profile from server
   * Uses the new dedicated profile endpoint with JWT authentication
   */
  async function fetchProfile(): Promise<User> {
    try {
      isLoading.value = true
      error.value = ''
      
      if (!token.value) {
        throw new Error('No authentication token')
      }
      
      // Fetch profile from server
      const response = await apiService.getProfile()
      
      // Update local user object with server data
      if (user.value) {
        if (response.display_name !== undefined) {
          user.value.display_name = response.display_name
        }
        if (response.accent_color !== undefined) {
          user.value.accent_color = response.accent_color
        }
        
        // Save updated state
        saveAuthState()
      }
      
      return user.value!
    } catch (err) {
      error.value = `Failed to fetch profile: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Update user profile (display name, accent color, etc.)
   * Uses the new dedicated profile endpoints with JWT authentication
   */
  async function updateProfile(updates: {
    display_name?: string
    accent_color?: string
  }): Promise<User> {
    try {
      console.log('🔄 Auth store updateProfile called with:', updates)
      isLoading.value = true
      error.value = ''
      
      if (!user.value || !token.value) {
        throw new Error('No user logged in or no authentication token')
      }
      
      console.log('🔑 User and token available, sending to API...')
      
      // Send update to server using new profile endpoint
      const response = await apiService.updateProfile(updates)
      
      console.log('📥 Server response:', response)
      
      // Update local user object with server response
      if (response.display_name !== undefined) {
        user.value.display_name = response.display_name
      }
      if (response.accent_color !== undefined) {
        user.value.accent_color = response.accent_color
      }
      
      console.log('💾 Updated local user object:', {
        display_name: user.value.display_name,
        accent_color: user.value.accent_color
      })
      
      // Save updated state
      saveAuthState()
      
      return user.value
    } catch (err) {
      console.error('❌ Profile update failed:', err)
      error.value = `Profile update failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Logout
   */
  function logout() {
    clearAuthState()
  }
  
  return {
    // State
    user,
    token,
    sessionNonce,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    isFullyAuthenticated,
    
    // Actions
    loadAuthState,
    saveAuthState,
    generateKeyPair,
    getKeyPair,
    requestChallenge,
    register,
    login,
    importAndLogin,
    fetchProfile,
    updateProfile,
    logout
  }
})
