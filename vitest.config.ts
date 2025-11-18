import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'build'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx'
      ]
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    }
  },
  esbuild: {
    target: 'node18'
  }
})