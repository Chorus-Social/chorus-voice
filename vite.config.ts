import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    host: true,
    // Enable HMR for better development experience
    hmr: {
      overlay: true
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    // Optimize for Safari/WebKit compatibility
    minify: 'terser',
    terserOptions: {
      safari10: true,
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          crypto: ['@noble/hashes', 'dompurify'],
          ui: ['marked']
        }
      }
    },
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    chunkSizeWarningLimit: 1000 // Warn for chunks larger than 1MB
  },
  optimizeDeps: {
    include: ['@noble/hashes/blake3', 'marked', 'dompurify'],
    // Exclude from pre-bundling to avoid issues
    exclude: ['@noble/hashes']
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: true
  }
})
