# Data Model: Practical CRUD Operations for typed-notion-core-ts

**Feature Branch**: `001-notion-crud-operations` | **Date**: 2025-01-23

## Entity Overview

This feature extends the existing typed-notion-core-ts data model with new entities for practical CRUD operations, automatic data conversion, and enhanced developer experience.

## Core Entities

### 1. EnhancedNotionClient

**Purpose**: Main interface for type-safe database operations that wraps @notionhq/client with automatic data conversion

**Properties**:

- `client: NotionApiClient` - Underlying Notion API client instance
- `queryManager: QueryManager` - Rate limiting and performance management
- `transformerCache: Map<string, NotionPageTransformer<any>>` - Cached transformers for schemas

**Key Methods**:

- `query<T>(schema, filter?, options?)` - Type-safe database querying with automatic conversion
- `create<T>(schema, data)` - Create pages with schema validation
- `update<T>(pageId, schema, data)` - Update pages with partial data support
- `validateSchema<T>(schema, databaseId)` - Verify schema matches actual Notion database

**Relationships**:

- Uses TypedSchema for schema definitions
- Creates NotionPageTransformer instances for data conversion
- Manages QueryFilter objects for type-safe filtering

**Validation Rules**:

- Schema parameter must be valid TypedSchema instance
- Filter objects must match schema property types
- Data parameters must conform to inferred schema types

### 2. NotionPageTransformer\<T\>

**Purpose**: Converts raw Notion API responses into typed objects matching schema definitions

**Properties**:

- `schema: TypedSchema<T>` - Schema definition for transformation
- `extractorMap: Map<PropertyType, PropertyExtractor>` - Property-specific extraction functions
- `performanceMetrics: TransformationMetrics` - Performance tracking data

**Key Methods**:

- `transform(notionPage): Result<InferSchemaProperties<T>, ConversionError>` - Main transformation method
- `extractProperty(property, type): any` - Extract single property value
- `validatePropertyStructure(property, expectedType): boolean` - Verify property structure

**Relationships**:

- Bound to specific TypedSchema instance
- Uses PropertyExtractor functions for conversion
- Returns ConversionError for failed transformations

**State Transitions**:

- Created → Ready (after schema validation)
- Ready → Transforming (during data conversion)
- Transforming → Complete (successful transformation)
- Transforming → Error (conversion failure)

### 3. QueryFilter\<T\>

**Purpose**: Type-safe filter objects that map to valid Notion API query filters

**Properties**:

- `property: keyof T` - Property name from schema
- `operator: ValidOperator<T[property]>` - Type-safe operator for property type
- `value: FilterValue<T[property], operator>` - Typed value for comparison

**Key Methods**:

- `toNotionFilter(): NotionAPIFilter` - Convert to Notion API filter format
- `validate(): ValidationResult` - Verify filter is valid for property type
- `combine(other, logic): CompoundFilter<T>` - Combine with AND/OR logic

**Relationships**:

- Maps to specific schema property types
- Validates against PropertyFilterMap definitions
- Converts to Notion API filter format

**Validation Rules**:

- Property must exist in schema definition
- Operator must be valid for property type
- Value must match property type constraints (e.g., select options)

### 4. ZodSchemaGenerator

**Purpose**: Generates Zod validation schemas from TypedSchema definitions

**Properties**:

- `propertySchemaMap: Map<PropertyType, ZodCreator>` - Property-to-Zod mapping functions
- `schemaCache: Map<string, z.ZodObject<any>>` - Generated schema cache
- `cacheMetrics: CacheMetrics` - Performance tracking for cache usage

**Key Methods**:

- `generateSchema<T>(definition): z.ZodObject<T>` - Create Zod schema from schema definition
- `createPropertySchema(property): z.ZodSchema<any>` - Generate schema for single property
- `getCachedSchema(definition): z.ZodObject<any>` - Retrieve or generate cached schema

**Relationships**:

- Extends TypedSchema class functionality
- Uses PropertyDefinition types for schema generation
- Integrates with existing schema validation system

