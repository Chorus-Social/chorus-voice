// Authentication types

export interface User {
  user_id: string
  pubkey: string
  pubkey_hash: string
  created: boolean
  tier: 'new' | 'veteran'
  display_name?: string
  accent_color?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  sessionNonce: string | null
}

export interface KeyPair {
  publicKey: CryptoKey
  privateKey: CryptoKey
  publicKeyBytes: Uint8Array
}

export interface StoredKey {
  keyId: string
  publicKeyBytes: Uint8Array
  createdAt: number
  isDefault: boolean
  displayName?: string
  userId?: string
  // Chorus-specific metadata
  chorusVersion: string
  chorusLabel: string
  isChorusKey: boolean
}
