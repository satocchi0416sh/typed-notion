# typed-notion-core-ts

[![npm version](https://badge.fury.io/js/typed-notion-core-ts.svg)](https://badge.fury.io/js/typed-notion-core-ts)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Type-safe Notion API library with compile-time validation and runtime type inference

## Features

✨ **Type Safety First**: Complete TypeScript support with strict type checking  
🔒 **Runtime Validation**: Schema validation with detailed error reporting  
🚀 **Performance Optimized**: Built for speed with intelligent caching  
📦 **Zero Dependencies**: Lightweight with minimal footprint (7.75KB gzipped)  
🔧 **Developer Experience**: Excellent IntelliSense and debugging support  
🎯 **Production Ready**: Comprehensive test suite with 162 passing tests

## Installation

```bash
npm install typed-notion-core-ts
```

## Quick Start

```typescript
import { createTypedSchema, TypedSchema } from 'typed-notion-core-ts';

// Define your Notion database schema
const userSchema = createTypedSchema({
  name: { type: 'title' },
  email: { type: 'email' },
  age: { type: 'number' },
  status: {
    type: 'select',
    options: ['active', 'inactive', 'pending'],
  },
});

// Type-safe database operations
const users = new TypedSchema(userSchema);

// Compile-time type checking
const newUser = users.create({
  name: 'John Doe', // ✅ Required title field
  email: 'john@email.com', // ✅ Validates email format
  age: 25, // ✅ Number type
  status: 'active', // ✅ Must be one of the defined options
});
```

## Core Features

### 🔧 Schema Definition

Define type-safe schemas for your Notion databases:

```typescript
import { createTypedSchema, PropertyType } from 'typed-notion-core-ts';

const projectSchema = createTypedSchema({
  title: { type: 'title' },
  description: { type: 'rich_text' },
  priority: {
    type: 'select',
    options: ['high', 'medium', 'low'],
  },
  assignee: { type: 'people' },
  dueDate: { type: 'date' },
  completed: { type: 'checkbox' },
  tags: {
    type: 'multi_select',
    options: ['frontend', 'backend', 'design', 'testing'],
  },
});
```

### ✅ Runtime Validation

Validate data against your schema with detailed error reporting:

```typescript
import { validateSchemaDefinition, SchemaValidationError } from 'typed-notion-core-ts';

try {
  const result = validateSchemaDefinition(projectSchema);
  console.log('Schema is valid!', result);
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.error('Schema validation failed:', error.details);
  }
}
```

### 🚀 Performance Monitoring

Built-in performance tracking and optimization:

```typescript
import {
  measurePerformance,
  getPerformanceMetrics,
  checkPerformanceHealth,
} from 'typed-notion-core-ts';

// Measure operation performance
const result = await measurePerformance('database-query', async () => {
  return await users.query({ status: 'active' });
});

// Check overall performance health
const health = checkPerformanceHealth();
console.log(`Performance score: ${health.score}/100`);

// Get detailed metrics
const metrics = getPerformanceMetrics();
console.log('Average response time:', metrics.averageResponseTime);
```

## Supported Property Types

| Property Type  | TypeScript Type           | Validation                 |
| -------------- | ------------------------- | -------------------------- |
| `title`        | `string`                  | Required, non-empty        |
| `rich_text`    | `string`                  | Text content               |
| `number`       | `number`                  | Numeric values             |
| `select`       | `string` (from options)   | Must match defined options |
| `multi_select` | `string[]` (from options) | Array of valid options     |
| `date`         | `Date \| string`          | ISO date format            |
| `people`       | `NotionUser[]`            | Notion user objects        |
| `files`        | `File[]`                  | File attachments           |
| `checkbox`     | `boolean`                 | True/false values          |
| `url`          | `string`                  | Valid URL format           |
| `email`        | `string`                  | Valid email format         |
| `phone_number` | `string`                  | Phone number format        |
| `formula`      | `any`                     | Computed values            |
| `relation`     | `string[]`                | Page references            |
| `rollup`       | `any`                     | Aggregated values          |

## Advanced Usage

### Type Inference

Automatically infer types from your schema:

```typescript
import { InferSchemaProperties } from 'typed-notion-core-ts';

// Automatically inferred from schema
type UserProperties = InferSchemaProperties<typeof userSchema>;
// Result: { name: string; email: string; age: number; status: 'active' | 'inactive' | 'pending' }

function processUser(user: UserProperties) {
  // Full type safety and IntelliSense
  console.log(`User ${user.name} has status: ${user.status}`);
}
```

### Custom Validation

Create custom property validators:

```typescript
import { validatePropertyDefinition } from 'typed-notion-core-ts';

const customProperty = {
  type: 'select',
  options: ['urgent', 'normal', 'low'],
  required: true,
};

const isValid = validatePropertyDefinition('priority', customProperty);
```

### Error Handling

Comprehensive error types for robust error handling:

```typescript
import {
  TypedNotionError,
  SchemaValidationError,
  PropertyAccessError,
  NotionAPIError,
} from 'typed-notion-core-ts';

try {
  const result = await users.create(invalidData);
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.error('Schema validation failed:', error.message);
    console.error('Validation details:', error.details);
  } else if (error instanceof PropertyAccessError) {
    console.error('Property access error:', error.propertyName);
  } else if (error instanceof NotionAPIError) {
    console.error('Notion API error:', error.statusCode, error.message);
  }
}
```

## Package Development & Publishing

This library includes built-in tools for package development and npm publishing:

```typescript
import { PackageValidator, validatePackage, BuildPipeline } from 'typed-notion-core-ts';

// Validate package configuration
const validator = new PackageValidator();
const result = await validator.validatePackage('./package.json');

if (result.isValid) {
  console.log('Package is ready for publishing!');
} else {
  console.error('Validation errors:', result.errors);
}

// Build pipeline management
const pipeline = new BuildPipeline();
const buildResult = await pipeline.build();
console.log(`Build completed in ${buildResult.duration}ms`);
```

## API Reference

### Core Classes

- **`TypedSchema`** - Main schema class for type-safe operations
- **`PackageValidator`** - Package validation and npm publishing tools
- **`BuildPipeline`** - Build process management and optimization

### Utility Functions

- **`createTypedSchema(definition)`** - Create a new typed schema
- **`validateSchemaDefinition(schema)`** - Validate schema structure
- **`measurePerformance(name, operation)`** - Measure operation performance
- **`getPerformanceMetrics()`** - Get current performance metrics

### Type Definitions

- **`PropertyType`** - All supported property types
- **`SchemaDefinition`** - Schema definition structure
- **`InferSchemaProperties<T>`** - Infer types from schema
- **`NotionUser`** - Notion user object type

## Performance

- **Bundle Size**: 7.75KB gzipped
- **Build Time**: <1 second
- **Test Coverage**: 162 tests passing
- **TypeScript**: Strict mode compatible
- **Node.js**: 18+ supported

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build

# Validate package
npm run validate

# Run type checking
npm run typecheck
```

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/) format
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

- Follow TypeScript strict mode
- Add tests for new features
- Ensure all tests pass (`npm test`)
- Run validation before submitting (`npm run validate`)

## License

This project is licensed under the MIT License.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

**Made with ❤️ for the Notion developer community**

_For more examples and detailed documentation, visit our [GitHub repository](https://github.com/satocchi0416sh/typed-notion)._
