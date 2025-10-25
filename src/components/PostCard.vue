<template>
  <article class="card">
    <!-- Post Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span class="text-xs font-medium text-gray-600">
            {{ authorInitials }}
          </span>
        </div>
        <div>
          <div class="text-sm font-medium text-gray-900">
            {{ authorDisplay }}
          </div>
          <div class="text-xs text-gray-500">
            Post #{{ post.id }}
          </div>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          v-if="canDelete"
          @click="handleDelete"
          class="text-gray-400 hover:text-red-500 p-1"
          title="Delete post"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Post Content -->
    <div class="prose prose-sm max-w-none mb-4">
      <div v-html="renderedContent"></div>
    </div>

    <!-- Post Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200">
      <div class="flex items-center space-x-4">
        <!-- Vote Buttons -->
        <button
          @click="handleVote(1)"
          :disabled="isVoting"
          class="flex items-center space-x-1 text-gray-500 hover:text-green-600 disabled:opacity-50"
          :class="{ 'text-green-600': userVote === 1 }"
        >
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm">{{ post.upvotes || 0 }}</span>
        </button>
        
        <button
          @click="handleVote(-1)"
          :disabled="isVoting"
          class="flex items-center space-x-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
          :class="{ 'text-red-600': userVote === -1 }"
        >
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm">{{ post.downvotes || 0 }}</span>
        </button>
        
        <!-- Reply Button -->
        <button
          @click="handleReply"
          class="flex items-center space-x-1 text-gray-500 hover:text-chorus-600"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span class="text-sm">Reply</span>
        </button>
      </div>
      
      <div class="text-xs text-gray-500">
        #{{ post.id }}
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { PostWithVotes } from '@/types/post'

interface Props {
  post: PostWithVotes
}

const props = defineProps<Props>()

const emit = defineEmits<{
  vote: [postId: number, direction: 1 | -1]
  delete: [postId: number]
  reply: [postId: number]
}>()

const isVoting = ref(false)

const authorDisplay = computed(() => {
  // Show truncated pubkey hash for anonymity
  const pubkey = props.post.author_pubkey
  return pubkey ? `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}` : 'Anonymous'
})

const authorInitials = computed(() => {
  return authorDisplay.value.slice(0, 2).toUpperCase()
})

const renderedContent = computed(() => {
  if (!props.post.body_md) return ''
  
  // Render markdown and sanitize HTML
  // Using DOMPurify to prevent XSS attacks
  const html = marked(props.post.body_md)
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: []
  })
})

const userVote = computed(() => props.post.user_vote || null)

const canDelete = computed(() => {
  // TODO: Check if current user is the author
  return false
})

async function handleVote(direction: 1 | -1) {
  if (isVoting.value) return
  
  isVoting.value = true
  try {
    emit('vote', props.post.id, direction)
  } finally {
    isVoting.value = false
  }
}

function handleDelete() {
  if (confirm('Are you sure you want to delete this post?')) {
    emit('delete', props.post.id)
  }
}

function handleReply() {
  emit('reply', props.post.id)
}
</script>