**Validation Rules**:

- Generated schemas must match TypeScript type inference
- Select/multi-select options must be preserved as literal types
- All property types must be nullable to match Notion API behavior

### 5. DatabaseConfigurationManager

**Purpose**: Manages automatic database ID resolution and environment configuration

**Properties**:

- `environmentMap: Map<string, string>` - Schema name to database ID mappings
- `configCache: Map<string, DatabaseConfig>` - Cached configuration objects
- `validationResults: Map<string, SchemaValidationResult>` - Database structure validation cache

**Key Methods**:

- `resolveDatabaseId(schemaName): string` - Get database ID from environment
- `validateSchemaStructure(schema, databaseId): Promise<ValidationResult>` - Verify schema matches database
- `updateConfiguration(schemaName, databaseId): void` - Update configuration mapping

**Relationships**:

- Works with TypedSchema instances for configuration
- Validates against actual Notion database structures
- Provides database IDs to NotionClient operations

**Environment Variables**:

- `NOTION_DB_[SCHEMA_NAME]` - Database ID for specific schema
- `NOTION_API_KEY` - Notion integration token (existing)
- `NOTION_ENVIRONMENT` - Environment identifier (dev/staging/prod)

## Supporting Types

### Result\<T, E\>

**Purpose**: Type-safe error handling for conversion operations

```typescript
type Result<T, E = ConversionError> = { kind: 'ok'; value: T } | { kind: 'err'; error: E };
```

### ConversionError

**Purpose**: Structured error information for failed data conversions

**Properties**:

- `type: 'VALIDATION_ERROR' | 'CONVERSION_ERROR' | 'SCHEMA_MISMATCH'`
- `message: string` - Human-readable error description
- `input: unknown` - Original input that caused the error
- `propertyName?: string` - Specific property that failed (if applicable)

### PropertyFilterMap

**Purpose**: Maps property types to valid filter operators

```typescript
type PropertyFilterMap = {
  title: { equals: string; contains: string; is_empty: true /* ... */ };
  number: { equals: number; greater_than: number; less_than: number /* ... */ };
  select: { equals: string; does_not_equal: string; is_empty: true /* ... */ };
  // ... all 14 property types with their specific operators
};
```

### TransformationMetrics

**Purpose**: Performance tracking for data conversion operations

**Properties**:

- `transformationTime: number` - Milliseconds to complete transformation
- `propertyCount: number` - Number of properties processed
- `errorCount: number` - Number of property conversion errors
- `cacheHitRate: number` - Percentage of cached transformer usage

## Data Flow

### Query Operation Flow

1. **Filter Creation**: Developer creates type-safe filter objects mapped to schema properties
2. **Filter Validation**: System validates operators are valid for property types
3. **API Query**: NotionClient converts filters to Notion API format and executes query
4. **Response Transformation**: NotionPageTransformer converts raw responses to typed objects
5. **Result Return**: Type-safe objects returned matching schema definition

### Schema Generation Flow

1. **Schema Definition**: Developer defines schema using createTypedSchema
2. **Zod Generation**: ZodSchemaGenerator creates corresponding validation schema
3. **Cache Storage**: Generated schema stored in cache for reuse
4. **Validation Usage**: Zod schema used for runtime validation of data

### Configuration Resolution Flow

1. **Schema Name Extraction**: System extracts schema identifier from definition
2. **Environment Lookup**: DatabaseConfigurationManager resolves database ID from env vars
3. **Structure Validation**: Optional validation that schema matches actual database
4. **Configuration Caching**: Resolved configuration cached for subsequent operations

## Backwards Compatibility

All new entities extend existing functionality without breaking changes:

- **TypedSchema**: Enhanced with `toZod()` method, existing API unchanged
- **PropertyDefinition**: Extended to support literal type preservation, existing types compatible
- **InferSchemaProperties**: Enhanced accuracy, existing inference patterns maintained
- **NotionClient**: New implementation, existing placeholder replaced

Existing applications using typed-notion-core-ts will continue working with all new functionality available as opt-in enhancements.
