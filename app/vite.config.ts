import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { seo } from './vite-seo';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [react(), seo({ siteUrl: env.VITE_SITE_URL || '', supabaseUrl: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY })],
  base: '/',
  build: {
    // Vendor code changes rarely; splitting it lets browsers cache it across deploys.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  };
});
