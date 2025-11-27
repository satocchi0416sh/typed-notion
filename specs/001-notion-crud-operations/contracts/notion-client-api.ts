/**
 * TypeScript API Contracts for Enhanced NotionClient
 *
 * This file defines the complete API surface for the enhanced NotionClient
 * with type-safe CRUD operations, automatic data conversion, and Zod integration.
 */

import type { z } from 'zod';

// Core Schema Types (from existing codebase)
export interface SchemaDefinition {
  readonly databaseId: string;
  readonly properties: Record<string, PropertyDefinition>;
}

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
  | { type: 'people' }
  | { type: 'created_time' }
  | { type: 'created_by' }
  | { type: 'last_edited_time' }
  | { type: 'last_edited_by' };

// Enhanced TypedSchema with Zod Generation
export interface EnhancedTypedSchema<T extends SchemaDefinition> {
  readonly definition: T;
  readonly databaseId: string;
  readonly propertyNames: string[];
  readonly createdAt: Date;

  /**
   * Generate Zod validation schema from TypedSchema definition
   * @returns Zod schema matching TypeScript type inference
   */
  toZod(): z.ZodObject<{
    [K in keyof T['properties']]: z.ZodNullable<z.ZodTypeAny>;
  }>;

  /**
   * Validate data against the schema using auto-generated Zod schema
   * @param data - Data to validate
   * @returns Zod safe parse result
   */
  validate(data: unknown): z.SafeParseReturnType<any, InferSchemaProperties<T>>;

  /**
   * Parse and transform data with automatic error handling
   * @param data - Data to parse
   * @returns Parsed data matching schema types
   * @throws ZodError if validation fails
   */
  parse(data: unknown): InferSchemaProperties<T>;

  hasProperty(propertyName: string): boolean;
  getProperty<K extends keyof T['properties']>(propertyName: K): T['properties'][K];
  getTitleProperty(): { name: keyof T['properties']; definition: PropertyDefinition };
}

// Type-Safe Filter System
export type PropertyFilterMap = {
  title: TextFilters;
  rich_text: TextFilters;
  url: TextFilters;
  email: TextFilters;
  number: NumberFilters;
  checkbox: CheckboxFilters;
  date: DateFilters;
  created_time: DateFilters;
  last_edited_time: DateFilters;
  select: SelectFilters;
  multi_select: MultiSelectFilters;
  people: PeopleFilters;
  created_by: PeopleFilters;
  last_edited_by: PeopleFilters;
};

export interface TextFilters {
  equals: string;
  does_not_equal: string;
  contains: string;
  does_not_contain: string;
  starts_with: string;
  ends_with: string;
  is_empty: true;
  is_not_empty: true;
}

export interface NumberFilters {
  equals: number;
  does_not_equal: number;
  greater_than: number;
  less_than: number;
  greater_than_or_equal_to: number;
  less_than_or_equal_to: number;
  is_empty: true;
  is_not_empty: true;
}

export interface CheckboxFilters {
  equals: boolean;
  does_not_equal: boolean;
}

export interface DateFilters {
  equals: string; // ISO 8601 date string
  before: string;
  after: string;
  on_or_before: string;
  on_or_after: string;
  past_week: Record<string, never>;
  past_month: Record<string, never>;
  past_year: Record<string, never>;
  next_week: Record<string, never>;
  next_month: Record<string, never>;
  next_year: Record<string, never>;
  is_empty: true;
  is_not_empty: true;
}

export interface SelectFilters {
  equals: string;
  does_not_equal: string;
  is_empty: true;
  is_not_empty: true;
}

export interface MultiSelectFilters {
  contains: string;
  does_not_contain: string;
  is_empty: true;
  is_not_empty: true;
}

export interface PeopleFilters {
  contains: string; // User ID
  does_not_contain: string;
  is_empty: true;
  is_not_empty: true;
}

// Type-safe filter construction
export type NotionFilter<T extends SchemaDefinition> =
  | {
      [K in keyof T['properties']]: {
        property: K;
      } & {
        [P in T['properties'][K]['type']]: P extends keyof PropertyFilterMap
          ? Partial<PropertyFilterMap[P]>
          : never;
      };
    }[keyof T['properties']]
  | CompoundFilter<T>;

export type CompoundFilter<T extends SchemaDefinition> =
  | {
      and: Array<NotionFilter<T>>;
    }
  | {
      or: Array<NotionFilter<T>>;
    };

// Query and Response Types
export interface QueryOptions<T extends SchemaDefinition = any> {
  filter?: NotionFilter<T>;
  sorts?: Array<{
    property: keyof T['properties'];
    direction: 'ascending' | 'descending';
  }>;
  page_size?: number; // 1-100, default 100
  start_cursor?: string;
  select_properties?: Array<keyof T['properties']>;
}

export interface QueryResponse<T extends SchemaDefinition> {
  results: Array<InferSchemaProperties<T> & { id: string }>;
  next_cursor: string | null;
  has_more: boolean;
  type: 'page_or_database';
  page_or_database: Record<string, unknown>;
  request_id: string;
}

