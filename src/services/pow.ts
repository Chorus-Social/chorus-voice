import { CryptoService } from './crypto'

/**
 * Proof of Work service for Chorus authentication
 * Implements the correct three-step BLAKE3-based PoW algorithm
 */
export class ProofOfWorkService {
  /**
   * Generate proof of work using the correct three-step algorithm
   */
  static async generateProof(
    action: string,
    pubkeyHex: string,
    target: string,
    difficulty: number,
    hashAlgorithm: 'blake3' | 'sha256' = 'blake3'
  ): Promise<{ nonce: string; hash: string }> {
    const startTime = Date.now()
    let nonce = 0
    let hash: Uint8Array
    
    // Step 1: Compute payload digest
    const combinedPayload = `${action}:${pubkeyHex}:${target}`
    const payloadBytes = new TextEncoder().encode(combinedPayload)
    const payloadDigest = CryptoService.hash(payloadBytes)
    
    // Convert target hex to bytes
    const saltBytes = CryptoService.hexToBytes(target)
    
    while (true) {
      // Step 2: Construct final input
      const nonceBytes = new Uint8Array(8)
      const view = new DataView(nonceBytes.buffer)
      view.setBigUint64(0, BigInt(nonce), true) // little-endian
      
      // Concatenate: salt + payload_digest + nonce
      const inputBytes = new Uint8Array(
        saltBytes.length + payloadDigest.length + 8
      )
      inputBytes.set(saltBytes, 0)
      inputBytes.set(payloadDigest, saltBytes.length)
      inputBytes.set(nonceBytes, saltBytes.length + payloadDigest.length)
      
      // Step 3: Hash and check leading zero bits
      if (hashAlgorithm === 'blake3') {
        hash = CryptoService.hash(inputBytes)
      } else {
        // SHA256 fallback
        const hashBuffer = await crypto.subtle.digest('SHA-256', inputBytes)
        hash = new Uint8Array(hashBuffer)
      }
      
      // Check if we've found a valid proof
      if (this.countLeadingZeroBits(hash) >= difficulty) {
        const elapsed = Date.now() - startTime
        console.log(`PoW completed in ${elapsed}ms with nonce ${nonce}`)
        
        return {
          nonce: nonce.toString(16),
          hash: CryptoService.bytesToHex(hash)
        }
      }
      
      nonce++
      
      // Prevent infinite loops (safety check)
      if (nonce > 10000000) {
        throw new Error('Proof of work timeout - difficulty too high')
      }
    }
  }
  
  /**
   * Count leading zero bits in a hash
   */
  private static countLeadingZeroBits(hashBytes: Uint8Array): number {
    let zeros = 0
    for (const byte of hashBytes) {
      if (byte === 0) {
        zeros += 8
        continue
      }
      // Count bits in first non-zero byte
      for (let bit = 7; bit >= 0; bit--) {
        if (((byte >> bit) & 1) === 0) {
          zeros++
        } else {
          return zeros // Stop at first 1 bit
        }
      }
      break
    }
    return zeros
  }
  
  /**
   * Verify a proof of work using the correct three-step algorithm
   */
  static async verifyProof(
    action: string,
    pubkeyHex: string,
    target: string,
    nonce: string,
    difficulty: number,
    hashAlgorithm: 'blake3' | 'sha256' = 'blake3'
  ): Promise<boolean> {
    // Step 1: Compute payload digest
    const combinedPayload = `${action}:${pubkeyHex}:${target}`
    const payloadBytes = new TextEncoder().encode(combinedPayload)
    const payloadDigest = CryptoService.hash(payloadBytes)
    
    // Convert target hex to bytes
    const saltBytes = CryptoService.hexToBytes(target)
    
    // Step 2: Construct final input
    const nonceBytes = new Uint8Array(8)
    const view = new DataView(nonceBytes.buffer)
    view.setBigUint64(0, BigInt(nonce), true) // little-endian
    
    // Concatenate: salt + payload_digest + nonce
    const inputBytes = new Uint8Array(
      saltBytes.length + payloadDigest.length + 8
    )
    inputBytes.set(saltBytes, 0)
    inputBytes.set(payloadDigest, saltBytes.length)
    inputBytes.set(nonceBytes, saltBytes.length + payloadDigest.length)
    
    // Step 3: Hash and check leading zero bits
    let hash: Uint8Array
    if (hashAlgorithm === 'blake3') {
      hash = CryptoService.hash(inputBytes)
    } else {
      const hashBuffer = await crypto.subtle.digest('SHA-256', inputBytes)
      hash = new Uint8Array(hashBuffer)
    }
    
    return this.countLeadingZeroBits(hash) >= difficulty
  }
  
  /**
   * Estimate proof of work time for a given difficulty
   */
  static estimateTime(difficulty: number): number {
    // Rough estimation: each difficulty level doubles the time
    // This is a simplified model
    const baseTime = 100 // ms for difficulty 1
    return baseTime * Math.pow(2, difficulty - 1)
  }
  
  /**
   * Test proof of work generation and verification
   */
  static async testProofOfWork(): Promise<boolean> {
    const action = 'register'
    const pubkeyHex = '708c285c0d6ed7a17ff220691202bac11d6dbbea76aa7433c8dcde7d836db329'
    const target = '38f38cf308f8cafc78943a21275a633f'
    const difficulty = 4 // Low difficulty for testing
    
    try {
      console.log('Testing PoW with:', { action, pubkeyHex, target, difficulty })
      
      // Generate proof
      const result = await this.generateProof(action, pubkeyHex, target, difficulty, 'blake3')
      console.log('Generated PoW:', result)
      
      // Verify proof
      const isValid = await this.verifyProof(action, pubkeyHex, target, result.nonce, difficulty, 'blake3')
      console.log('Verification result:', isValid)
      
      return isValid
    } catch (error) {
      console.error('PoW test failed:', error)
      return false
    }
  }
}