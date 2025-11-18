# Notion Property Types Analysis for TypedNotion Library

## Complete Notion API Property Types (2024)

### Basic Properties
1. **title** - Primary property, rendered as data columns
2. **rich_text** - Text values with formatting support
3. **number** - Numeric values with optional formatting (percent, dollar, etc.)
4. **checkbox** - Boolean values
5. **date** - Date/datetime values  
6. **url** - URL string values
7. **email** - Email string values
8. **phone_number** - Phone number strings

### Selection Properties  
9. **select** - Single option from predefined list
10. **multi_select** - Multiple options from predefined list
11. **status** - Specialized selection for project workflows

### Advanced Properties
12. **people** - User references/mentions
13. **files** - File attachments or external links
14. **relation** - References to other database entries
15. **rollup** - Computed values from related data
16. **formula** - Dynamically computed expressions

### Automatic Properties
17. **created_time** - Auto-generated creation timestamp
18. **created_by** - Auto-generated creator reference
19. **last_edited_time** - Auto-generated last edit timestamp
20. **last_edited_by** - Auto-generated last editor reference
21. **unique_id** - Auto-incremented unique identifiers

## TypeScript Type Mapping Strategy

### Schema Definition Types
```typescript
type PropertyDefinition = 
  | { type: 'title' }
  | { type: 'rich_text' }
  | { type: 'number'; format?: 'number' | 'percent' | 'dollar' }
  | { type: 'checkbox' }
  | { type: 'date' }
  | { type: 'url' }
  | { type: 'email' }
  | { type: 'phone_number' }
  | { type: 'select'; options: readonly string[] }
  | { type: 'multi_select'; options: readonly string[] }
  | { type: 'people' }
  | { type: 'files' };
```

### Runtime Type Mapping
```typescript
interface PropertyTypeMap {
  title: string;
  rich_text: string;
  number: number;
  checkbox: boolean;
  date: Date | null;
  url: string;
  email: string;
  phone_number: string;
  select: string; // Overridden by literal unions
  multi_select: string[]; // Overridden by literal unions  
  people: NotionUser[];
  files: NotionFile[];
}
```

### Type Inference System
```typescript
type InferPropertyType<T extends PropertyDefinition> = 
  T extends { type: 'select'; options: readonly (infer U)[] } 
    ? U
    : T extends { type: 'multi_select'; options: readonly (infer U)[] }
    ? U[]
    : T extends { type: infer K }
    ? K extends keyof PropertyTypeMap 
      ? PropertyTypeMap[K]
      : never
    : never;
```

## Implementation Priority

### MVP (Priority 1-2)
Essential for 80% of use cases:
- title, rich_text, number, checkbox, select, date
- multi_select, url, email, people

### Advanced (Priority 3-4) 
Additional useful properties:
- Auto properties (created_time, created_by, etc.)
- files, phone_number, status, unique_id

### Enterprise (Priority 5)
Complex features requiring additional architecture:
- relation (cross-database references)
- rollup (depends on relation)
- formula (readonly computed values)

## Core Architecture Design

### Schema Definition Function
```typescript
function defineSchema<TProperties extends Record<string, PropertyDefinition>>(config: {
  databaseId: string;
  properties: TProperties;
}): TypedSchema<TProperties>
```

### Usage Pattern
```typescript
const UserDB = defineSchema({
  databaseId: "xxx-xxx",
  properties: {
    Name: { type: "title" },
    Age: { type: "number" },
    Role: { type: "select", options: ["Admin", "User"] as const }
  }
} as const);

// Results in runtime type:
// { Name: string, Age: number, Role: "Admin" | "User" }
```

## Critical Success Factors

1. **Type Inference**: Must preserve exact literal types for select/multi-select options
2. **Schema Validation**: Runtime validation should match compile-time types  
3. **API Mapping**: Transform complex Notion API responses to flat, usable objects
4. **Developer Experience**: Autocomplete and type safety throughout the API

## Next Steps

1. Start with MVP property types implementation
2. Build core schema definition system with type inference
3. Implement query method with proper type transformations
4. Add runtime validation layer
5. Gradually expand to advanced property types