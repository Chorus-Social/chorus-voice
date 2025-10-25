# Chorus Frontend - Installation Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd /Users/hailey/Documents/Ventures/Chorus/chorus-voice
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to `http://localhost:3000`

## What's Included

### ✅ Complete Vue.js Frontend
- **Vue 3** with Composition API and TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **Pinia** for state management
- **Vue Router** for navigation

### ✅ Security-First Architecture
- **Ed25519** cryptography for user authentication
- **BLAKE3** hashing for content integrity
- **Proof-of-Work** generation for spam prevention
- **Secure key storage** using browser APIs
- **No personal data collection**

### ✅ Core Features
- **Server Connection**: Connect to any Chorus Stage server
- **Anonymous Authentication**: Create/login with cryptographic identities
- **Post Feed**: View posts with pagination and filtering
- **Post Creation**: Rich markdown editor with live preview
- **Community Support**: Post to different communities
- **Responsive Design**: Works on desktop and mobile

### ✅ API Integration
- Complete integration with Chorus Stage API
- TypeScript types generated from OpenAPI spec
- JWT authentication with automatic token management
- Error handling and loading states

## File Structure

```
chorus-frontend/
├── src/
│   ├── assets/          # Branding assets (copied from Branding/)
│   ├── components/      # Vue components
│   │   ├── PostCard.vue
│   │   ├── LoadingSpinner.vue
│   │   └── Toast.vue
│   ├── composables/     # Composition API utilities
│   │   └── useToast.ts
│   ├── services/        # API and crypto services
│   │   ├── api.ts       # HTTP client
│   │   ├── crypto.ts    # Ed25519 & BLAKE3
│   │   ├── keystore.ts  # Secure key storage
│   │   └── pow.ts       # Proof-of-work
│   ├── stores/          # Pinia state management
│   │   ├── auth.ts      # Authentication
│   │   ├── config.ts    # Server config
│   │   └── posts.ts     # Posts & communities
│   ├── types/           # TypeScript interfaces
│   │   ├── api.ts       # API types
│   │   ├── auth.ts      # Auth types
│   │   └── post.ts      # Post types
│   ├── views/           # Page components
│   │   ├── ServerConnect.vue
│   │   ├── Auth.vue
│   │   ├── Feed.vue
│   │   └── CreatePost.vue
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Key Features Implemented

### 🔐 Authentication System
- **Challenge-Response**: Secure authentication using Ed25519 signatures
- **Proof-of-Work**: Client-side PoW generation to prevent spam
- **Key Management**: Secure storage using browser Crypto API
- **Anonymous Identities**: No usernames or personal information required

### 📝 Post Management
- **Markdown Editor**: Rich text editing with live preview
- **Content Hashing**: BLAKE3 hashing for integrity verification
- **Community Filtering**: Post to specific communities
- **Pagination**: Efficient loading of large post feeds

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Loading States**: Proper feedback during async operations
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Non-intrusive status updates

### 🔒 Privacy Features
- **No Timestamps**: Displays day numbers instead of real time
- **Anonymous Authors**: Shows truncated public key hashes
- **Local Storage**: Private keys never leave the device
- **Content Verification**: All content is cryptographically verified

## Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Next Steps

1. **Install Dependencies**: Run `npm install` to install all required packages
2. **Start Development**: Run `npm run dev` to start the development server
3. **Connect to Stage**: Enter your Chorus Stage server URL (e.g., `localhost:8000`)
4. **Create Identity**: Generate a new anonymous identity
5. **Start Posting**: Create your first post in the Chorus network!

## Troubleshooting

### Common Issues

1. **Module not found errors**: Run `npm install` to ensure all dependencies are installed
2. **TypeScript errors**: Run `npm run type-check` to see detailed type errors
3. **Connection issues**: Ensure your Chorus Stage server is running and accessible
4. **Crypto errors**: Make sure you're using a modern browser with Web Crypto API support

### Browser Requirements

- **Chrome/Edge**: 60+ (recommended)
- **Firefox**: 55+
- **Safari**: 11+
- **Mobile**: iOS 11+ / Android 7+

## Security Notes

- Private keys are generated and stored locally
- No personal information is collected or transmitted
- All content is cryptographically signed and verified
- The system respects Chorus's privacy-first principles

---

**Ready to build the future of social networking?** 🚀
