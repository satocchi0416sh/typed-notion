# Quickstart Guide: Practical CRUD Operations for typed-notion-core-ts

**Feature Branch**: `001-notion-crud-operations` | **Date**: 2025-01-23

## Overview

This guide shows how to use the enhanced typed-notion-core-ts library with practical CRUD operations, automatic data conversion, and Zod integration. You'll learn to perform type-safe database operations without falling back to raw API calls.

## Installation and Setup

### 1. Environment Configuration

Set up environment variables using the `NOTION_DB_[SCHEMA_NAME]` convention:

```bash
# .env file
NOTION_API_KEY=your_notion_integration_token
NOTION_DB_USER_PROFILE=abc123-def456-789ghi  # Your actual database IDs
NOTION_DB_PRACTICE_PASSAGE=xyz789-uvw456-rst123
NOTION_DB_PRACTICE_SESSION=mno456-pqr789-stu012
```

### 2. Basic Schema Definition

```typescript
import { createTypedSchema, NotionClient } from 'typed-notion-core-ts';

// Define your schema with proper structure
const userProfileSchema = createTypedSchema({
  databaseId: '', // Will be auto-resolved from NOTION_DB_USER_PROFILE
  properties: {
    lineUserId: { type: 'title' },
    displayName: { type: 'rich_text' },
    skillLevel: {
      type: 'select',
      options: ['初心者', '初級', '中級', '上級', 'プロ'] as const,
    },
    primaryInstrument: {
      type: 'select',
      options: ['ピアノ', 'ギター', 'バイオリン', 'ドラム', 'ベース', 'その他'] as const,
    },
    practiceGoals: {
      type: 'multi_select',
      options: [
        'テクニック向上',
        '暗譜強化',
        '表現力向上',
        'リズム感強化',
        '速度向上',
        'レパートリー拡大',
      ] as const,
    },
    dailyPracticeTarget: { type: 'number' },
    isActive: { type: 'checkbox' },
    createdAt: { type: 'created_time' },
    lastEditedAt: { type: 'last_edited_time' },
  },
} as const);

// TypeScript automatically infers the exact type
type UserProfile = InferSchemaProperties<typeof userProfileSchema>;
// Result: {
//   lineUserId: string | null;
//   displayName: string | null;
//   skillLevel: '初心者' | '初級' | '中級' | '上級' | 'プロ' | null;
//   primaryInstrument: 'ピアノ' | 'ギター' | 'バイオリン' | 'ドラム' | 'ベース' | 'その他' | null;
//   practiceGoals: ('テクニック向上' | '暗譜強化' | '表現力向上' | 'リズム感強化' | '速度向上' | 'レパートリー拡大')[] | null;
//   dailyPracticeTarget: number | null;
//   isActive: boolean | null;
//   createdAt: Date | null;
//   lastEditedAt: Date | null;
// }
```

## Core CRUD Operations

### 1. Initialize the Client

```typescript
// Initialize with your API key
const client = new NotionClient({
  auth: process.env.NOTION_API_KEY!,
});
```

### 2. Query Database with Type Safety

```typescript
// Simple query - get all active users
const activeUsers = await client.query(userProfileSchema, {
  filter: {
    property: 'isActive',
    checkbox: { equals: true },
  },
});

// Complex query with multiple filters and sorting
const advancedPianists = await client.query(userProfileSchema, {
  filter: {
    and: [
      {
        property: 'skillLevel',
        select: { equals: '上級' }, // ✅ Only valid options allowed
      },
      {
        property: 'primaryInstrument',
        select: { equals: 'ピアノ' }, // ✅ TypeScript validates options
      },
      {
        property: 'dailyPracticeTarget',
        number: { greater_than: 30 },
      },
    ],
  },
  sorts: [{ property: 'createdAt', direction: 'descending' }],
  page_size: 50,
});

// Results are automatically typed
console.log(advancedPianists.results[0]?.skillLevel); // Type: '初心者' | '初級' | '中級' | '上級' | 'プロ' | null
console.log(advancedPianists.results[0]?.createdAt); // Type: Date | null (automatically converted!)
```

