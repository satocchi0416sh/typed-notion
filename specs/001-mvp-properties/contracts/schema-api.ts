/**
 * API Contracts: MVP Property Types Schema System
 * Generated from functional requirements in spec.md
 * 
 * This defines the public API surface for the schema definition system
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Supported property types for MVP implementation
 */
export type PropertyType = 
  | 'title'
  | 'rich_text'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'url'
  | 'email'
  | 'select'
  | 'multi_select'
  | 'people';

/**
 * Property definition configurations
 */
export type PropertyDefinition = 
  | { type: 'title' }
  | { type: 'rich_text' }
  | { type: 'number'; format?: 'number' | 'percent' | 'dollar' }
  | { type: 'checkbox' }
  | { type: 'date' }
  | { type: 'url' }
  | { type: 'email' }
  | { type: 'select'; options: readonly string[] }
  | { type: 'multi_select'; options: readonly string[] }
  | { type: 'people' };

/**
 * Schema definition structure
 */
export interface SchemaDefinition {
  readonly databaseId: string;
  readonly properties: Record<string, PropertyDefinition>;
}

/**
 * Notion user reference for people properties
 */
export interface NotionUser {
  readonly id: string;
  readonly name?: string;
  readonly avatar_url?: string;
  readonly type: 'person' | 'bot';
}

// ============================================================================
// TYPE INFERENCE SYSTEM
// ============================================================================

/**
 * Maps property types to their TypeScript equivalents
 */
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

/**
 * Infers the TypeScript type for a property definition
 */
export type InferPropertyType<T extends PropertyDefinition> = 
  T extends { type: 'select'; options: readonly (infer U)[] } 
    ? U | null
    : T extends { type: 'multi_select'; options: readonly (infer U)[] }
    ? (U[] | null)
    : T extends { type: infer K }
    ? K extends keyof PropertyTypeMap 
      ? PropertyTypeMap[K]
      : never
    : never;

/**
 * Infers property types for an entire schema
 */
export type InferSchemaProperties<S extends SchemaDefinition> = {
  [K in keyof S['properties']]: InferPropertyType<S['properties'][K]>
};

// ============================================================================
// RUNTIME OBJECTS
// ============================================================================

/**
 * Typed schema instance for runtime use
 */
export interface TypedSchema<TDefinition extends SchemaDefinition> {
  readonly definition: TDefinition;
  readonly createdAt: Date;
  
  // Method contracts from FR-001, FR-008
  getDatabaseId(): string;
  getPropertyDefinition<K extends keyof TDefinition['properties']>(
    propertyName: K
  ): TDefinition['properties'][K];
  
  // FR-007: Provide property name validation
  hasProperty(propertyName: string): propertyName is keyof TDefinition['properties'];
}

/**
 * Query result with typed property access
 */
export interface QueryResult<TSchema extends SchemaDefinition> {
  readonly id: string;
  readonly props: InferSchemaProperties<TSchema>; // FR-012: Object property access
  readonly createdTime: Date;
  readonly lastEditedTime: Date;
}

// ============================================================================
// PRIMARY API FUNCTIONS
// ============================================================================

/**
 * Schema definition function - FR-001
 * Validates schema at creation time - FR-008
 */
export declare function defineSchema<TProperties extends Record<string, PropertyDefinition>>(
  config: {
    databaseId: string;
    properties: TProperties;
  }
): TypedSchema<{ databaseId: string; properties: TProperties }>;

/**
 * Query database with schema validation
 * @throws {SchemaValidationError} When schema is invalid
 * @throws {PropertyAccessError} When accessing undefined properties  
 * @throws {NotionAPIError} When Notion API calls fail
 */
export declare function query<TSchema extends SchemaDefinition>(
  schema: TypedSchema<TSchema>,
  options?: QueryOptions
): Promise<QueryResult<TSchema>[]>;

/**
 * Query options for database operations
 */
export interface QueryOptions {
  filter?: Record<string, unknown>;
  sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>;
  page_size?: number;
  start_cursor?: string;
}

// ============================================================================
// ERROR CONTRACTS
// ============================================================================

/**
 * Base error class for all typed exceptions - FR-011
 */
export abstract class TypedNotionError extends Error {
  abstract readonly code: string;
  abstract readonly context: Record<string, unknown>;
}

/**
 * Schema validation error - FR-008
 */
export class SchemaValidationError extends TypedNotionError {
  readonly code = 'SCHEMA_VALIDATION_ERROR';
  readonly context: { property: string; expected: string; received: unknown };
  
  constructor(property: string, expected: string, received: unknown) {
    super(`Invalid property type for '${property}': expected ${expected}, received ${typeof received}`);
    this.context = { property, expected, received };
  }
}

/**
 * Property access error for undefined properties
 */
export class PropertyAccessError extends TypedNotionError {
  readonly code = 'PROPERTY_ACCESS_ERROR';
  readonly context: { property: string; schema: string };
  
  constructor(property: string, schema: string) {
    super(`Property '${property}' not defined in schema`);
    this.context = { property, schema };
  }
}

/**
 * Notion API interaction errors
 */
export class NotionAPIError extends TypedNotionError {
  readonly code = 'NOTION_API_ERROR';
  readonly context: { status: number; message: string; request_id?: string };
  
  constructor(status: number, message: string, request_id?: string) {
    super(`Notion API error (${status}): ${message}`);
    this.context = { status, message, request_id };
  }
}

// ============================================================================
// PERFORMANCE CONTRACTS
// ============================================================================

/**
 * Performance monitoring interface - NFR-001
 */
export interface PerformanceMetrics {
  readonly schemaProcessingTime: number; // milliseconds
  readonly activeSchemaCount: number;
  readonly lastQueryDuration: number;
}

/**
 * Get current performance metrics
 */
export declare function getPerformanceMetrics(): PerformanceMetrics;

// ============================================================================
// TYPE EXPORTS FOR CONSUMERS
// ============================================================================

export type {
  PropertyType,
  PropertyDefinition,
  SchemaDefinition,
  NotionUser,
  InferPropertyType,
  InferSchemaProperties,
  TypedSchema,
  QueryResult,
  QueryOptions,
  PerformanceMetrics
};