/**
 * Typed Notion - Type-safe Notion API library
 * 
 * @description A TypeScript library for building type-safe Notion API integrations
 * with compile-time type inference and runtime validation for all MVP property types.
 * 
 * ## Features
 * 
 * - **Type-safe schema definition** for 10 MVP Notion property types
 * - **Compile-time type inference** with literal type preservation for selections
 * - **Runtime validation** with comprehensive error handling
 * - **Zero `any` types** in public API
 * - **Performance monitoring** with metrics collection
 * - **Null safety** - all property values are nullable by default
 * 
 * ## Supported Property Types
 * 
 * ### Basic Properties (User Story 1)
 * - `title` - Page title (exactly one required per schema)
 * - `number` - Numeric values with optional formatting (number, percent, dollar)
 * - `checkbox` - Boolean values
 * 
 * ### Text and Selection Properties (User Story 2)
 * - `rich_text` - Formatted text content
 * - `select` - Single selection from predefined options (literal type preservation)
 * - `multi_select` - Multiple selections from predefined options (literal type arrays)
 * 
 * ### Contact Properties (User Story 3)
 * - `date` - Date values with Date object validation
 * - `email` - Email addresses with format validation
 * - `url` - URLs with protocol validation (http/https only)
 * - `people` - References to Notion users with structure validation
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { createTypedSchema } from 'typed-notion';
 * 
 * // Define a schema with type-safe property definitions
 * const taskSchema = createTypedSchema({
 *   databaseId: '12345678-1234-5678-9abc-123456789abc',
 *   properties: {
 *     Title: { type: 'title' },
 *     Description: { type: 'rich_text' },
 *     Status: { 
 *       type: 'select', 
 *       options: ['Todo', 'In Progress', 'Done'] as const 
 *     },
 *     Tags: { 
 *       type: 'multi_select',
 *       options: ['Bug', 'Feature', 'Enhancement'] as const
 *     },
 *     DueDate: { type: 'date' },
 *     AssigneeEmail: { type: 'email' },
 *     ProjectURL: { type: 'url' },
 *     TeamMembers: { type: 'people' },
 *     Priority: { type: 'number' },
 *     IsActive: { type: 'checkbox' }
 *   }
 * } as const);
 * 
 * // TypeScript automatically infers literal types for selections:
 * // Status: 'Todo' | 'In Progress' | 'Done' | null
 * // Tags: ('Bug' | 'Feature' | 'Enhancement')[] | null
 * 
 * // Use the schema for type-safe property access
 * const statusProperty = taskSchema.getProperty('Status');
 * const validator = taskSchema.createPropertyValidator();
 * 
 * // Runtime validation with type safety
 * const isValid = validator('Status', 'Todo'); // true
 * const isInvalid = validator('Status', 'Invalid'); // false
 * ```
 * 
 * ## Advanced Usage Examples
 * 
 * ### CRM Contact Schema
 * ```typescript
 * const contactSchema = createTypedSchema({
 *   databaseId: '12345678-1234-5678-9abc-123456789abc',
 *   properties: {
 *     CompanyName: { type: 'title' },
 *     ContactEmail: { type: 'email' },
 *     Website: { type: 'url' },
 *     LastContact: { type: 'date' },
 *     AccountManager: { type: 'people' },
 *     Industry: { 
 *       type: 'select',
 *       options: ['Technology', 'Healthcare', 'Finance'] as const
 *     },
 *     Revenue: { type: 'number', format: 'dollar' },
 *     IsActive: { type: 'checkbox' }
 *   }
 * } as const);
 * ```
 * 
 * ### Event Management Schema
 * ```typescript
 * const eventSchema = createTypedSchema({
 *   databaseId: '12345678-1234-5678-9abc-123456789abc',
 *   properties: {
 *     EventName: { type: 'title' },
 *     Description: { type: 'rich_text' },
 *     StartDate: { type: 'date' },
 *     EndDate: { type: 'date' },
 *     RegistrationURL: { type: 'url' },
 *     OrganizerEmail: { type: 'email' },
 *     Speakers: { type: 'people' },
 *     Category: {
 *       type: 'select',
 *       options: ['Conference', 'Workshop', 'Webinar'] as const
 *     },
 *     MaxAttendees: { type: 'number' }
 *   }
 * } as const);
 * ```
 * 
 * ## Error Handling
 * 
 * ```typescript
 * import { SchemaValidationError, PropertyValidationError } from 'typed-notion';
 * 
 * try {
 *   const schema = createTypedSchema(invalidSchemaDefinition);
 * } catch (error) {
 *   if (error instanceof SchemaValidationError) {
 *     console.error('Schema validation failed:', error.message);
 *     console.error('Context:', error.context);
 *   }
 * }
 * ```
 * 
 * ## Performance Monitoring
 * 
 * ```typescript
 * import { getPerformanceMetrics } from 'typed-notion';
 * 
 * const metrics = getPerformanceMetrics();
 * console.log('Schema processing time:', metrics.schemaProcessingTime);
 * console.log('Active schemas:', metrics.activeSchemaCount);
 * ```
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

// Performance monitoring
export {
  getPerformanceMetrics,
  getDetailedPerformanceStats,
  checkPerformanceHealth,
  resetPerformanceMetrics,
  measurePerformance,
  measurePerformanceAsync,
  timed
} from './utils/performance.js';

// Version export
export const VERSION = '1.0.0';