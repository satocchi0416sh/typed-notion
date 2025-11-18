# Quickstart Guide: MVP Property Types

**Feature**: Type-Safe Notion Schema System  
**Version**: 1.0.0  
**Prerequisites**: Node.js 18+, TypeScript 5.9+, Notion Integration Token

## Installation

```bash
npm install typed-notion
# or
pnpm add typed-notion
```

## Basic Setup

### 1. Environment Configuration

```bash
# .env
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 2. Initialize the Client

```typescript
import { defineSchema, query } from 'typed-notion';
import { config } from 'dotenv';

// Load environment variables
config();
```

## Defining Your First Schema

### Example: User Database

```typescript
// Define a schema with MVP property types
const UserSchema = defineSchema({
  databaseId: process.env.NOTION_DATABASE_ID!,
  properties: {
    Name: { type: 'title' },
    Email: { type: 'email' },
    Age: { type: 'number' },
    Role: { 
      type: 'select', 
      options: ['Admin', 'Editor', 'Viewer'] as const 
    },
    Tags: { 
      type: 'multi_select',
      options: ['Active', 'Premium', 'Beta'] as const
    },
    IsActive: { type: 'checkbox' },
    JoinedAt: { type: 'date' },
    Website: { type: 'url' },
    Bio: { type: 'rich_text' },
    Manager: { type: 'people' }
  }
} as const); // Important: 'as const' preserves literal types
```

## Querying the Database

### Basic Query

```typescript
// Query with full type safety
const users = await query(UserSchema);

// TypeScript knows the exact shape of each user
users.forEach(user => {
  console.log(user.props.Name);        // string | null
  console.log(user.props.Role);        // "Admin" | "Editor" | "Viewer" | null
  console.log(user.props.Age);         // number | null
  console.log(user.props.IsActive);    // boolean | null
  console.log(user.props.Tags);        // ("Active" | "Premium" | "Beta")[] | null
});
```

### Query with Filtering

```typescript
// Query with options
const activeAdmins = await query(UserSchema, {
  filter: {
    Role: { equals: 'Admin' },
    IsActive: { equals: true }
  },
  sorts: [
    { property: 'JoinedAt', direction: 'descending' }
  ],
  page_size: 10
});
```

## Type Safety Benefits

### 1. Autocompletion

```typescript
const user = users[0];
if (user) {
  // IDE provides autocompletion for all properties
  user.props. // Shows: Name, Email, Age, Role, Tags, etc.
}
```

### 2. Compile-Time Validation

```typescript
// ✅ Valid - Role is a defined option
if (user.props.Role === 'Admin') { 
  // Admin-specific logic
}

// ❌ TypeScript Error - 'SuperAdmin' is not a valid option
if (user.props.Role === 'SuperAdmin') { 
  // This won't compile
}

// ❌ TypeScript Error - 'Salary' property doesn't exist
console.log(user.props.Salary);
```

### 3. Null Safety

```typescript
// All properties are nullable by default
const age = user.props.Age; // number | null

// Safe handling with nullish coalescing
const displayAge = age ?? 'Age not specified';

// Type narrowing works as expected
if (user.props.Manager) {
  console.log(user.props.Manager[0]?.name); // Safe access
}
```

## Error Handling

### Schema Validation Errors

```typescript
try {
  // Invalid schema - missing title property
  const InvalidSchema = defineSchema({
    databaseId: 'xxx',
    properties: {
      Description: { type: 'rich_text' } // No title!
    }
  });
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.error(error.message); 
    // "Schema must have exactly one title property"
    console.error(error.context);
    // { property: 'title', expected: 1, received: 0 }
  }
}
```

### Property Access Errors

```typescript
try {
  // TypeScript prevents this at compile time,
  // but runtime validation also catches it
  const value = user.props['InvalidProperty'];
} catch (error) {
  if (error instanceof PropertyAccessError) {
    console.error(error.message);
    // "Property 'InvalidProperty' not defined in schema"
  }
}
```

## Advanced Patterns

### Multiple Schemas

```typescript
// Define multiple schemas for different databases
const TaskSchema = defineSchema({
  databaseId: 'task-db-id',
  properties: {
    Title: { type: 'title' },
    Status: { 
      type: 'select', 
      options: ['Todo', 'In Progress', 'Done'] as const 
    },
    Priority: { 
      type: 'number', 
      format: 'number' 
    },
    DueDate: { type: 'date' },
    Assignee: { type: 'people' }
  }
} as const);

