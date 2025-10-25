// Post and content types

export interface Post {
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

export interface PostWithVotes extends Post {
  vote_score: number
  user_vote?: 1 | -1 | null
}

export interface CreatePostData {
  content_md: string
  community_internal_slug?: string
  parent_post_id?: number
}

export interface PostFilters {
  community_slug?: string
  limit?: number
  before?: number
}

export interface Community {
  id: number
  internal_slug: string
  display_name: string
  description_md?: string | null
  is_profile_like: boolean
  order_index: number
}

export interface Vote {
  post_id: number
  direction: 1 | -1
  created_at: number
}
