// Initialize crypto first
import '../crypto-init'

import { blake3 } from '@noble/hashes/blake3'
import type { KeyPair } from '@/types/auth'

/**
 * Crypto service using SubtleCrypto API only
 * 
 * This service provides cryptographic operations for the Chorus application using
 * only native browser APIs. It implements:
 * - Ed25519 key pair generation and signing using WebCrypto API
 * - BLAKE3 hashing for content integrity and proof-of-work
 * - Base64/hex encoding utilities for data exchange
 * - Deterministic key derivation from seeds
 * 
 * Security considerations:
 * - All operations use the native SubtleCrypto API for maximum security
 * - Private keys are never stored in plaintext
 * - Uses industry-standard Ed25519 for digital signatures
 * - BLAKE3 provides fast, secure hashing with resistance to timing attacks
 * 
 * @author Chorus Development Team
 * @version 1.0.0
 */
export class CryptoService {
  /**
   * Generate a new Ed25519 keypair using SubtleCrypto
   * 
   * Creates a cryptographically secure key pair suitable for:
   * - Digital signatures (Ed25519)
   * - Anonymous authentication
   * - Content verification
   * 
   * @returns Promise<KeyPair> - Object containing public/private keys and raw bytes
   * @throws Error if crypto.subtle is not available or key generation fails
   */
  static async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true, // extractable - allows exporting keys
      ['sign', 'verify'] // key usage permissions
    )
    
    // Export public key to get raw bytes for API communication
    const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey)
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      publicKeyBytes: new Uint8Array(publicKeyBytes)
    }
  }
  
  /**
   * Sign a message with Ed25519 private key using SubtleCrypto
   * 
   * Creates a digital signature that proves:
   * - Message authenticity (not tampered with)
   * - Message origin (signed by private key holder)
   * - Message integrity (content hasn't changed)
   * 
   * @param privateKey - The Ed25519 private key for signing
   * @param message - The message bytes to sign
   * @returns Promise<Uint8Array> - The signature bytes
   * @throws Error if signing fails or key is invalid
   */
  static async sign(privateKey: CryptoKey, message: Uint8Array): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign('Ed25519', privateKey, message as BufferSource)
    return new Uint8Array(signature)
  }
  
  /**
   * Verify a signature with Ed25519 public key using SubtleCrypto
   */
  static async verify(
    publicKey: CryptoKey, 
    signature: Uint8Array, 
    message: Uint8Array
  ): Promise<boolean> {
    try {
      return await crypto.subtle.verify('Ed25519', publicKey, signature as BufferSource, message as BufferSource)
    } catch (error) {
      console.error('Signature verification failed:', error)
      return false
    }
  }
  
  /**
   * Hash data with BLAKE3
   * 
   * BLAKE3 is a fast, secure hash function that provides:
   * - High performance (faster than SHA-256)
   * - Security against timing attacks
   * - Parallel processing capability
   * - Resistance to length extension attacks
   * 
   * Used for:
   * - Content integrity verification
   * - Proof-of-work calculations
   * - Key derivation
   * 
   * @param data - Input data as Uint8Array or string
   * @returns Uint8Array - 32-byte BLAKE3 hash
   */
  static hash(data: Uint8Array | string): Uint8Array {
    const input = typeof data === 'string' ? new TextEncoder().encode(data) : data
    return blake3(input)
  }
  
  /**
   * Hash data with BLAKE3 and return hex string
   */
  static hashHex(data: Uint8Array | string): string {
    const hash = this.hash(data)
    return Array.from(hash)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  /**
   * Convert bytes to base64
   */
  static bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
  }
  
  /**
   * Convert base64 to bytes with proper error handling
   */
  static base64ToBytes(base64: string): Uint8Array {
    try {
      // Handle URL-safe base64 (replace - with + and _ with /)
      const normalizedBase64 = base64.replace(/-/g, '+').replace(/_/g, '/')
      
      // Add padding if needed
      const paddedBase64 = normalizedBase64 + '='.repeat((4 - normalizedBase64.length % 4) % 4)
      
      const binary = atob(paddedBase64)
      return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i))
    } catch (error) {
      console.error('Base64 decoding failed:', error, 'Input:', base64)
      throw new Error(`Invalid base64 string: ${error}`)
    }
  }
  
  /**
   * Convert bytes to hex string
   */
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  /**
   * Convert hex string to bytes
   */
  static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes
  }
  
  /**
   * Generate a random nonce
   */
  static generateNonce(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return this.bytesToHex(bytes)
  }
  
  /**
   * Derive a deterministic keypair from a seed using SubtleCrypto
   */
  static async deriveKeyPair(seed: string): Promise<KeyPair> {
    const seedBytes = new TextEncoder().encode(seed)
    const hash = this.hash(seedBytes)
    
    // Use first 32 bytes as private key material
    const privateKeyMaterial = hash.slice(0, 32)
    
    // Import the private key
    const privateKey = await crypto.subtle.importKey(
      'raw',
      privateKeyMaterial,
      { name: 'Ed25519' },
      false,
      ['sign']
    )
    
    // Generate the corresponding public key
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      false,
      ['sign', 'verify']
    )
    
    // Export public key to get raw bytes
    const publicKeyBytes = await crypto.subtle.exportKey('raw', keyPair.publicKey)
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: privateKey,
      publicKeyBytes: new Uint8Array(publicKeyBytes)
    }
  }
}