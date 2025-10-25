import { CryptoService } from './crypto'
import type { KeyPair, StoredKey } from '@/types/auth'

/**
 * Secure key storage using IndexedDB and SubtleCrypto
 * Keys are stored as non-extractable CryptoKey objects
 */
export class KeyStore {
  private dbName = 'chorus-keystore'
  private dbVersion = 1
  private storeName = 'keys'
  
  // Chorus-specific constants
  private readonly CHORUS_LABEL = 'Chorus-Voice-Keypair'
  private readonly CHORUS_VERSION = '1.0.0'
  
  constructor() {
    // Initialize migration on first load
    this.initializeAndMigrate().catch(console.error)
  }

  /**
   * Initialize and migrate keypairs
   */
  private async initializeAndMigrate(): Promise<void> {
    try {
      // First, ensure the database is initialized
      await this.initDB()
      // Then run migration
      await this.migrateKeypairs()
    } catch (error) {
      console.error('Failed to initialize and migrate keypairs:', error)
    }
  }
  
  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'keyId' })
        }
      }
    })
  }
  
  /**
   * Generate and store a new keypair
   */
  async generateAndStoreKey(
    keyId?: string, 
    setAsDefault: boolean = true, 
    displayName?: string,
    userId?: string
  ): Promise<{ keyId: string; keyPair: KeyPair }> {
    const keyPair = await CryptoService.generateKeyPair()
    const id = keyId || `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // First, unset all existing keys as default if we're setting this one as default
    if (setAsDefault) {
      const allKeys = await this.listKeys()
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      for (const key of allKeys) {
        key.isDefault = false
        await new Promise<void>((resolve, reject) => {
          const request = store.put(key)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
    }
    
    const db = await this.initDB()
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    // Store metadata (no private key material)
    const storedKey: StoredKey = {
      keyId: id,
      publicKeyBytes: keyPair.publicKeyBytes,
      createdAt: Date.now(),
      isDefault: setAsDefault,
      displayName: displayName || `Key ${id.slice(-6)}`,
      userId,
      // Chorus-specific metadata
      chorusVersion: this.CHORUS_VERSION,
      chorusLabel: this.CHORUS_LABEL,
      isChorusKey: true
    }
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(storedKey)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    // Store the actual keypair in memory (will be lost on page refresh)
    // In a real implementation, you'd want to encrypt and store the private key
    // For now, we'll store it in sessionStorage as a temporary measure
    const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey)
    const privateKeyBytes = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    
    sessionStorage.setItem(`keypair_${id}`, JSON.stringify({
      publicKeyBytes: Array.from(new Uint8Array(publicKeyBytes)),
      privateKeyBytes: Array.from(new Uint8Array(privateKeyBytes)),
      // Chorus metadata
      chorusVersion: this.CHORUS_VERSION,
      chorusLabel: this.CHORUS_LABEL,
      isChorusKey: true
    }))
    
    return { keyId: id, keyPair }
  }
  
  /**
   * Get a stored keypair by ID
   */
  async getKeyPair(keyId: string): Promise<KeyPair | null> {
    try {
      const stored = sessionStorage.getItem(`keypair_${keyId}`)
      if (!stored) return null
      
      const data = JSON.parse(stored)
      
      // Validate Chorus metadata
      if (!data.isChorusKey || 
          data.chorusLabel !== this.CHORUS_LABEL ||
          (data.chorusVersion && data.chorusVersion !== this.CHORUS_VERSION)) {
        console.warn('Invalid keypair: Missing or invalid Chorus metadata')
        
        // Try to migrate this keypair if it's missing metadata
        try {
          await this.migrateKeypairs()
          // Retry after migration
          const retryData = JSON.parse(sessionStorage.getItem(`keypair_${keyId}`) || '{}')
          if (retryData.isChorusKey && retryData.chorusLabel === this.CHORUS_LABEL) {
            console.log('✅ Keypair migrated successfully, retrying...')
            // Continue with the migrated data
            data.isChorusKey = retryData.isChorusKey
            data.chorusLabel = retryData.chorusLabel
            data.chorusVersion = retryData.chorusVersion
          } else {
            return null
          }
        } catch (migrationError) {
          console.error('Migration failed:', migrationError)
          return null
        }
      }
      
      const publicKeyBytes = new Uint8Array(data.publicKeyBytes)
      const privateKeyBytes = new Uint8Array(data.privateKeyBytes)
      
      // Recreate the CryptoKey objects with extractable=true
      const publicKey = await crypto.subtle.importKey(
        'raw',
        publicKeyBytes,
        { name: 'Ed25519' },
        true, // extractable=true
        ['verify']
      )
      
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBytes,
        { name: 'Ed25519' },
        true, // extractable=true
        ['sign']
      )
      
      return {
        publicKey,
        privateKey,
        publicKeyBytes
      }
    } catch (error) {
      console.error('Failed to get keypair:', error)
      return null
    }
  }
  
  /**
   * List all stored keys
   */
  async listKeys(): Promise<StoredKey[]> {
    const db = await this.initDB()
    const transaction = db.transaction([this.storeName], 'readonly')
    const store = transaction.objectStore(this.storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  /**
   * Delete a key
   */
  async deleteKey(keyId: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(keyId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    // Also remove from sessionStorage
    sessionStorage.removeItem(`keypair_${keyId}`)
  }
  
  /**
   * Set default key
   */
  async setDefaultKey(keyId: string): Promise<void> {
    const db = await this.initDB()
    
    // First get all keys
    const allKeys = await this.listKeys()
    
    // Then use a single transaction to update all keys
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    // Unset all other keys as default
    for (const key of allKeys) {
      if (key.keyId !== keyId) {
        key.isDefault = false
        await new Promise<void>((resolve, reject) => {
          const request = store.put(key)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
    }
    
    // Set the new default
    const key = allKeys.find(k => k.keyId === keyId)
    if (key) {
      key.isDefault = true
      await new Promise<void>((resolve, reject) => {
        const request = store.put(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }
  
  /**
   * Get the default key
   */
  async getDefaultKey(): Promise<StoredKey | null> {
    const keys = await this.listKeys()
    return keys.find(k => k.isDefault) || null
  }
  
  /**
   * Import a keypair from external data (e.g., downloaded JSON)
   */
  async importKeyPair(
    keypairData: {
      publicKey: string
      privateKey: string
      userId?: string
      version?: string
      displayName?: string
      chorusVersion?: string
      chorusLabel?: string
      isChorusKey?: boolean
    }, 
    keyId?: string, 
    setAsDefault: boolean = true
  ): Promise<{ keyId: string; keyPair: KeyPair }> {
    try {
      // Validate the keypair data
      if (!keypairData.publicKey || !keypairData.privateKey) {
        throw new Error('Invalid keypair data: missing publicKey or privateKey')
      }
      
      // Validate Chorus-specific metadata
      if (!keypairData.isChorusKey || 
          keypairData.chorusLabel !== this.CHORUS_LABEL ||
          (keypairData.chorusVersion && keypairData.chorusVersion !== this.CHORUS_VERSION)) {
        throw new Error('Invalid keypair: This is not a Chorus Voice keypair. Only Chorus-compatible keypairs can be imported.')
      }
      
      // Convert base64 strings to Uint8Arrays
      const publicKeyBytes = CryptoService.base64ToBytes(keypairData.publicKey)
      const privateKeyBytes = CryptoService.base64ToBytes(keypairData.privateKey)
      
      // Import the keys using SubtleCrypto
      const publicKey = await crypto.subtle.importKey(
        'raw',
        publicKeyBytes.buffer as ArrayBuffer,
        { name: 'Ed25519' },
        true, // extractable=true
        ['verify']
      )
      
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBytes.buffer as ArrayBuffer,
        { name: 'Ed25519' },
        true, // extractable=true
        ['sign']
      )
      
      // Create the keypair object
      const keyPair: KeyPair = {
        publicKey,
        privateKey,
        publicKeyBytes
      }
      
      // Generate a key ID if not provided
      const id = keyId || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // First, unset all existing keys as default if we're setting this one as default
      if (setAsDefault) {
        const allKeys = await this.listKeys()
        const db = await this.initDB()
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        
        for (const key of allKeys) {
          key.isDefault = false
          await new Promise<void>((resolve, reject) => {
            const request = store.put(key)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }
      
      // Store metadata in IndexedDB
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const storedKey: StoredKey = {
        keyId: id,
        publicKeyBytes,
        createdAt: Date.now(),
        isDefault: setAsDefault,
        displayName: keypairData.displayName || `Imported Key ${id.slice(-6)}`,
        userId: keypairData.userId,
        // Chorus-specific metadata
        chorusVersion: keypairData.chorusVersion || this.CHORUS_VERSION,
        chorusLabel: keypairData.chorusLabel || this.CHORUS_LABEL,
        isChorusKey: true
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(storedKey)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      
      // Store the actual keypair in sessionStorage
      sessionStorage.setItem(`keypair_${id}`, JSON.stringify({
        publicKeyBytes: Array.from(publicKeyBytes),
        privateKeyBytes: Array.from(privateKeyBytes),
        // Chorus metadata
        chorusVersion: keypairData.chorusVersion || this.CHORUS_VERSION,
        chorusLabel: keypairData.chorusLabel || this.CHORUS_LABEL,
        isChorusKey: true
      }))
      
      return { keyId: id, keyPair }
    } catch (error) {
      console.error('Failed to import keypair:', error)
      throw new Error(`Failed to import keypair: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update keypair display name
   */
  async updateKeyDisplayName(keyId: string, displayName: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    const key = await this.getKeyById(keyId)
    if (!key) {
      throw new Error('Key not found')
    }
    
    key.displayName = displayName
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get key by ID
   */
  async getKeyById(keyId: string): Promise<StoredKey | null> {
    const keys = await this.listKeys()
    return keys.find(k => k.keyId === keyId) || null
  }

  /**
   * Migrate existing keypairs to include Chorus metadata
   */
  async migrateKeypairs(): Promise<void> {
    try {
      const keys = await this.listKeys()
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      for (const key of keys) {
        // Check if key needs migration
        if (!key.isChorusKey || !key.chorusLabel || !key.chorusVersion) {
          console.log('🔄 Migrating keypair:', key.keyId)
          
          // Add Chorus metadata
          key.chorusVersion = this.CHORUS_VERSION
          key.chorusLabel = this.CHORUS_LABEL
          key.isChorusKey = true
          
          // Update in database
          await new Promise<void>((resolve, reject) => {
            const request = store.put(key)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
        
        // Also migrate sessionStorage if it exists
        const sessionData = sessionStorage.getItem(`keypair_${key.keyId}`)
        if (sessionData) {
          try {
            const data = JSON.parse(sessionData)
            if (!data.isChorusKey || !data.chorusLabel || !data.chorusVersion) {
              console.log('🔄 Migrating sessionStorage for keypair:', key.keyId)
              data.chorusVersion = this.CHORUS_VERSION
              data.chorusLabel = this.CHORUS_LABEL
              data.isChorusKey = true
              sessionStorage.setItem(`keypair_${key.keyId}`, JSON.stringify(data))
            }
          } catch (parseError) {
            console.warn('Failed to parse sessionStorage for keypair:', key.keyId, parseError)
          }
        }
      }
      
      console.log('✅ Keypair migration completed')
    } catch (error) {
      console.error('❌ Keypair migration failed:', error)
    }
  }
}