### 3. Create New Records

```typescript
// Create new user profile with type validation
const newUser = await client.create(userProfileSchema, {
  lineUserId: 'U123456789',
  displayName: '田中太郎',
  skillLevel: '中級', // ✅ TypeScript validates this is a valid option
  primaryInstrument: 'ピアノ',
  practiceGoals: ['テクニック向上', '表現力向上'], // ✅ Array of valid options only
  dailyPracticeTarget: 60,
  isActive: true,
  // createdAt and lastEditedAt are automatically set by Notion
});

// Result is fully typed with ID
console.log(newUser.id); // string
console.log(newUser.skillLevel); // '中級'
console.log(newUser.createdAt); // Date object (auto-converted from Notion API)
```

### 4. Update Existing Records

```typescript
// Update with partial data - only changed fields
const updatedUser = await client.update('page_id_here', userProfileSchema, {
  skillLevel: '上級', // Skill improvement!
  dailyPracticeTarget: 90,
  // Other fields remain unchanged
});

// Type-safe error handling
try {
  await client.update('page_id_here', userProfileSchema, {
    skillLevel: 'Invalid Level', // ❌ TypeScript error - not a valid option
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
  }
}
```

## Advanced Features

### 1. Zod Schema Generation and Validation

```typescript
// Generate Zod schema automatically from your typed schema
const zodSchema = userProfileSchema.toZod();

// Use for runtime validation
const validationResult = zodSchema.safeParse({
  lineUserId: 'U123456789',
  displayName: '田中太郎',
  skillLevel: '中級',
  primaryInstrument: 'ピアノ',
});

if (validationResult.success) {
  console.log('Data is valid:', validationResult.data);
} else {
  console.log('Validation errors:', validationResult.error.issues);
}

// Direct parsing with error throwing
try {
  const parsedData = zodSchema.parse(userInput);
  // Use parsedData with confidence - it matches your schema exactly
} catch (error) {
  console.log('Invalid data:', error);
}
```

### 2. Type-Safe Filter Building

```typescript
// Filter builder for complex queries (optional convenience API)
const complexFilter = new FilterBuilder(userProfileSchema)
  .where('skillLevel', { equals: '上級' })
  .and({
    property: 'practiceGoals',
    multi_select: { contains: 'テクニック向上' },
  })
  .or({
    property: 'dailyPracticeTarget',
    number: { greater_than: 120 },
  })
  .build();

const results = await client.query(userProfileSchema, {
  filter: complexFilter,
});
```

### 3. Error Handling Best Practices

```typescript
import { NotionAPIError, SchemaValidationError, ConversionError } from 'typed-notion-core-ts';

async function safeQuery() {
  try {
    const results = await client.query(userProfileSchema, {
      filter: {
        /* your filter */
      },
    });
    return results;
  } catch (error) {
    if (error instanceof NotionAPIError) {
      // Notion API returned an error (rate limit, permissions, etc.)
      console.error('Notion API Error:', error.message, error.code);
      if (error.status === 429) {
        // Rate limit - retry after delay
        console.log('Rate limited, retrying...');
      }
    } else if (error instanceof SchemaValidationError) {
      // Schema doesn't match database structure
      console.error('Schema mismatch:', error.message);
      console.log('Expected:', error.expected, 'Received:', error.received);
    } else if (error instanceof ConversionError) {
      // Data conversion failed
      console.error('Conversion failed:', error.message);
      console.log('Property:', error.propertyName, 'Input:', error.input);
    } else {
      // Unexpected error
      console.error('Unexpected error:', error);
    }
  }
}
```

## Real-World Example: Line Music Habit Integration

Based on your existing line-music-habit project, here's how the enhanced library solves the current pain points:

### Before: Manual Type Definitions and API Calls

