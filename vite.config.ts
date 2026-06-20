import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getProxyPort } from './server/proxy-utils';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_PORT ?? 5173),
    proxy: {
      // Resolve the target with the same precedence the proxy binds with
      // (PORT, then PROXY_PORT, then 3001) so `npm start` can't split the UI
      // and proxy across two ports when PORT is set in the shell.
      '/api': `http://localhost:${getProxyPort()}`,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
  },
});
