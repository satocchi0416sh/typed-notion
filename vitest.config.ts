import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'build', 'specs/**'],
    setupFiles: ['tests/utils/custom-matchers.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'specs/**',
        'dist/**',
        'build/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/types/**', // Type definitions don't need coverage
        'src/index.ts', // Simple re-exports
      ],
      // Coverage thresholds to ensure quality
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Higher thresholds for critical modules
        'src/client/notion-client.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/client/filters.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/errors/index.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/conversion/property-extractors.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
    // Performance testing configuration
    benchmark: {
      include: ['tests/performance/**/*.bench.ts'],
      exclude: ['node_modules', 'dist', 'build'],
    },
    // Test timeouts
    testTimeout: 10000, // 10 seconds for integration tests
    hookTimeout: 30000, // 30 seconds for setup/teardown
    // Retry failed tests once (for flaky network tests)
    retry: 1,
  },
  esbuild: {
    target: 'node18',
  },
});