// Each schema maintains its own type safety
const tasks = await query(TaskSchema);
const users = await query(UserSchema);

// TypeScript knows these are different types
tasks[0]?.props.Status; // "Todo" | "In Progress" | "Done" | null
users[0]?.props.Role;   // "Admin" | "Editor" | "Viewer" | null
```

### Schema Composition

```typescript
// Reusable property definitions
const commonProperties = {
  CreatedBy: { type: 'people' as const },
  UpdatedAt: { type: 'date' as const },
  IsArchived: { type: 'checkbox' as const }
};

// Compose schemas with spread operator
const ProjectSchema = defineSchema({
  databaseId: 'project-db-id',
  properties: {
    Name: { type: 'title' },
    Description: { type: 'rich_text' },
    Budget: { type: 'number', format: 'dollar' },
    ...commonProperties // Reuse common properties
  }
} as const);
```

## Performance Considerations

### Concurrent Schema Limits

```typescript
import { getPerformanceMetrics } from 'typed-notion';

// Monitor active schema count (max 100)
const metrics = getPerformanceMetrics();
console.log(`Active schemas: ${metrics.activeSchemaCount}/100`);
console.log(`Last query: ${metrics.lastQueryDuration}ms`);
```

### Schema Processing Performance

```typescript
// Schemas are validated once at creation time
const startTime = performance.now();
const MySchema = defineSchema({ /* ... */ });
const processingTime = performance.now() - startTime;

// Should be < 2000ms for 20 properties
console.log(`Schema processed in ${processingTime}ms`);
```

## Testing Your Schemas

### Unit Testing with Vitest

```typescript
import { describe, it, expect } from 'vitest';
import { defineSchema } from 'typed-notion';

describe('UserSchema', () => {
  it('should create valid schema with all property types', () => {
    const schema = defineSchema({
      databaseId: 'test-db',
      properties: {
        Name: { type: 'title' },
        Email: { type: 'email' },
        Role: { type: 'select', options: ['Admin', 'User'] as const }
      }
    } as const);
    
    expect(schema.getDatabaseId()).toBe('test-db');
    expect(schema.hasProperty('Name')).toBe(true);
    expect(schema.hasProperty('InvalidProp')).toBe(false);
  });
  
  it('should reject schema without title property', () => {
    expect(() => {
      defineSchema({
        databaseId: 'test-db',
        properties: {
          Description: { type: 'rich_text' }
        }
      });
    }).toThrow(SchemaValidationError);
  });
});
```

### Type Testing

```typescript
import { expectTypeOf } from 'vitest';
import { InferSchemaProperties } from 'typed-notion';

// Test type inference
type UserProps = InferSchemaProperties<typeof UserSchema>;

expectTypeOf<UserProps['Role']>()
  .toEqualTypeOf<'Admin' | 'Editor' | 'Viewer' | null>();

expectTypeOf<UserProps['Tags']>()
  .toEqualTypeOf<('Active' | 'Premium' | 'Beta')[] | null>();
```

## Migration from Untyped Notion Client

### Before (Untyped)

```typescript
// No type safety, prone to runtime errors
const response = await notion.databases.query({
  database_id: databaseId
});

response.results.forEach(page => {
  // Any typo or wrong property access fails at runtime
  console.log(page.properties.Nmae); // Typo!
  console.log(page.properties.Role.select.name); // Complex nesting
});
```

### After (Typed)

```typescript
// Full type safety and autocompletion
const users = await query(UserSchema);

users.forEach(user => {
  // TypeScript catches typos at compile time
  console.log(user.props.Name); // ✅ Autocompleted
  console.log(user.props.Role); // ✅ Simple access
});
```

## Next Steps

1. **Explore Advanced Property Types**: Once comfortable with MVP types, explore relations, rollups, and formulas
2. **Implement Write Operations**: Use schemas for creating and updating database entries
3. **Build Type-Safe Integrations**: Leverage type safety for building robust Notion-powered applications
4. **Performance Optimization**: Monitor and optimize for your specific use cases

## Resources

- [API Reference](./contracts/schema-api.ts)
- [Data Model Documentation](./data-model.md)
- [Full Specification](./spec.md)
- [Notion API Documentation](https://developers.notion.com)