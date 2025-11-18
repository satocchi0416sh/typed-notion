/**
 * Core type system interfaces for the MVP Property Types system
 * 
 * Based on contracts/schema-api.ts and data-model.md
 * Defines the foundational types used throughout the library
 */

/**
 * Supported property types for MVP implementation
 * Maps directly to Notion API property types
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
 * Each property type has its own configuration structure
 */
export type PropertyDefinition = 
  | { type: 'title' }
  | { type: 'rich_text' }
  | { type: 'number'; format?: 'number' | 'percent' | 'dollar' | undefined }
  | { type: 'checkbox' }
  | { type: 'date' }
  | { type: 'url' }
  | { type: 'email' }
  | { type: 'select'; options: readonly string[] }
  | { type: 'multi_select'; options: readonly string[] }
  | { type: 'people' };

/**
 * Schema definition structure
 * Contains database identifier and property definitions
 */
export interface SchemaDefinition {
  readonly databaseId: string;
  readonly properties: Record<string, PropertyDefinition>;
}

/**
 * Notion user reference for people properties
 * Based on Notion API user object structure
 */
export interface NotionUser {
  readonly id: string;
  readonly name?: string | null;
  readonly avatar_url?: string | null;
  readonly type: 'person' | 'bot';
  readonly person?: {
    readonly email?: string;
  } | null;
  readonly bot?: Record<string, unknown> | null;
}

/**
 * Query options for database operations
 * Subset of Notion API query parameters
 */
export interface QueryOptions {
  filter?: Record<string, unknown>;
  sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>;
  page_size?: number;
  start_cursor?: string;
}

/**
 * Performance monitoring interface for NFR-001
 * Tracks schema processing metrics and performance
 */
export interface PerformanceMetrics {
  readonly schemaProcessingTime: number; // milliseconds
  readonly activeSchemaCount: number;
  readonly lastQueryDuration: number;
}