```typescript
// ❌ OLD WAY: Manual type definition + raw API
export interface PracticePassage {
  id: string;
  title: string | null; // Manual type definition
  description: string | null;
  difficulty: '初級' | '中級' | '上級' | null;
  // ...50 more lines of manual type definitions
}

// Manual API calls with no type safety
const response = await notionApiClient.databases.query({
  database_id: notionDatabaseIds.practicePassage,
  // Raw filter objects with no validation
});
// Manual property extraction and type conversion
const results = response.results as any; // 😱 Type safety lost
```

### After: Automatic Types and Type-Safe Operations

```typescript
// ✅ NEW WAY: Single schema definition with automatic types
const practicePassageSchema = createTypedSchema({
  properties: {
    title: { type: 'title' },
    description: { type: 'rich_text' },
    difficulty: {
      type: 'select',
      options: ['初級', '中級', '上級'] as const,
    },
    estimatedDuration: { type: 'number' },
    genre: {
      type: 'select',
      options: ['クラシック', 'ジャズ', 'ポップス', 'ロック', 'その他'] as const,
    },
    tags: {
      type: 'multi_select',
      options: ['技術練習', 'スケール', 'アルペジオ', '楽曲練習', 'リズム練習', '暗譜'] as const,
    },
    lastPracticed: { type: 'date' },
    createdAt: { type: 'created_time' },
    lastEditedAt: { type: 'last_edited_time' },
    userId: { type: 'rich_text' },
  },
} as const);

// Automatic type inference - no manual type definitions needed!
type PracticePassage = InferSchemaProperties<typeof practicePassageSchema>;

// Type-safe operations with automatic conversion
const passages = await client.query(practicePassageSchema, {
  filter: {
    property: 'userId',
    rich_text: { equals: userId },
  },
});
// Results are automatically typed and converted!
// dates are Date objects, not strings
// select values are literal types, not just strings
```

### Zod Integration Eliminates Double Definitions

```typescript
// ✅ Single source of truth
const practicePassageSchema = createTypedSchema(/* ... */);

// Automatically generate Zod validation (no duplication!)
const zodValidation = practicePassageSchema.toZod();

// Use for form validation, API validation, etc.
const createPracticePassageSchema = zodValidation.pick({
  title: true,
  description: true,
  difficulty: true,
  // ... select only the fields needed for creation
});

// No more maintaining separate Zod schemas!
```

## Performance and Best Practices

### 1. Caching and Performance

```typescript
// Schemas are cached automatically for performance
const schema1 = createTypedSchema(definition);
const schema2 = createTypedSchema(definition); // Uses cached version

// Monitor performance
const metrics = schema.getPerformanceMetrics();
console.log('Query performance:', metrics.lastQueryDuration);
console.log('Cache hit rate:', metrics.cacheHitRate);
```

### 2. Rate Limiting

```typescript
// Client automatically handles Notion's rate limits (3 req/s)
// Automatic retries with exponential backoff for 429 responses
const results = await Promise.all([
  client.query(schema1),
  client.query(schema2),
  client.query(schema3),
  // All requests automatically queued and rate limited
]);
```

### 3. Environment Management

```typescript
// Development environment
// NOTION_DB_USER_PROFILE=dev_database_id
// NOTION_DB_PRACTICE_PASSAGE=dev_practice_db_id

// Production environment
// NOTION_DB_USER_PROFILE=prod_database_id
// NOTION_DB_PRACTICE_PASSAGE=prod_practice_db_id

// Same code works in all environments!
const users = await client.query(userProfileSchema);
```

## Migration Path

For existing line-music-habit project:

1. **Add environment variables** for your database IDs
2. **Replace manual type definitions** with `createTypedSchema` calls
3. **Replace raw API calls** with `client.query/create/update` calls
4. **Remove duplicate Zod schemas** - use `schema.toZod()` instead
5. **Enjoy type safety and automatic conversion!**

The new system provides the practical functionality missing from the current typed-notion-core-ts while maintaining full backwards compatibility.
