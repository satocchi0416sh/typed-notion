/**
 * Client module exports for typed-notion-core-ts
 *
 * Re-exports all client functionality including the enhanced NotionClient,
 * filter system, and type definitions.
 */

// Enhanced NotionClient
export { NotionClient } from './notion-client.js';

export type {
  NotionClientConfig,
  QueryResponse,
  SchemaValidationResult,
  PerformanceMetrics,
} from './notion-client.js';

// Filter System
export {
  FilterBuilder,
  FilterValidator,
  FilterConverter,
  createFilterBuilder,
  createFilterValidator,
  createFilterConverter,
} from './filters.js';

export type {
  NotionFilter,
  CompoundFilter,
  QueryOptions,
  NotionAPIFilter,
  FilterValidationResult,
} from './filters.js';
