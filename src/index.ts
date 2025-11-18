/**
 * Typed Notion - Type-safe Notion API library
 * 
 * @description A TypeScript library for building type-safe Notion API integrations
 * with compile-time type inference and runtime validation.
 * 
 * @version 1.0.0
 * @author TypedNotion Team
 */

// Core types and interfaces
export type {
  PropertyType,
  PropertyDefinition,
  SchemaDefinition,
  NotionUser,
  InferPropertyType,
  InferSchemaProperties,
  QueryOptions,
  PerformanceMetrics
} from './types/index.js';

// Schema classes and functions
export {
  TypedSchema,
  createTypedSchema,
  validateSchemaDefinition,
  validatePropertyDefinition,
  isValidSchemaDefinition
} from './schema/index.js';

// Error classes
export {
  TypedNotionError,
  SchemaValidationError,
  PropertyAccessError,
  NotionAPIError
} from './errors/index.js';

// Version export
export const VERSION = '1.0.0';