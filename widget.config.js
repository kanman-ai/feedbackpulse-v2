/**
 * Widget Bundle Build Configuration
 * 
 * Vite configuration for building the FeedbackPulse widget bundle.
 * This creates a standalone JavaScript bundle that can be loaded by the
 * bootstrap script and runs independently in shadow DOM on third-party sites.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Build configuration for the widget bundle
  build: {
    // Output to public directory where it can be served
    outDir: 'public',
    
    // Generate a single bundle file
    rollupOptions: {
      input: resolve(process.cwd(), 'src/widget/widget-bundle.tsx'),
      output: {
        // Output as widget-bundle.js (referenced by bootstrap script)
        entryFileNames: 'widget-bundle.js',
        
        // Don't create separate CSS files - inline all styles
        assetFileNames: 'widget-bundle.[ext]',
        
        // Bundle everything into a single file
        manualChunks: undefined,
      },
      
      // External dependencies that shouldn't be bundled
      external: [],
    },
    
    // Minify the output for production
    minify: 'terser',
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Target modern browsers (since this runs in shadow DOM)
    target: 'es2018',
    
    // Don't emit manifest.json or other build artifacts
    manifest: false,
  },
  
  // CSS processing
  css: {
    // Inline CSS into the JS bundle
    extract: false,
  },
  
  // Define globals for the standalone bundle
  define: {
    // Ensure process.env is defined for React
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './src'),
    },
  },
});