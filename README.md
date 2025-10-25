# Chorus Frontend

A modern Vue.js frontend for the Chorus social network - a privacy-first, decentralized social platform.

## Features

- **Privacy-First Design**: Anonymous identities using Ed25519 cryptography
- **Secure Authentication**: Challenge-response authentication with proof-of-work
- **Modern UI**: Built with Vue 3, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: WebSocket support for live feed updates
- **Markdown Support**: Rich text editing with markdown preview
- **Community Features**: Post to different communities, voting, moderation

## Technology Stack

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Pinia** for state management
- **Vue Router** for navigation
- **SubtleCrypto API** for native Ed25519 cryptography
- **@noble/hashes** for BLAKE3 hashing
- **Axios** for HTTP requests
- **Marked** for markdown rendering
- **DOMPurify** for HTML sanitization

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A running Chorus Stage server

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chorus-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Connecting to a Stage Server

1. Enter your Chorus Stage server URL (e.g., `localhost:8000` or `https://stage.example.com`)
2. Click "Test Connection" to verify the server is reachable
3. Click "Continue" to proceed to authentication

### Creating an Identity

1. Choose "Create New Identity" to generate a new Ed25519 keypair
2. Optionally set a display name and accent color
3. The system will generate proof-of-work and register your identity
4. Your private key is stored securely in the browser

### Posting Content

1. Click "New Post" to create a post
2. Select a community (optional)
3. Write your content in markdown
4. The system will generate proof-of-work and submit your post

## Security Features

- **Local Key Storage**: Private keys never leave your device
- **Proof of Work**: Prevents spam and ensures network security
- **Content Hashing**: All content is hashed for integrity verification
- **Anonymous Identities**: No personal information is required
- **Secure Communication**: All API requests use HTTPS and JWT authentication

## Development

### Project Structure

```
src/
├── assets/          # Static assets and branding
├── components/      # Reusable Vue components
├── composables/     # Composition API utilities
├── services/        # API and crypto services
├── stores/          # Pinia state management
├── types/           # TypeScript interfaces
├── views/           # Page components
├── router/          # Vue Router configuration
├── App.vue
└── main.ts
```

### Key Services

- **CryptoService**: Ed25519 and BLAKE3 operations
- **KeyStore**: Secure key storage using IndexedDB
- **ProofOfWorkService**: Proof-of-work generation
- **APIService**: HTTP client for Stage server communication

### State Management

- **ConfigStore**: Server connection and configuration
- **AuthStore**: Authentication state and user management
- **PostsStore**: Posts, communities, and feed data

## API Integration

The frontend integrates with the Chorus Stage API:

- **Authentication**: `/api/v1/auth/challenge`, `/api/v1/auth/register`, `/api/v1/auth/login`
- **Posts**: `/api/v1/posts/` (GET, POST), `/api/v1/posts/{id}` (GET, DELETE)
- **Communities**: `/api/v1/communities/` (GET, POST)
- **Votes**: `/api/v1/votes/` (POST)
- **System**: `/health`, `/api/v1/system/status`

## Privacy Considerations

- No real-world timestamps are displayed or stored
- User identities are based on cryptographic keys, not usernames
- All content is hashed before transmission
- Private keys are stored locally and never transmitted
- The system respects the privacy-first principles of Chorus

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

GPLv3 - See LICENSE file for details

## Support

- Documentation: [Chorus Documentation](https://docs.chorus-social.net)
- Issues: [GitHub Issues](https://github.com/Chorus-Social/chorus-frontend/issues)
- Discussions: [GitHub Discussions](https://github.com/Chorus-Social/chorus-frontend/discussions)

---

**Chorus Frontend** - Privacy-first social networking for the decentralized web.
