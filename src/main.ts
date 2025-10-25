/**
 * Chorus Voice - Main Application Entry Point
 * 
 * This is the main entry point for the Chorus Voice frontend application.
 * It initializes the Vue.js application with all necessary plugins and
 * sets up the routing configuration.
 * 
 * Application Architecture:
 * - Vue 3 with Composition API
 * - Pinia for state management
 * - Vue Router for navigation
 * - Tailwind CSS for styling
 * - TypeScript for type safety
 * 
 * Security Features:
 * - Crypto initialization before any other imports
 * - Anonymous authentication system
 * - Client-side key management
 * - Proof-of-work protection
 * 
 * @author Chorus Development Team
 * @version 1.0.0
 */

// Initialize crypto first - must be before any other imports
import './crypto-init'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Import views
import ServerConnect from './views/ServerConnect.vue'
import Auth from './views/Auth.vue'
import KeypairDownload from './views/KeypairDownload.vue'
import KeypairManager from './views/KeypairManager.vue'
import Feed from './views/Feed.vue'
import CreatePost from './views/CreatePost.vue'
import Profile from './views/Profile.vue'

// Create router with application routes
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Default redirect to connection page
    { path: '/', redirect: '/connect' },
    
    // Server connection and authentication flow
    { path: '/connect', name: 'connect', component: ServerConnect },
    { path: '/auth', name: 'auth', component: Auth },
    { path: '/download-keypair', name: 'download-keypair', component: KeypairDownload },
    { path: '/keypairs', name: 'keypairs', component: KeypairManager },
    
    // Main application pages (require authentication)
    { path: '/feed', name: 'feed', component: Feed },
    { path: '/create', name: 'create', component: CreatePost },
    { path: '/profile', name: 'profile', component: Profile }
  ]
})

// Create app
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
