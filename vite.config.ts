import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

export default defineConfig({
  plugins: [
    sites(),
    cloudflare({
      config: {
        name: 'server',
        main: './src/worker.ts',
        compatibility_date: '2026-05-22',
        assets: {
          binding: 'ASSETS',
          not_found_handling: 'single-page-application'
        }
      }
    })
  ],
  server: {
    host: '0.0.0.0'
  },
  preview: {
    host: '0.0.0.0'
  }
});
