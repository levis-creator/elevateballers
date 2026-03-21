import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Runs before test files are loaded — sets env vars needed by module-level code
    globalSetup: [],
    setupFiles: ['./src/__tests__/setup.ts'],
    env: {
      NODE_ENV: 'test',
    },
  },
  define: {
    // Shim import.meta.env for modules that use it
    'import.meta.env': JSON.stringify({
      NODE_ENV: 'test',
      DEV: false,
      PROD: false,
      SSR: true,
    }),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
