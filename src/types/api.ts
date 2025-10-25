// API Types based on OpenAPI specification

export interface ChallengeRequest {
  pubkey: string
  intent: 'register' | 'login'
}

export interface ChallengeResponse {
  pow_target: string
  pow_difficulty: number
  signature_challenge: string
}

export interface PowEnvelope {
  nonce: string
  difficulty: number
  target: string
  hash_algorithm?: string
}

export interface SignatureProof {
  challenge: string
  signature: string
}

export interface RegisterRequest {
  pubkey: string
  display_name?: string | null
  accent_color?: string | null
  pow: PowEnvelope
  proof: SignatureProof
}

export interface RegisterResponse {
  user_id: string
  created: boolean
}

export interface LoginRequest {
  pubkey: string
  pow: PowEnvelope
  proof: SignatureProof
}

export interface LoginResponse {
  access_token: string
  token_type: string
  session_nonce: string
}

export interface PostCreate {
  content_md: string
  parent_post_id?: number | null
  community_internal_slug?: string | null
  pow_nonce: string
  pow_difficulty: number
  pow_hash_algorithm?: string
  content_hash: string
}

export interface PostResponse {
  id: number
  order_index: number
  author_user_id?: string | null
  author_pubkey: string
  parent_post_id?: number | null
  community_id?: number | null
  body_md: string
  content_hash: string
  moderation_state: number
  harmful_vote_count: number
  upvotes: number
  downvotes: number
  deleted: boolean
  federation_post_id?: string | null
  federation_origin?: string | null
}

export interface VoteCreate {
  post_id: number
  direction: 1 | -1
  pow_nonce: string
  client_nonce: string
  hash_algorithm?: string
}

export interface CommunityCreate {
  internal_slug: string
  display_name: string
  description_md?: string | null
}

export interface CommunityResponse {
  id: number
  internal_slug: string
  display_name: string
  description_md?: string | null
  is_profile_like: boolean
  order_index: number
}

export interface DirectMessageCreate {
  ciphertext: string
  recipient_pubkey_hex: string
  header_blob?: string | null
  pow_nonce: string
  hash_algorithm?: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

// API Error types
export interface APIError {
  error: string
  message: string
  details?: Record<string, any>
}

// Pagination types
export interface PaginationParams {
  limit?: number
  before?: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  next_cursor?: {
    day: number
    order: number
  }
}
