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
          branches: 40,
          functions: 40,
          lines: 40,
          statements: 40,
        },
        // Higher thresholds for critical modules
        'src/client/notion-client.ts': {
          branches: 75,
          functions: 90,
          lines: 88,
          statements: 87,
        },
        'src/client/filters.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/errors/index.ts': {
          branches: 68,
          functions: 90,
          lines: 86,
          statements: 88,
        },
        'src/conversion/property-extractors.ts': {
          branches: 60,
          functions: 70,
          lines: 75,
          statements: 75,
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
