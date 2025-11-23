import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true, // Generate TypeScript declarations
  sourcemap: true, // Generate sourcemaps
  clean: true, // Clean output directory
  minify: false, // Keep readable for debugging
  splitting: false, // Disable code splitting for libraries
  treeshake: true, // Enable tree-shaking
  outDir: 'dist',
  target: 'esnext',
});
