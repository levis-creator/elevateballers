// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  prettier,
  {
    rules: {
      // Flag debug console.log — allow console.error and console.warn
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      // Downgrade 'any' from error to warn — too many pre-existing uses to fix at once
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow ts-expect-error with description
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }],
    },
  },
  {
    // Ignore build output and generated files
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'prisma/seed*.js', 'scripts/**'],
  }
);
