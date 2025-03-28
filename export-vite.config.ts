/**
 * Standard Vite configuration file for deployment outside of Replit
 * This file is copied to vite.config.ts by the export script
 * 
 * Features:
 * - Removes all Replit-specific plugins
 * - Maintains all necessary aliases
 * - Optimizes build for production
 * - Includes standardized settings for any host
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're in a production environment
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Production optimizations
    minify: isProd ? 'terser' : false,
    sourcemap: !isProd,
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          ui: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            'class-variance-authority',
            'clsx',
            'lucide-react',
            'tailwind-merge'
          ]
        }
      }
    }
  },
  // Dev server configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0', // Allow connections from any IP
    proxy: { // Add any required proxies here
      // Example: '/api': 'http://localhost:8080'
    }
  },
  // Add any environment variables that should be available in the client
  define: {
    'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
  }
});