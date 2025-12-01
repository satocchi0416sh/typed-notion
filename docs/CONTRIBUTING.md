# Contributing to typed-notion-core-ts

We welcome contributions! This guide will help you set up the development environment and understand our development workflow.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- TypeScript 5.9+

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/satocchi0416sh/typed-notion
cd typed-notion

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Notion integration token
```

### Environment Variables

```bash
NOTION_TOKEN=your_integration_token_here
NOTION_DATABASE_ID=optional_test_database_id
```

## Development Workflow

### Build Commands

```bash
# Development
npm run dev              # Watch mode compilation
npm run build            # Production build
npm run build:watch      # Build in watch mode

# Type checking
npm run typecheck        # TypeScript type checking

# Code quality
npm run lint             # ESLint checking
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format with Prettier
```

### Testing

```bash
# Test commands
npm test                 # Run all tests in watch mode
npm run test:run         # Single test run
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # Test coverage report
npm run test:bench       # Performance benchmarks
```

### Package Validation

```bash
# Validation suite
npm run validate         # Complete validation suite
npm run validate:package # Package configuration check
npm run validate:types   # TypeScript exports validation
npm run validate:size    # Bundle size analysis

# Individual tools
npx publint             # Package publishing validation
npx @arethetypeswrong/cli --pack .  # Type export validation
```

## Project Structure

```
src/
├── types/          # TypeScript type definitions
├── schema/         # Schema validation and type generation
├── client/         # Notion API client wrapper
├── conversion/     # Data transformation utilities
├── validation/     # Runtime validation logic
├── errors/         # Custom error types
└── utils/          # Helper functions

tests/
├── unit/           # Unit tests
├── integration/    # Integration tests with Notion API
└── performance/    # Performance benchmarks
```

## Code Standards

### TypeScript Configuration

- **Strict mode** enabled with additional safety checks
- **Node.js ESM** module resolution
- **Isolated modules** for optimal build performance
- `noUncheckedIndexedAccess` - Array/object access must be checked
- `exactOptionalPropertyTypes` - Strict optional property handling

### Testing Requirements

- All new features must include tests
- Maintain test coverage above 80%
- Integration tests for API interactions
- Performance benchmarks for critical paths

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit history and automated releases:

```bash
# Feature
git commit -m "feat: add rollup property type inference"

# Bug fix
git commit -m "fix: resolve formula type hint validation"

# Breaking change
git commit -m "feat!: update schema API interface

BREAKING CHANGE: Schema constructor now requires explicit type parameter"

# Documentation
git commit -m "docs: update API reference for complex properties"

# Other types: build, chore, ci, perf, refactor, style, test
```

## Release Process

### Automated Releases

The project uses **semantic-release** for automated versioning and publishing:

1. Push commits to `main` branch
2. GitHub Actions analyzes commit history
3. Determines version bump (patch/minor/major)
4. Updates package version
5. Generates changelog
6. Publishes to npm
7. Creates GitHub release

### Version Bump Rules

| Commit Type                    | Version Bump | Example       |
| ------------------------------ | ------------ | ------------- |
| `fix:`                         | Patch        | 1.0.0 → 1.0.1 |
| `feat:`                        | Minor        | 1.0.0 → 1.1.0 |
| `feat!:` or `BREAKING CHANGE:` | Major        | 1.0.0 → 2.0.0 |

### Manual Release

For maintainers with npm publish access:

```bash
# Dry run to preview changes
npm run release:dry

# Actual release
npm run release

# Pre-publish validation
npm run prepublishOnly
```

## Build Configuration

### tsup Configuration

The project uses tsup for bundling with the following settings:

- **Entry**: `src/index.ts`
- **Formats**: ESM and CJS dual package
- **Output**: `dist/` directory
- **TypeScript declarations**: Included
- **Source maps**: Generated for debugging
- **Target**: ES2022

### Package.json Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

## Submitting Changes

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test:run`)
6. Run validation (`npm run validate`)
7. Commit using conventional commits
8. Push to your branch
9. Open a Pull Request

### Pull Request Guidelines

- Describe what changes you've made
- Reference any related issues
- Ensure CI checks pass
- Keep PRs focused and atomic
- Update documentation if needed

## Getting Help

- Open an [issue](https://github.com/satocchi0416sh/typed-notion/issues) for bugs
- Start a [discussion](https://github.com/satocchi0416sh/typed-notion/discussions) for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
