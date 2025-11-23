# Quick Start: NPM Package Publication Preparation

## Overview

This guide provides a step-by-step walkthrough for preparing the TypedNotion TypeScript library for npm publication. Follow these steps to establish a complete publishing workflow with validation, testing, and automation.

## Prerequisites

- Node.js 18+ installed
- npm 9+ or pnpm 8+ installed
- TypeScript 5.5+ installed
- Git repository initialized
- npm account with 2FA enabled

## Phase 1: Package Configuration

### Step 1: Configure package.json

Update your package.json with required npm publishing fields:

```json
{
  "name": "@typed-notion/core",
  "version": "1.0.0",
  "description": "Type-safe Notion API library with compile-time validation",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "keywords": ["typescript", "notion", "api", "type-safe", "validation"],
  "author": "TypedNotion Team <contact@typed-notion.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/typed-notion.git"
  },
  "homepage": "https://typed-notion.dev",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Step 2: Install Build Dependencies

Install the required build and validation tools:

```bash
# Build tools
npm install -D tsup @types/node

# Validation tools
npm install -D @arethetypeswrong/cli publint bundlesize

# Version management
npm install -D semantic-release @semantic-release/npm @semantic-release/github

# Local testing
npm install -g yalc
```

## Phase 2: Build Pipeline Setup

### Step 3: Configure tsup Build Tool

Create `tsup.config.ts`:

```typescript
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
```

### Step 4: Optimize TypeScript Configuration

Update `tsconfig.json` for optimal build performance:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "verbatimModuleSyntax": true,
    "isolatedDeclarations": true,
    "isolatedModules": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "incremental": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Step 5: Add Build Scripts

Update package.json scripts:

```json
{
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "build:check": "tsc --noEmit",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run build && npm run test && npm run validate"
  }
}
```

## Phase 3: Validation Pipeline

### Step 6: Package Validation Setup

Add validation scripts to package.json:

```json
{
  "scripts": {
    "validate": "npm run validate:types && npm run validate:package && npm run validate:size",
    "validate:types": "@arethetypeswrong/cli --pack .",
    "validate:package": "publint",
    "validate:size": "bundlesize"
  },
  "bundlesize": [
    {
      "path": "./dist/*.js",
      "maxSize": "50kb"
    }
  ]
}
```

### Step 7: Local Testing Setup

Configure yalc for local testing:

```json
{
  "scripts": {
    "test:local": "npm run build && yalc publish && npm run test:install",
    "test:install": "cd ../test-project && yalc add @typed-notion/core && npm test",
    "test:pack": "npm pack && tar -tzf *.tgz"
  }
}
```

## Phase 4: Automation Setup

### Step 8: Version Management

Create `.releaserc.json` for semantic-release:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    [
      "@semantic-release/github",
      {
        "assets": [{ "path": "dist/**", "label": "Distribution files" }]
      }
    ]
  ]
}
```

### Step 9: GitHub Actions Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          registry-url: https://registry.npmjs.org/

      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm run validate

      - name: Publish to npm
        run: npx semantic-release
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Phase 5: Documentation

### Step 10: Update README.md

Create comprehensive package documentation:

````markdown
# @typed-notion/core

Type-safe Notion API library with compile-time validation.

## Installation

```bash
npm install @typed-notion/core
```
````

## Quick Start

```typescript
import { createNotionClient } from '@typed-notion/core';

const notion = createNotionClient({
  auth: process.env.NOTION_TOKEN,
});

// Your usage examples here
```

## API Documentation

[Link to full API documentation]

## Contributing

[Contributing guidelines]

````

## Validation Checklist

Before publishing, ensure all these steps pass:

- [ ] `npm run build` completes without errors
- [ ] `npm run validate:types` passes (no type export issues)
- [ ] `npm run validate:package` passes (package.json valid)
- [ ] `npm run validate:size` passes (bundle size under 50KB)
- [ ] `npm run test` passes (all tests green)
- [ ] `npm run test:local` succeeds (local installation works)
- [ ] README.md includes installation and usage instructions
- [ ] LICENSE file exists
- [ ] Version follows semantic versioning
- [ ] Git tags are properly configured

## Testing the Full Workflow

### Manual Testing

1. **Build the package:**
   ```bash
   npm run build
````

2. **Validate the package:**

   ```bash
   npm run validate
   ```

3. **Test local installation:**

   ```bash
   npm run test:local
   ```

4. **Preview package contents:**
   ```bash
   npm run test:pack
   ```

### Automated Testing

Set up the GitHub Actions workflow and test with a commit:

1. **Commit with conventional format:**

   ```bash
   git commit -m "feat: add npm publishing workflow"
   ```

2. **Push to main branch:**

   ```bash
   git push origin main
   ```

3. **Monitor GitHub Actions for publishing result**

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors:**

- Check tsconfig.json configuration
- Ensure all source files have explicit return types if using isolatedDeclarations

**Package size exceeds 50KB:**

- Enable tree-shaking in tsup.config.ts
- Review dependencies and mark large ones as peerDependencies
- Use bundle analyzer to identify large modules

**Type validation fails:**

- Verify exports field matches actual build outputs
- Check that .d.ts files are generated correctly
- Ensure CommonJS and ESM exports are both configured

**Local testing fails:**

- Clear yalc cache: `yalc installations clean`
- Verify test project setup
- Check import/require syntax compatibility

## Next Steps

After completing this setup:

1. **Monitor package metrics** on npm registry
2. **Set up package analytics** for download tracking
3. **Configure automated security updates**
4. **Establish contributor guidelines**
5. **Plan feature roadmap and versioning strategy**

This completes the npm publishing preparation for your TypeScript library!
