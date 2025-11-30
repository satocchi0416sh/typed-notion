#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Generate initial changelog for first release
 */

const { writeFileSync } = require('fs');
const { execSync } = require('child_process');

const VERSION = process.argv[2] || '1.0.0';

const changelog = `# Changelog

All notable changes to this project will be documented in this file.

## [${VERSION}] - ${new Date().toISOString().split('T')[0]}

### ✨ Initial Release

- Type-safe Notion API library with compile-time validation
- Runtime type inference for Notion database properties
- Support for complex property types (formulas, relations, rollups)
- Comprehensive TypeScript type definitions
- Modern ESM and CommonJS dual package support
- Strict TypeScript configuration with safety checks
- Full test coverage for core functionality
- Performance benchmarks for type validation
- Automated CI/CD with GitHub Actions
- Semantic versioning and automated releases

### 📦 Package Features

- **@notionhq/client** integration with type safety
- **Valibot** and **Zod** schema validation support
- Environment-based configuration with dotenv
- Comprehensive error handling for API operations
- Tree-shakeable ES modules
- Small bundle size (<50kb)

### 🔧 Development Tools

- TypeScript 5.9.3 with strict mode
- Vitest for testing and benchmarks
- ESLint and Prettier for code quality
- Husky for git hooks
- Semantic Release for automated versioning
- Bundle size tracking with bundlesize

### 📚 Documentation

- Comprehensive README with usage examples
- TypeScript JSDoc comments
- API documentation
- Contributing guidelines

### 🚀 Getting Started

\`\`\`bash
npm install typed-notion-core-ts
\`\`\`

For more information, see the [README](https://github.com/satocchi0416sh/typed-notion#readme).

[${VERSION}]: https://github.com/satocchi0416sh/typed-notion/releases/tag/v${VERSION}
`;

try {
  writeFileSync('CHANGELOG.md', changelog, 'utf8');
  console.log(`✅ Generated initial CHANGELOG.md for version ${VERSION}`);

  // Stage the changelog
  execSync('git add CHANGELOG.md', { stdio: 'inherit' });
  console.log('✅ Staged CHANGELOG.md');
} catch (error) {
  console.error('❌ Error generating changelog:', error.message);
  process.exit(1);
}
