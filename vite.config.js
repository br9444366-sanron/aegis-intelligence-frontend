/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Vite Configuration
 * ============================================================
 * Vite is a next-generation frontend build tool.
 * - Lightning fast HMR (Hot Module Replacement) in dev
 * - Rollup-based production builds with tree-shaking
 * - Native ES modules in development (no bundling needed)
 * - VitePWA plugin for service worker + manifest injection
 *
 * Docs: https://vitejs.dev/config/
 * PWA:  https://vite-pwa-org.netlify.app/
 * ============================================================
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  // ── Plugins ───────────────────────────────────────────────
  plugins: [
    react({
      // Enable React Fast Refresh for instant component updates
      // without losing component state during development
      fastRefresh: true,
    }),

    // ── PWA Plugin ──────────────────────────────────────────
    VitePWA({
      // 'autoUpdate' silently updates the SW in the background.
      // The new SW activates on the next page load.
      registerType: 'autoUpdate',

      // Use our custom hand-crafted service worker (sw.js in /public)
      // instead of the auto-generated one. This gives us full control
      // over caching strategies.
      strategies: 'generateSW',


      // Inject the Vite build manifest into the SW so it can
      // pre-cache the hashed JS/CSS chunks automatically.
      injectManifest: {
        // Patterns to include in the precache manifest
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Don't precache large chunks — let them be fetched on demand
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB limit
      },

      // Include manifest.json from /public directly (our custom one)
      // Setting manifest: false tells the plugin NOT to generate one
      // so our own /public/manifest.json is used as-is.
      manifest: false,

      // Dev options — enable the SW in development for testing
      devOptions: {
        enabled: false, // Set to true to test SW behaviour locally
        type: 'module',
      },

      // ── Workbox config (used when strategies: 'generateSW') ──
      // We're using injectManifest above so these are reference only.
      workbox: {
        // Cache Google Fonts
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'aegis-google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],

  // ── Path aliases ──────────────────────────────────────────
  // Lets you import with "@/components/..." instead of "../../components/..."
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ── Development server ────────────────────────────────────
  server: {
    port: 5173,        // Default Vite port
    strictPort: false, // Try next port if 5173 is busy
    open: true,        // Auto-open browser on "npm run dev"

    // ── API proxy ──────────────────────────────────────────
    // Forwards /api/* requests to the Express backend,
    // avoiding CORS issues during development.
    // In production, configure your hosting (Nginx, Vercel) to do this.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // No rewrite needed since backend also uses /api prefix
      },
    },

    // HMR configuration
    hmr: {
      overlay: true, // Show build errors as an overlay in the browser
    },
  },

  // ── Production build ──────────────────────────────────────
  build: {
    outDir: 'dist',
    sourcemap: true,     // Generate source maps for debugging
    minify: 'esbuild',   // Fast minification with esbuild

    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks for better caching
        manualChunks: {
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor':    ['recharts'],
          'utils-vendor':    ['axios', 'date-fns', 'zustand'],
        },
      },
    },

    // Warn when chunks exceed 500KB
    chunkSizeWarningLimit: 500,
  },

  // ── Environment variables ─────────────────────────────────
  // Only variables prefixed with VITE_ are exposed to the browser.
  // Access them in code as: import.meta.env.VITE_API_URL
  envPrefix: 'VITE_',

  // ── Preview server (for testing production builds locally) ─
  preview: {
    port: 4173,
    open: true,
  },
});
