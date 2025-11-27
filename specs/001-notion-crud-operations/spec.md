# Feature Specification: Practical CRUD Operations for typed-notion-core-ts

**Feature Branch**: `001-notion-crud-operations`  
**Created**: 2025-01-23  
**Status**: Draft  
**Input**: User description: "Implement practical CRUD operations and improve developer experience for typed-notion-core-ts based on real-world usage analysis showing critical gaps in functionality, type inference with Zod integration, automatic data conversion, and usable NotionClient implementation"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Functional Database Operations (Priority: P1)

As a developer using typed-notion-core-ts, I want to perform basic database operations (query, create, update) through the NotionClient so that I can interact with Notion databases without falling back to the raw @notionhq/client API and losing type safety benefits.

**Why this priority**: This is the core functionality that makes the library practical. Without working CRUD operations, developers cannot actually use the library for real applications and must resort to manual API calls, negating all type safety benefits.

**Independent Test**: Can be fully tested by connecting to a test Notion database, creating a schema, and performing query/create/update operations through the NotionClient, delivering complete database interaction capability.

**Acceptance Scenarios**:

1. **Given** a schema is defined with createTypedSchema, **When** I call client.query(schema), **Then** I receive typed results matching the schema properties
2. **Given** typed data matching a schema, **When** I call client.create(schema, data), **Then** a new page is created in Notion with the provided data
3. **Given** an existing page ID and update data, **When** I call client.update(pageId, schema, data), **Then** the page is updated with type-safe validation

---

### User Story 2 - Automatic Data Type Conversion (Priority: P2)

As a developer using typed-notion-core-ts, I want automatic conversion between Notion API response formats and TypeScript types so that I don't need to manually handle date parsing, property extraction, and type casting for every database operation.

**Why this priority**: Manual data conversion is error-prone and time-consuming. Developers expect the library to handle format differences between Notion's API and TypeScript seamlessly.

**Independent Test**: Can be tested by querying a database with various property types (dates, selections, rich text) and verifying that returned data matches TypeScript types without manual conversion.

**Acceptance Scenarios**:

1. **Given** a Notion database with date properties, **When** I query through the typed client, **Then** date strings are automatically converted to Date objects
2. **Given** rich text and title properties from Notion, **When** I receive query results, **Then** they are automatically extracted as plain strings
3. **Given** select and multi-select properties, **When** I receive query results, **Then** they maintain their literal type constraints

---

### User Story 3 - Unified Type Management with Zod (Priority: P3)

As a developer using typed-notion-core-ts, I want to generate Zod validation schemas automatically from my typed schemas so that I don't need to maintain separate TypeScript types and Zod schemas for the same data structures.

**Why this priority**: Eliminates code duplication and reduces maintenance burden. Developers shouldn't need to define the same structure twice in different formats.

**Independent Test**: Can be tested by defining a schema, generating a Zod schema from it, and using both for type inference and runtime validation of the same data.

**Acceptance Scenarios**:

1. **Given** a typed schema definition, **When** I call schema.toZod(), **Then** I receive a Zod schema with matching validation rules
2. **Given** an auto-generated Zod schema, **When** I validate data against it, **Then** it enforces the same constraints as the original typed schema
3. **Given** schema-derived types, **When** I use InferSchemaProperties<typeof schema>, **Then** I get accurate TypeScript types without manual definition

---

### User Story 4 - Simplified Database Configuration (Priority: P4)

As a developer using typed-notion-core-ts, I want schemas to automatically use database IDs from environment variables or configuration so that I don't need to manually pass database IDs or leave them as empty strings in my schema definitions.

**Why this priority**: Improves developer experience and reduces configuration errors. Database IDs are environment-specific and shouldn't be hardcoded.

**Independent Test**: Can be tested by defining schemas without explicit database IDs and verifying they automatically resolve from environment configuration.

**Acceptance Scenarios**:

1. **Given** schemas defined without explicit database IDs, **When** I use them with the client, **Then** they automatically resolve from environment variables
2. **Given** multiple database schemas in a project, **When** I configure database mappings, **Then** each schema connects to the correct database automatically

---

### Edge Cases

- What happens when Notion API returns null or undefined property values?
- How does the system handle malformed date strings from Notion?
- What occurs when schema properties don't match the actual Notion database structure? (System throws detailed validation errors listing specific mismatches)
- How does the client handle network timeouts and Notion API rate limits?
- What happens when required properties are missing from Notion responses?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: NotionClient MUST provide typed query() method that returns data matching schema property types and supports type-safe filter objects that map to schema properties
- **FR-002**: NotionClient MUST provide typed create() method that validates input data against schema constraints
- **FR-003**: NotionClient MUST provide typed update() method that allows partial updates with type safety
- **FR-004**: System MUST automatically convert Notion date properties (date, created_time, last_edited_time) to Date objects
- **FR-005**: System MUST automatically extract plain text from Notion title and rich_text properties
- **FR-006**: System MUST preserve literal type constraints for select and multi_select properties in query results
- **FR-007**: TypedSchema MUST provide toZod() method that generates corresponding Zod validation schemas
- **FR-008**: Generated Zod schemas MUST enforce basic property types plus select/multi-select options validation matching the original typed schema
- **FR-009**: InferSchemaProperties<T> MUST accurately derive TypeScript types from schema definitions without manual type definitions
- **FR-010**: Schemas MUST support automatic database ID resolution from environment variables using NOTION*DB*[SCHEMA_NAME] naming convention
- **FR-011**: System MUST handle Notion API errors gracefully and provide meaningful error messages
- **FR-012**: System MUST validate that schema properties match actual Notion database structure before operations and throw detailed validation errors listing specific property mismatches when validation fails

### Key Entities

- **NotionClient**: Main interface for database operations, wraps @notionhq/client with type safety
- **TypedSchema**: Enhanced schema definition that supports CRUD operations and Zod generation
- **SchemaProperties**: Auto-inferred TypeScript types that match exactly with schema definitions
- **DatabaseOperation**: Query, create, and update operations with automatic type conversion
- **ValidationSchema**: Auto-generated Zod schemas that mirror typed schema constraints

## Clarifications

### Session 2025-01-23

- Q: How should query filtering be structured to maintain type safety while providing practical query capabilities? → A: Type-safe filter objects that map to schema properties (e.g., {title: {contains: "text"}})
- Q: What naming convention should be used for environment variables that map schemas to database IDs? → A: Use NOTION*DB*[SCHEMA_NAME] format (e.g., NOTION_DB_USER_PROFILE)
- Q: How should the system handle mismatches between schema definitions and actual Notion database structure? → A: Throw detailed validation errors listing specific property mismatches
- Q: What performance targets should the system meet for typical database operations? → A: Query operations under 2 seconds for typical datasets
- Q: What validation rules should auto-generated Zod schemas include beyond basic property types? → A: Basic types plus select options validation

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Developers can perform complete database CRUD operations without using raw @notionhq/client API calls
- **SC-002**: Type inference accuracy reaches 100% - InferSchemaProperties<T> generates exact types matching schema definitions
- **SC-003**: Data conversion is automatic - developers receive TypeScript types without manual parsing for all supported property types
- **SC-004**: Code duplication is eliminated - developers define data structures once and get both TypeScript types and Zod validation
- **SC-005**: Configuration complexity is reduced - schemas work without manual database ID management in 90% of use cases
- **SC-006**: Error handling improves - developers receive clear error messages for schema mismatches and API failures instead of generic Notion API errors
- **SC-007**: Query operations complete within 2 seconds for typical datasets to ensure responsive developer experience
