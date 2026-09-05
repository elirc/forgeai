import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';
export default [
  {
    ignores: [
      'node_modules/**',
      '.cache/**',
      '.local/**',
      '**/.next/**',
      '**/.next-e2e/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals.map((config) => ({ ...config, files: ['apps/web/**/*.{ts,tsx}'] })),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
