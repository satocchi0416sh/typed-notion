# Data Model: MVP Property Types

**Feature**: Implement MVP Property Types  
**Date**: 2024-11-18  
**Source**: Extracted from [spec.md](./spec.md) functional requirements and key entities

## Core Entities

### Schema Definition

**Purpose**: Configuration object for defining database structure and property constraints

**Fields**:
- `databaseId: string` - Notion database identifier (required)
- `properties: Record<string, PropertyDefinition>` - Property name to definition mapping (required)

**Relationships**:
- Contains 1-N PropertyDefinitions
- Must have exactly one PropertyDefinition with type 'title'

**Validation Rules**:
- Database ID must be valid Notion database identifier format
- Property names must be non-empty strings
- Exactly one title property required (enforced at creation time)
- Maximum 20 properties per schema (performance constraint)

**State Transitions**:
- Created → Validated (immediate validation at creation)
- Validated → Active (ready for use in queries)

### Property Definition

**Purpose**: Type-specific configuration for individual database properties

**Base Fields**:
- `type: PropertyType` - One of supported MVP property types (required)

**Type-Specific Fields**:
- For `select`: `options: readonly string[]` (required)
- For `multi_select`: `options: readonly string[]` (required)  
- For `number`: `format?: 'number' | 'percent' | 'dollar'` (optional)

**Supported Types (MVP)**:
```typescript
type PropertyType = 
  | 'title'
  | 'rich_text'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'url'
  | 'email'
  | 'select'
  | 'multi_select'
  | 'people'
```

**Validation Rules**:
- Type must be one of supported MVP types
- Select/multi-select must have non-empty options array
- Options array must contain unique string values
- Title type allows only one instance per schema

### Typed Schema

**Purpose**: Runtime object providing type-safe access to schema configuration

**Fields**:
- `definition: SchemaDefinition` - Original schema configuration (readonly)
- `typeMap: PropertyTypeMap` - Computed type mappings (readonly)
- `createdAt: Date` - Creation timestamp (readonly)

**Relationships**:
- References one SchemaDefinition
- Generates one PropertyTypeMap

**Validation Rules**:
- Immutable after creation
- Type map must match definition exactly
- Creation time validation completed successfully

**State Transitions**:
- Instantiated → Validated → Ready

### Property Type Map  

**Purpose**: Internal mapping between property types and TypeScript types

**Structure**:
```typescript
interface PropertyTypeMap {
  title: string | null;
  rich_text: string | null;
  number: number | null;
  checkbox: boolean | null;
  date: Date | null;
  url: string | null;
  email: string | null;
  select: string | null; // Overridden by literal unions
  multi_select: string[] | null; // Overridden by literal unions  
  people: NotionUser[] | null;
}
```

**Validation Rules**:
- All types include null (optional by default)
- Select types use literal union types at compile time
- Consistent with Notion API specifications

### Query Result

**Purpose**: Typed object representing database query response with schema-aware property access

**Structure**:
```typescript
interface QueryResult<TSchema extends SchemaDefinition> {
  id: string; // Notion page ID
  props: InferSchemaProperties<TSchema>; // Typed property access
  createdTime: Date;
  lastEditedTime: Date;
}
```

**Property Access Pattern**:
- Object notation: `result.props.propertyName`
- Full type safety based on schema definition
- Autocompletion for property names and values

**Validation Rules**:
- Property values match schema type definitions
- Missing properties default to null
- Invalid property access prevented at compile time

### Exception Types

**Purpose**: Typed exceptions for different error conditions

#### SchemaValidationError
```typescript
class SchemaValidationError extends TypedNotionError {
  readonly code = 'SCHEMA_VALIDATION_ERROR';
  constructor(
    public readonly property: string,
    public readonly expected: string,
    public readonly received: unknown
  ) {
    super(`Invalid property type for '${property}': expected ${expected}`);
  }
}
```

#### PropertyAccessError
```typescript
class PropertyAccessError extends TypedNotionError {
  readonly code = 'PROPERTY_ACCESS_ERROR';
  constructor(
    public readonly property: string,
    public readonly schema: string
  ) {
    super(`Property '${property}' not defined in schema '${schema}'`);
  }
}
```

## Type Inference System

### Core Type Transformation

```typescript
type InferPropertyType<T extends PropertyDefinition> = 
  T extends { type: 'select'; options: readonly (infer U)[] } 
    ? U | null
    : T extends { type: 'multi_select'; options: readonly (infer U)[] }
    ? (U[] | null)
    : T extends { type: infer K }
    ? K extends keyof PropertyTypeMap 
      ? PropertyTypeMap[K]
      : never
    : never;
```

### Schema Properties Mapping

```typescript
type InferSchemaProperties<S extends SchemaDefinition> = {
  [K in keyof S['properties']]: InferPropertyType<S['properties'][K]>
};
```

## Performance Constraints

- **Schema Processing**: <2 seconds for schemas with up to 20 properties
- **Concurrent Schemas**: Maximum 100 active schema instances
- **Memory Usage**: Efficient property type caching to minimize allocation
- **Autocompletion**: <30 seconds for IDE type inference

## Validation Strategy

1. **Creation-Time Validation**: Schema definitions validated immediately upon creation
2. **Compile-Time Type Safety**: TypeScript prevents invalid property access
3. **Runtime Value Validation**: Property values validated against schema using Valibot
4. **Error Context**: Rich error information for debugging and development