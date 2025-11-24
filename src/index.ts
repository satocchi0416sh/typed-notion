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
 * import { createTypedSchema, NotionClient } from 'typed-notion';
 *
 * // ✅ CORRECT: Define a schema with proper structure
 * const taskSchema = createTypedSchema({
 *   databaseId: '12345678-1234-5678-9abc-123456789abc',  // Required!
 *   properties: {                                        // Required wrapper!
 *     Title: { type: 'title' },                         // ✅ Simple property definition
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
 * // ❌ WRONG: Common mistakes to avoid
 * // const wrongSchema = createTypedSchema({
 * //   Title: { type: 'title', title: {} },        // ❌ No extra 'title' property needed
 * //   Status: { type: 'select' }                  // ❌ Missing required 'options'
 * // });
 *
 * // ✅ Type inference: TypeScript automatically infers literal types
 * type TaskProperties = InferSchemaProperties<typeof taskSchema>;
 * // Result: {
 * //   Title: string | null;
 * //   Status: 'Todo' | 'In Progress' | 'Done' | null;
 * //   Tags: ('Bug' | 'Feature' | 'Enhancement')[] | null;
 * //   // ... other properties
 * // }
 *
 * // ✅ Runtime usage with type safety
 * const statusProperty = taskSchema.getProperty('Status');
 * const validator = taskSchema.createPropertyValidator();
 * const isValid = validator('Status', 'Todo'); // true
 *
 * // ✅ Use with NotionClient (placeholder - full implementation pending)
 * const client = new NotionClient({ auth: 'your-api-key' });
 * // const pages = await client.queryDatabase(taskSchema);
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
  PerformanceMetrics,
} from './types/index.js';

// Schema classes and functions
export {
  TypedSchema,
  createTypedSchema,
  validateSchemaDefinition,
  validatePropertyDefinition,
  isValidSchemaDefinition,
  ZodSchemaGenerator,
  getZodSchemaGenerator,
  resetZodSchemaGenerator,
  isValidOperator,
  getValidOperators,
  validateFilterValue,
  getFilterValueDescription,
} from './schema/index.js';

export type {
  PropertyFilterMap,
  TextFilters,
  NumberFilters,
  CheckboxFilters,
  DateFilters,
  SelectFilters,
  MultiSelectFilters,
  PeopleFilters,
  ValidOperators,
  FilterValue,
} from './schema/index.js';

// Error classes
export {
  TypedNotionError,
  SchemaValidationError,
  PropertyAccessError,
  NotionAPIError,
  ConversionError,
  ConfigurationError,
  SchemaRegistrationError,
  createOk,
  createErr,
  isOk,
  isErr,
} from './errors/index.js';

export type { Result } from './errors/index.js';

// Performance monitoring
export {
  getPerformanceMetrics,
  getDetailedPerformanceStats,
  checkPerformanceHealth,
  resetPerformanceMetrics,
  measurePerformance,
  measurePerformanceAsync,
  timed,
} from './utils/performance.js';

// Package validation and build pipeline (npm publishing support)
export {
  PackageValidator,
  validator,
  validatePackage,
  validateManifest,
  validateNameAvailability,
  BuildPipeline,
} from './validation/index.js';

export type {
  PackageValidationResult,
  ValidationError,
  ValidationWarning,
  PackageManifest,
  NameAvailabilityResult,
  BuildArtifact,
  BuildPerformance,
  BuildResult,
  BuildConfiguration,
} from './validation/index.js';

// Publishing module exports
export * from './publishing/index.js';

// Version export - managed by semantic-release
export const VERSION = '1.0.0';

// Utility function for better developer experience
export function getNotionPropertyValue<T>(property: unknown, type: string): T | null {
  if (!property || typeof property !== 'object' || property === null) {
    return null;
  }

  const prop = property as { type?: string; [key: string]: unknown };
  if (prop.type !== type) {
    return null;
  }

  switch (type) {
    case 'title':
    case 'rich_text':
      return ((prop[type] as Array<{ plain_text?: string }>)?.[0]?.plain_text as T) || null;
    case 'number':
      return prop.number as T;
    case 'checkbox':
      return prop.checkbox as T;
    case 'select':
      return ((prop.select as { name?: string })?.name as T) || null;
    case 'multi_select':
      return (
        ((prop.multi_select as Array<{ name: string }>)?.map(item => item.name) as T) || ([] as T)
      );
    case 'date':
      return ((prop.date as { start?: string })?.start as T) || null;
    case 'email':
      return prop.email as T;
    case 'phone_number':
      return prop.phone_number as T;
    case 'url':
      return prop.url as T;
    case 'created_time':
    case 'last_edited_time':
      return (prop[type] ? new Date(prop[type] as string) : null) as T;
    case 'created_by':
    case 'last_edited_by':
      return prop[type] as T;
    case 'people':
      return prop.people as T;
    default:
      return null;
  }
}

// Enhanced NotionClient and Filter System
export {
  NotionClient,
  FilterBuilder,
  FilterValidator,
  FilterConverter,
  createFilterBuilder,
  createFilterValidator,
  createFilterConverter,
} from './client/index.js';

export type {
  NotionClientConfig,
  QueryResponse,
  SchemaValidationResult,
  PerformanceMetrics as ClientPerformanceMetrics,
  NotionFilter,
  CompoundFilter,
  QueryOptions as ClientQueryOptions,
  NotionAPIFilter,
  FilterValidationResult,
} from './client/index.js';

// Data Conversion System
export type { PropertyExtractor } from './conversion/index.js';
export {
  TitleExtractor,
  RichTextExtractor,
  NumberExtractor,
  CheckboxExtractor,
  DateExtractor,
  SelectExtractor,
  MultiSelectExtractor,
  PeopleExtractor,
  CreatedTimeExtractor,
  LastEditedTimeExtractor,
  UrlExtractor,
  EmailExtractor,
  NotionPageTransformer,
  DEFAULT_CONVERSION_CONFIG,
  TransformerFactory,
  StreamingTransformer,
  getTransformerFactory,
  resetTransformerFactory,
} from './conversion/index.js';

export type {
  NotionPropertyValue,
  RichTextObject,
  NotionUser as ConversionNotionUser,
  NotionAPIResponse,
  ConversionConfig,
  TransformationMetrics,
  EnhancedTypedSchema,
} from './conversion/index.js';

// Environment Configuration
export {
  DefaultEnvironmentConfig,
  getEnvironmentConfig,
  resetEnvironmentConfig,
  resolveDatabaseId,
} from './config/environment.js';

export type { EnvironmentConfig, ConfigurationValidationResult } from './config/environment.js';
