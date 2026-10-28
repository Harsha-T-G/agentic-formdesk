import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const backend = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8080';
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(['/api', '/openapi.json', '/swagger-ui', '/v3/api-docs'].map(path => [path, { target: backend, changeOrigin: true }])),
  },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], css: false },
});