// Main NotionClient Interface
export interface NotionClient {
  /**
   * Query a Notion database with type safety and automatic data conversion
   *
   * @template T - Schema definition type for type inference
   * @param schema - Typed schema definition
   * @param options - Query options including filters and sorting
   * @returns Promise resolving to typed query results
   * @throws NotionAPIError for API failures
   * @throws SchemaValidationError for schema mismatches
   *
   * @example
   * const results = await client.query(userSchema, {
   *   filter: {
   *     property: 'status',
   *     select: { equals: 'active' }
   *   },
   *   sorts: [{ property: 'created_time', direction: 'descending' }]
   * });
   */
  query<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    options?: QueryOptions<T>
  ): Promise<QueryResponse<T>>;

  /**
   * Create a new page in a Notion database with type safety and validation
   *
   * @template T - Schema definition type for type inference
   * @param schema - Typed schema definition
   * @param data - Page data matching schema property types
   * @returns Promise resolving to created page data with ID
   * @throws NotionAPIError for API failures
   * @throws ValidationError for data validation failures
   *
   * @example
   * const newUser = await client.create(userSchema, {
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   status: 'active'
   * });
   */
  create<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    data: Partial<InferSchemaProperties<T>>
  ): Promise<InferSchemaProperties<T> & { id: string }>;

  /**
   * Update an existing page in a Notion database with type safety
   *
   * @template T - Schema definition type for type inference
   * @param pageId - Notion page ID to update
   * @param schema - Typed schema definition
   * @param data - Partial data for properties to update
   * @returns Promise resolving to updated page data
   * @throws NotionAPIError for API failures
   * @throws ValidationError for data validation failures
   *
   * @example
   * const updatedUser = await client.update('page_id', userSchema, {
   *   status: 'inactive'
   * });
   */
  update<T extends SchemaDefinition>(
    pageId: string,
    schema: EnhancedTypedSchema<T>,
    data: Partial<InferSchemaProperties<T>>
  ): Promise<InferSchemaProperties<T> & { id: string }>;

  /**
   * Validate that a schema definition matches the actual Notion database structure
   *
   * @template T - Schema definition type
   * @param schema - Schema to validate
   * @returns Promise resolving to validation result
   * @throws NotionAPIError for API failures
   */
  validateSchema<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>
  ): Promise<SchemaValidationResult>;

  /**
   * Retrieve a single page by ID with automatic type conversion
   *
   * @template T - Schema definition type for type inference
   * @param pageId - Notion page ID
   * @param schema - Typed schema definition for conversion
   * @returns Promise resolving to typed page data
   * @throws NotionAPIError for API failures
   * @throws SchemaValidationError for type mismatches
   */
  getPage<T extends SchemaDefinition>(
    pageId: string,
    schema: EnhancedTypedSchema<T>
  ): Promise<InferSchemaProperties<T> & { id: string }>;
}

// Error Types
export class NotionAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly notionCode?: string
  ) {
    super(message);
    this.name = 'NotionAPIError';
  }
}

export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly property?: string,
    public readonly expected?: string,
    public readonly received?: string
  ) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

export class ConversionError extends Error {
  constructor(
    message: string,
    public readonly type: 'VALIDATION_ERROR' | 'CONVERSION_ERROR' | 'SCHEMA_MISMATCH',
    public readonly input?: unknown,
    public readonly propertyName?: string
  ) {
    super(message);
    this.name = 'ConversionError';
  }
}

// Configuration Types
export interface NotionClientConfig {
  auth: string; // Notion API key
  notionVersion?: string; // API version (defaults to latest)
  timeout?: number; // Request timeout in milliseconds
  retryDelayMs?: number; // Delay between retries (default: 334ms for 3 req/s)
  maxRetries?: number; // Maximum retry attempts (default: 3)
  enablePerformanceTracking?: boolean; // Enable performance metrics collection
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingProperties: string[];
  extraProperties: string[];
  typeConflicts: Array<{
    property: string;
    expected: string;
    actual: string;
  }>;
}

// Type Inference Helper (Enhanced)
export type InferSchemaProperties<T extends SchemaDefinition> = {
  readonly [K in keyof T['properties']]: T['properties'][K] extends {
    type: infer Type;
    options?: infer Options;
  }
    ? Type extends 'title' | 'rich_text' | 'url' | 'email'
      ? string | null
      : Type extends 'number'
        ? number | null
        : Type extends 'checkbox'
          ? boolean | null
          : Type extends 'date' | 'created_time' | 'last_edited_time'
            ? Date | null
            : Type extends 'select'
              ? Options extends readonly (infer U)[]
                ? U | null
                : string | null
              : Type extends 'multi_select'
                ? Options extends readonly (infer U)[]
                  ? U[] | null
                  : string[] | null
                : Type extends 'people' | 'created_by' | 'last_edited_by'
                  ? NotionUser[] | null
                  : never
    : never;
};

export interface NotionUser {
  id: string;
  type: 'person' | 'bot';
  name?: string | null;
  avatar_url?: string | null;
  person?: {
    email?: string;
  };
  bot?: Record<string, unknown>;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  schemaProcessingTime: number; // milliseconds
  activeSchemaCount: number;
  lastQueryDuration: number; // milliseconds
  cacheHitRate: number; // percentage
  apiRequestCount: number;
  rateLimitHits: number;
  averageResponseTime: number; // milliseconds
}

// Filter Builder Utility (Optional convenience API)
export interface FilterBuilder<T extends SchemaDefinition> {
  /**
   * Add property filter condition
   * @param property - Schema property name
   * @param operator - Valid operator for property type
   * @param value - Value for comparison (typed based on property)
   */
  where<K extends keyof T['properties']>(
    property: K,
    condition: Partial<PropertyFilterMap[T['properties'][K]['type']]>
  ): FilterBuilder<T>;

  /**
   * Combine filters with AND logic
   * @param filter - Additional filter to combine
   */
  and(filter: NotionFilter<T>): FilterBuilder<T>;

  /**
   * Combine filters with OR logic
   * @param filter - Alternative filter condition
   */
  or(filter: NotionFilter<T>): FilterBuilder<T>;

  /**
   * Build final filter object
   * @returns Constructed NotionFilter
   */
  build(): NotionFilter<T>;
}
