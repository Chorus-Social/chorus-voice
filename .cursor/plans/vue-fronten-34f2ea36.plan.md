<!-- 34f2ea36-5526-4277-b648-5baacd9cbfd5 1b7efa95-da64-4436-87ec-579b4ae76ea8 -->
# Vue.js Frontend for Chorus Social Network

## Project Structure

Create a Vite-based Vue 3 application with TypeScript and Tailwind CSS:

```
chorus-voice/
├── src/
│   ├── assets/          # Static assets, logos
│   ├── components/      # Vue components
│   │   ├── auth/        # Auth-related components
│   │   ├── posts/       # Post components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # Reusable UI components
│   ├── composables/     # Vue composables
│   ├── services/        # API services
│   ├── stores/          # Pinia stores
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── router/          # Vue Router config
│   ├── App.vue
│   └── main.ts
├── public/              # Public assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Core Implementation Steps

### 1. Project Initialization

- Initialize Vite project with Vue 3 + TypeScript template
- Install dependencies: vue-router, pinia, tailwindcss, @noble/ed25519, @noble/hashes
- Configure Tailwind CSS with custom Chorus theme
- Set up TypeScript strict mode

### 2. Cryptography Layer

Create `src/utils/crypto.ts`:

- Ed25519 key generation using `@noble/ed25519`
- Key storage in localStorage (encrypted with user passphrase)
- SHA-256 proof-of-work implementation using `@noble/hashes/sha256`
- BLAKE3 hashing for user IDs using `@noble/hashes/blake3`
- Signature generation and verification

### 3. API Service Layer

Create `src/services/api.ts`:

- Base API client with axios/fetch
- Authentication endpoints (challenge, register, login)
- Posts endpoints (create, list, get)
- Votes endpoints (cast, get)
- JWT token management
- Request/response interceptors

### 4. State Management (Pinia)

Create stores:

- `src/stores/auth.ts` - User authentication state, keypair management
- `src/stores/posts.ts` - Posts feed, pagination, caching
- `src/stores/ui.ts` - UI state, modals, toasts

### 5. Authentication Flow

Components:

- `WelcomeView.vue` - Landing page with register/login options
- `RegisterModal.vue` - Generate keypair, compute PoW, register
- `LoginModal.vue` - Import keypair, sign challenge, authenticate
- `KeyExport.vue` - Export/backup keypair

Flow:

1. User clicks "Register" → generate Ed25519 keypair
2. Request challenge from `/api/v1/auth/challenge`
3. Compute SHA-256 PoW (find nonce where hash has N leading zeros)
4. Sign challenge with private key
5. Submit to `/api/v1/auth/register` with PoW proof
6. Store JWT token and keypair (encrypted)

### 6. Posts Feed

Components:

- `FeedView.vue` - Main feed container
- `PostCard.vue` - Individual post display
- `PostCreate.vue` - Create new post form
- `VoteButtons.vue` - Upvote/downvote buttons

Features:

- Infinite scroll pagination using `order_index`
- Real-time updates via WebSocket (future enhancement)
- Vote score display
- Day number display (not timestamps)
- Markdown rendering for post content

### 7. Post Creation

Component: `CreatePostModal.vue`

- Markdown editor with preview
- Community selector (optional)
- PoW computation before submission
- Content hash generation
- Submit to `/api/v1/posts/` with PoW nonce

### 8. Voting System

Component: `VoteButtons.vue`

- Upvote/downvote buttons
- Current vote score display
- PoW computation for votes
- Optimistic UI updates
- Submit to `/api/v1/votes/` with PoW

### 9. Layout & Navigation

Components:

- `AppLayout.vue` - Main layout with header/sidebar
- `AppHeader.vue` - Top navigation with user menu
- `AppSidebar.vue` - Communities list, navigation links
- `UserMenu.vue` - User settings, logout, key management

### 10. UI Components

Reusable components:

- `Button.vue` - Styled button component
- `Input.vue` - Form input component
- `Modal.vue` - Modal dialog component
- `Toast.vue` - Notification toast component
- `LoadingSpinner.vue` - Loading indicator
- `Avatar.vue` - User avatar (generated from pubkey hash)

## Key Technical Details

### API Integration

Base URL: Configurable via environment variable

```typescript
const API_BASE_URL = import.meta.env.VITE_STAGE_URL || 'http://localhost:8000'
```

### Authentication Headers

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Proof of Work

SHA-256 based PoW for rate limiting:

```typescript
function computePoW(challenge: string, difficulty: number): string {
  let nonce = 0
  while (true) {
    const hash = sha256(`${challenge}:${nonce}`)
    if (countLeadingZeros(hash) >= difficulty) return nonce.toString()
    nonce++
  }
}
```

### Key Storage

Store encrypted keypair in localStorage:

```typescript
localStorage.setItem('chorus_keypair', encryptedKeypair)
localStorage.setItem('chorus_pubkey_hash', blake3Hash)
```

### TypeScript Types

Based on OpenAPI schema:

- `ChallengeResponse`
- `RegisterRequest` / `RegisterResponse`
- `LoginRequest` / `LoginResponse`
- `PostCreate` / `PostResponse`
- `VoteCreate`

## Styling with Tailwind

Custom theme configuration:

- Primary color: Purple/blue gradient (Chorus brand)
- Dark mode support
- Responsive design (mobile-first)
- Smooth animations and transitions

## Privacy Considerations

1. **No Timestamps**: Display day numbers only ("Day 1234" or "3 days ago")
2. **No Telemetry**: No analytics, tracking, or external requests
3. **Local Key Storage**: Keys never leave the device
4. **E2E Encryption Ready**: Infrastructure for DMs (future feature)

## Development Workflow

1. Run development server: `npm run dev`
2. Build for production: `npm run build`
3. Preview production build: `npm run preview`
4. Type checking: `npm run type-check`
5. Linting: `npm run lint`

### To-dos

- [ ] Initialize Vite project with Vue 3, TypeScript, and install dependencies
- [ ] Configure Tailwind CSS with custom Chorus theme and dark mode
- [ ] Implement cryptography utilities (Ed25519, SHA-256 PoW, BLAKE3)
- [ ] Create TypeScript types from OpenAPI schema
- [ ] Build API service layer with authentication and posts endpoints
- [ ] Create Pinia stores for auth, posts, and UI state
- [ ] Configure Vue Router with routes and navigation guards
- [ ] Build authentication components (Welcome, Register, Login)
- [ ] Create layout components (AppLayout, Header, Sidebar)
- [ ] Build reusable UI components (Button, Input, Modal, Toast)
- [ ] Create post-related components (Feed, PostCard, CreatePost, VoteButtons)
- [ ] Integrate all components and test end-to-end flow