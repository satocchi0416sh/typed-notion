# Research: Practical CRUD Operations for typed-notion-core-ts

**Feature Branch**: `001-notion-crud-operations` | **Date**: 2025-01-23

## Overview

This research phase addressed three critical technical areas required for implementing practical CRUD operations and improved developer experience in typed-notion-core-ts: Zod schema generation patterns, Notion API filtering capabilities, and automatic data type conversion techniques.

## Decision 1: Zod Schema Auto-Generation Strategy

**Decision**: Implement lazy-loaded Zod schema generation with runtime caching using property definition mapping

**Rationale**:

- Runtime schema generation provides maximum flexibility while maintaining type safety
- Lazy loading avoids performance overhead until schemas are actually needed
- Caching prevents regeneration of identical schemas
- Factory pattern allows clean mapping from Notion property types to Zod validators

**Alternatives Considered**:

- Static build-time generation: Rejected due to reduced flexibility and complex build pipeline requirements
- Dynamic string-based code generation: Rejected due to security and maintenance concerns
- Third-party schema conversion libraries: Rejected due to lack of Notion-specific property support

**Implementation Pattern**:

```typescript
// Extend TypedSchema class with toZod() method
export class TypedSchema<T extends SchemaDefinition> {
  private _zodSchema?: z.ZodObject<any>;

  toZod(): z.ZodObject<InferZodTypes<T>> {
    if (!this._zodSchema) {
      this._zodSchema = generateZodSchema(this.definition);
    }
    return this._zodSchema;
  }
}

// Property-specific schema factories
function createPropertySchema(property: PropertyDefinition): z.ZodSchema<any> {
  switch (property.type) {
    case 'select':
      return z.enum(property.options as [string, ...string[]]).nullable();
    case 'multi_select':
      return z.array(z.enum(property.options as [string, ...string[]])).nullable();
    // ... other property types
  }
}
```

**Performance Considerations**:

- Schema generation cached per property definition fingerprint
- Memory usage monitored for applications with many schemas
- Lazy loading prevents unnecessary generation overhead

## Decision 2: Type-Safe Filter Objects Architecture

**Decision**: Implement mapped filter types that ensure only valid operator-property combinations are possible

**Rationale**:

- TypeScript's mapped types provide excellent compile-time validation
- IntelliSense guides developers to valid filter combinations only
- Prevents invalid queries from reaching Notion API
- Scales to support all Notion property types with their specific operators

**Alternatives Considered**:

- String-based query DSL: Rejected due to lack of type safety and poor IntelliSense
- Function-based filter builder only: Rejected as overly verbose for simple filters
- Raw Notion API filter objects: Rejected due to poor developer experience

**Implementation Pattern**:

```typescript
// Property-to-filter operator mapping
type PropertyFilterMap = {
  title: { equals: string; contains: string; is_empty: true /* ... */ };
  number: { equals: number; greater_than: number /* ... */ };
  select: { equals: string; does_not_equal: string /* ... */ };
  // ... all 14 property types
};

// Type-safe filter construction
type NotionFilter<TSchema extends Record<string, PropertyDefinition>> = {
  [K in keyof TSchema]: {
    property: K;
  } & {
    [P in TSchema[K]['type']]: Partial<PropertyFilterMap[P]>;
  };
}[keyof TSchema];

// Select option validation for literal types
type SelectFilterForOptions<T extends readonly string[]> = {
  equals: T[number]; // Only valid option values allowed
  does_not_equal: T[number];
};
```

**Rate Limiting Strategy**:

- Query manager with 334ms minimum interval (3 requests/second)
- Automatic backoff for 429 responses
- Batching support for multiple concurrent queries

## Decision 3: Automatic Data Conversion Pipeline

**Decision**: Implement Result-pattern based transformation with property-specific extractors

**Rationale**:

- Result pattern provides explicit error handling without exceptions
- Property extractors isolate complex Notion API response parsing
- Type-safe transformation ensures output matches schema definitions
- Performance optimized with memoization for repeated patterns

**Alternatives Considered**:

- Exception-based error handling: Rejected due to unpredictable error propagation
- Manual property-by-property conversion: Rejected due to developer burden
- Generic JSON transformation libraries: Rejected due to lack of Notion-specific logic

**Implementation Pattern**:

```typescript
// Result pattern for safe conversion
type Result<T, E = ConversionError> = { kind: 'ok'; value: T } | { kind: 'err'; error: E };

// Property-specific extractors
class NotionPropertyExtractor {
  static extractTitle(property: NotionPropertyValue): string {
    return property.title?.[0]?.plain_text || '';
  }

  static extractDate(property: NotionPropertyValue): Date | null {
    if (!property.date?.start) return null;
    const date = new Date(property.date.start);
    return isNaN(date.getTime()) ? null : date;
  }
  // ... extractors for all property types
}

// Complete page transformation
class NotionPageTransformer<T extends SchemaDefinition> {
  transform(notionPage: NotionPage): Result<InferSchemaProperties<T>> {
    // Schema-driven property extraction with validation
    // Returns typed object matching schema definition
  }
}
```

**Date Handling Strategy**:

- ISO 8601 string validation with regex pattern matching
- Automatic timezone conversion using Intl API when needed
- Null handling for malformed or missing date values

## Decision 4: Environment Variable Configuration

**Decision**: Use NOTION*DB*[SCHEMA_NAME] naming convention with automatic resolution

**Rationale**:

- Predictable naming convention reduces configuration errors
- Automatic resolution eliminates need for manual database ID passing
- Compatible with existing dotenv patterns in Node.js ecosystem
- Supports multiple environments (dev/staging/prod) seamlessly

**Implementation Pattern**:

```typescript
// Automatic database ID resolution
function resolveDatabaseId(schemaName: string): string {
  const envKey = `NOTION_DB_${schemaName.toUpperCase()}`;
  const databaseId = process.env[envKey];

  if (!databaseId) {
    throw new SchemaConfigurationError(
      `Database ID not found for schema "${schemaName}". ` +
        `Set environment variable: ${envKey}=your_database_id`
    );
  }

  return databaseId;
}
```

## Performance Benchmarks

**Target Performance Goals**:

- Schema generation: <10ms for schemas with 50+ properties
- Property extraction: <1ms per property on average
- Full page transformation: <5ms for typical database pages
- Query operations: <2 seconds for datasets up to 1000 records

**Memory Considerations**:

- Schema cache limited to 100 entries with LRU eviction
- Property extractor functions are stateless to avoid memory leaks
- Streaming support for large datasets to prevent memory exhaustion

## Integration Considerations

**Existing Codebase Compatibility**:

- All new APIs extend existing classes without breaking changes
- Current type inference system (InferSchemaProperties) remains unchanged
- Performance monitoring integrates with existing metrics collection

**Dependencies**:

- Zod 3.x: Schema validation and transformation
- @notionhq/client 5.4.0: Underlying API client (no version change required)
- No additional runtime dependencies introduced

## Risk Mitigation

**Type Safety Validation**:

- Comprehensive unit tests for all property type combinations
- Integration tests with real Notion API responses
- TypeScript strict mode compliance verification

**Performance Monitoring**:

- Schema generation time tracking
- Memory usage alerts for large schema collections
- API rate limit adherence monitoring

**Error Handling Robustness**:

- Graceful degradation for unsupported property types
- Clear error messages for schema mismatches
- Retry logic for transient network failures
