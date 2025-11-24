/**
 * Enhanced NotionClient for typed-notion-core-ts
 *
 * Provides type-safe CRUD operations with automatic data conversion,
 * schema validation, and environment-based configuration.
 */

import { Client as NotionAPIClient } from '@notionhq/client';
import type { SchemaDefinition } from '../types/core.js';
import type { InferSchemaProperties } from '../types/inference.js';
import type { TypedSchema } from '../schema/typed-schema.js';
import { resolveDatabaseId } from '../config/environment.js';
import { getTransformerFactory } from '../conversion/transformer-factory.js';
import type { ConversionConfig } from '../conversion/page-transformer.js';
import { DEFAULT_CONVERSION_CONFIG } from '../conversion/page-transformer.js';
import type { QueryOptions } from './filters.js';
import { FilterConverter, FilterValidator } from './filters.js';
import { NotionAPIError, SchemaValidationError, ConversionError, isOk } from '../errors/index.js';

// Type definitions for Notion API responses
type NotionDatabaseProperty = {
  type: string;
  [key: string]: unknown;
};

type NotionDatabaseResponse = {
  properties: Record<string, NotionDatabaseProperty>;
  [key: string]: unknown;
};

/**
 * NotionClient configuration options
 */
export interface NotionClientConfig {
  auth: string; // Notion API key
  notionVersion?: string; // API version (defaults to latest)
  timeout?: number; // Request timeout in milliseconds
  retryDelayMs?: number; // Delay between retries (default: 334ms for 3 req/s)
  maxRetries?: number; // Maximum retry attempts (default: 3)
  enablePerformanceTracking?: boolean; // Enable performance metrics collection
  conversionConfig?: ConversionConfig; // Data conversion configuration
}

/**
 * Query response from Notion API with typing
 */
export interface QueryResponse<T extends SchemaDefinition> {
  results: Array<InferSchemaProperties<T> & { id: string }>;
  next_cursor: string | null;
  has_more: boolean;
  type: 'page_or_database';
  page_or_database: Record<string, unknown>;
  request_id: string;
}

/**
 * Schema validation result
 */
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

/**
 * Performance metrics for the client
 */
export interface PerformanceMetrics {
  schemaProcessingTime: number; // milliseconds
  activeSchemaCount: number;
  lastQueryDuration: number; // milliseconds
  cacheHitRate: number; // percentage
  apiRequestCount: number;
  rateLimitHits: number;
  averageResponseTime: number; // milliseconds
}

/**
 * Enhanced NotionClient with full CRUD support and type safety
 */
export class NotionClient {
  private readonly client: NotionAPIClient;
  private readonly config: NotionClientConfig;
  private readonly transformerFactory = getTransformerFactory();
  private readonly filterConverter = new FilterConverter();
  private readonly metrics: PerformanceMetrics;
  private rateLimitQueue = Promise.resolve();

  constructor(config: NotionClientConfig) {
    this.config = {
      notionVersion: '2022-06-28',
      timeout: 60000,
      retryDelayMs: 334, // ~3 requests per second
      maxRetries: 3,
      enablePerformanceTracking: true,
      conversionConfig: DEFAULT_CONVERSION_CONFIG,
      ...config,
    };

    this.client = new NotionAPIClient({
      auth: this.config.auth,
      ...(this.config.notionVersion && { notionVersion: this.config.notionVersion }),
      ...(this.config.timeout && { timeoutMs: this.config.timeout }),
    });

    this.metrics = {
      schemaProcessingTime: 0,
      activeSchemaCount: 0,
      lastQueryDuration: 0,
      cacheHitRate: 0,
      apiRequestCount: 0,
      rateLimitHits: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Query a Notion database with type safety and automatic data conversion
   * @template T - Schema definition type for type inference
   * @param schema - Typed schema definition
   * @param options - Query options including filters and sorting
   * @returns Promise resolving to typed query results
   * @throws NotionAPIError for API failures
   * @throws SchemaValidationError for schema mismatches
   */
  async query<T extends SchemaDefinition>(
    schema: TypedSchema<T>,
    options: QueryOptions<T> = {}
  ): Promise<QueryResponse<T>> {
    const startTime = globalThis.performance.now();

    try {
      // Resolve database ID from schema or environment
      const databaseId = this.resolveDatabaseId(schema);

      // Validate and convert filter if provided
      let notionFilter: unknown = undefined;
      if (options.filter) {
        const validator = new FilterValidator({ definition: schema.definition });
        const validationResult = validator.validate(options.filter);

        if (!validationResult.isValid) {
          throw new SchemaValidationError('filter', 'valid filter', options.filter);
        }

        notionFilter = this.filterConverter.toNotionFilter(
          options.filter as import('./filters.js').NotionFilter<SchemaDefinition>
        );
      }

      // Convert sorts to Notion API format
      const notionSorts = options.sorts?.map(sort => ({
        property: sort.property as string,
        direction: sort.direction,
      }));

      // Execute query with rate limiting
      const response = await this.executeWithRateLimit(async () => {
        return await (
          this.client as NotionAPIClient & {
            databases: {
              query: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
            };
          }
        ).databases.query({
          database_id: databaseId,
          filter: notionFilter,
          sorts: notionSorts,
          page_size: options.page_size,
          start_cursor: options.start_cursor,
        });
      });

      // Transform results using page transformer
      const transformer = this.transformerFactory.getCachedTransformer(
        {
          definition: schema.definition,
          propertyNames: schema.propertyNames,
          databaseId: schema.databaseId,
          createdAt: schema.createdAt,
        },
        undefined,
        this.config.conversionConfig
      );

      const transformedResults: Array<InferSchemaProperties<T> & { id: string }> = [];

      for (const page of response.results) {
        const transformResult = transformer.transform(
          page as import('../conversion/page-transformer.js').NotionAPIResponse
        );

        if (isOk(transformResult)) {
          transformedResults.push(transformResult.value);
        } else {
          // Handle transformation error based on config
          if (this.config.conversionConfig?.strictTypeValidation) {
            throw transformResult.error;
          }
          // Skip invalid pages in non-strict mode
          // Skip invalid pages in non-strict mode (page ${page.id}: ${transformResult.error.message})
        }
      }

      // Update performance metrics
      const endTime = globalThis.performance.now();
      this.updateMetrics(endTime - startTime);

      return {
        results: transformedResults,
        next_cursor: response.next_cursor,
        has_more: response.has_more,
        type: response.type as 'page_or_database',
        page_or_database: response.page_or_database || {},
        request_id: (response as { request_id?: string }).request_id || '',
      };
    } catch (error) {
      this.handleAPIError(error);
      throw error; // Re-throw after handling
    }
  }

  /**
   * Create a new page in a Notion database with type safety and validation
   * @template T - Schema definition type for type inference
   * @param schema - Typed schema definition
   * @param data - Page data matching schema property types
   * @returns Promise resolving to created page data with ID
   * @throws NotionAPIError for API failures
   * @throws ValidationError for data validation failures
   */
  async create<T extends SchemaDefinition>(
    schema: TypedSchema<T>,
    data: Partial<InferSchemaProperties<T>>
  ): Promise<InferSchemaProperties<T> & { id: string }> {
    const startTime = globalThis.performance.now();

    try {
      // Resolve database ID
      const databaseId = this.resolveDatabaseId(schema);

      // Validate data using schema's Zod validation
      const validationResult = schema.validate(data);
      if (!validationResult.success) {
        throw new SchemaValidationError('data', 'valid data matching schema', data);
      }

      // Convert TypeScript data to Notion API format
      const notionProperties = this.convertToNotionProperties(data, schema);

      // Create page via Notion API
      const response = await this.executeWithRateLimit(async () => {
        return await this.client.pages.create({
          parent: { database_id: databaseId },
          properties: notionProperties as Record<string, unknown>,
        });
      });

      // Transform response back to typed format
      const transformer = this.transformerFactory.getCachedTransformer(
        {
          definition: schema.definition,
          propertyNames: schema.propertyNames,
          databaseId: schema.databaseId,
          createdAt: schema.createdAt,
        },
        undefined,
        this.config.conversionConfig
      );

      const transformResult = transformer.transform(
        response as import('../conversion/page-transformer.js').NotionAPIResponse
      );

      if (!isOk(transformResult)) {
        throw new ConversionError(
          `Failed to transform created page: ${transformResult.error.message}`,
          'CONVERSION_ERROR',
          response,
          undefined,
          'transformed page data',
          typeof response,
          transformResult.error
        );
      }

      // Update performance metrics
      const endTime = globalThis.performance.now();
      this.updateMetrics(endTime - startTime);

      return transformResult.value;
    } catch (error) {
      this.handleAPIError(error);
      throw error;
    }
  }

  /**
   * Update an existing page in a Notion database with type safety
   * @template T - Schema definition type for type inference
   * @param pageId - Notion page ID to update
   * @param schema - Typed schema definition
   * @param data - Partial data for properties to update
   * @returns Promise resolving to updated page data
   * @throws NotionAPIError for API failures
   * @throws ValidationError for data validation failures
   */
  async update<T extends SchemaDefinition>(
    pageId: string,
    schema: TypedSchema<T>,
    data: Partial<InferSchemaProperties<T>>
  ): Promise<InferSchemaProperties<T> & { id: string }> {
    const startTime = globalThis.performance.now();

    try {
      // Validate partial data
      const validationResult = schema.validate(data);
      if (!validationResult.success) {
        throw new SchemaValidationError('data', 'valid data matching schema', data);
      }

      // Convert TypeScript data to Notion API format
      const notionProperties = this.convertToNotionProperties(data, schema);

      // Update page via Notion API
      const response = await this.executeWithRateLimit(async () => {
        return await this.client.pages.update({
          page_id: pageId,
          properties: notionProperties as Record<string, unknown>,
        });
      });

      // Transform response back to typed format
      const transformer = this.transformerFactory.getCachedTransformer(
        {
          definition: schema.definition,
          propertyNames: schema.propertyNames,
          databaseId: schema.databaseId,
          createdAt: schema.createdAt,
        },
        undefined,
        this.config.conversionConfig
      );

      const transformResult = transformer.transform(
        response as import('../conversion/page-transformer.js').NotionAPIResponse
      );

      if (!isOk(transformResult)) {
        throw new ConversionError(
          `Failed to transform updated page: ${transformResult.error.message}`,
          'CONVERSION_ERROR',
          response,
          undefined,
          'transformed page data',
          typeof response,
          transformResult.error
        );
      }

      // Update performance metrics
      const endTime = globalThis.performance.now();
      this.updateMetrics(endTime - startTime);

      return transformResult.value;
    } catch (error) {
      this.handleAPIError(error);
      throw error;
    }
  }

  /**
   * Retrieve a single page by ID with automatic type conversion
   * @template T - Schema definition type for type inference
   * @param pageId - Notion page ID
   * @param schema - Typed schema definition for conversion
   * @returns Promise resolving to typed page data
   * @throws NotionAPIError for API failures
   * @throws SchemaValidationError for type mismatches
   */
  async getPage<T extends SchemaDefinition>(
    pageId: string,
    schema: TypedSchema<T>
  ): Promise<InferSchemaProperties<T> & { id: string }> {
    const startTime = globalThis.performance.now();

    try {
      // Retrieve page via Notion API
      const response = await this.executeWithRateLimit(async () => {
        return await this.client.pages.retrieve({ page_id: pageId });
      });

      // Transform response to typed format
      const transformer = this.transformerFactory.getCachedTransformer(
        {
          definition: schema.definition,
          propertyNames: schema.propertyNames,
          databaseId: schema.databaseId,
          createdAt: schema.createdAt,
        },
        undefined,
        this.config.conversionConfig
      );

      const transformResult = transformer.transform(
        response as import('../conversion/page-transformer.js').NotionAPIResponse
      );

      if (!isOk(transformResult)) {
        throw new ConversionError(
          `Failed to transform retrieved page: ${transformResult.error.message}`,
          'CONVERSION_ERROR',
          response,
          pageId,
          'transformed page data',
          typeof response,
          transformResult.error
        );
      }

      // Update performance metrics
      const endTime = globalThis.performance.now();
      this.updateMetrics(endTime - startTime);

      return transformResult.value;
    } catch (error) {
      this.handleAPIError(error);
      throw error;
    }
  }

  /**
   * Validate that a schema definition matches the actual Notion database structure
   * @template T - Schema definition type
   * @param schema - Schema to validate
   * @returns Promise resolving to validation result
   * @throws NotionAPIError for API failures
   */
  async validateSchema<T extends SchemaDefinition>(
    schema: TypedSchema<T>
  ): Promise<SchemaValidationResult> {
    try {
      // Resolve database ID
      const databaseId = this.resolveDatabaseId(schema);

      // Retrieve database structure from Notion
      const database = await this.executeWithRateLimit(async () => {
        return await this.client.databases.retrieve({ database_id: databaseId });
      });

      // Compare schema with actual database structure
      const errors: string[] = [];
      const warnings: string[] = [];
      const missingProperties: string[] = [];
      const extraProperties: string[] = [];
      const typeConflicts: Array<{ property: string; expected: string; actual: string }> = [];

      // Check each property in schema
      for (const [propName, propDef] of Object.entries(schema.definition.properties)) {
        const notionProperty = (database as unknown as NotionDatabaseResponse).properties?.[
          propName
        ];

        if (!notionProperty) {
          missingProperties.push(propName);
          errors.push(`Property '${propName}' defined in schema but not found in database`);
          continue;
        }

        if (notionProperty?.type !== propDef.type) {
          typeConflicts.push({
            property: propName,
            expected: propDef.type,
            actual: notionProperty?.type || 'unknown',
          });
          errors.push(
            `Property '${propName}' type mismatch: expected ${propDef.type}, got ${notionProperty?.type || 'unknown'}`
          );
        }
      }

      // Check for extra properties in database
      for (const propName of Object.keys(
        (database as unknown as NotionDatabaseResponse).properties || {}
      )) {
        if (!(propName in schema.definition.properties)) {
          extraProperties.push(propName);
          warnings.push(`Property '${propName}' exists in database but not defined in schema`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        missingProperties,
        extraProperties,
        typeConflicts,
      };
    } catch (error) {
      this.handleAPIError(error);
      throw error;
    }
  }

  /**
   * Get performance metrics for the client
   * @returns Performance metrics object
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear performance metrics and caches
   */
  clearCaches(): void {
    this.transformerFactory.clearCache();
    // Reset metrics
    this.metrics.schemaProcessingTime = 0;
    this.metrics.activeSchemaCount = 0;
    this.metrics.lastQueryDuration = 0;
    this.metrics.cacheHitRate = 0;
    this.metrics.apiRequestCount = 0;
    this.metrics.rateLimitHits = 0;
    this.metrics.averageResponseTime = 0;
  }

  /**
   * Resolve database ID from schema or environment
   * @param schema - Schema with database ID
   * @returns Resolved database ID
   */
  private resolveDatabaseId<T extends SchemaDefinition>(schema: TypedSchema<T>): string {
    if (schema.databaseId) {
      return schema.databaseId;
    }

    // Try to resolve from environment based on schema name
    try {
      // Extract schema name from properties or use a default approach
      const schemaName = this.extractSchemaName(schema);
      return resolveDatabaseId(schemaName);
    } catch {
      throw new SchemaValidationError('databaseId', 'valid database ID', undefined);
    }
  }

  /**
   * Extract schema name for environment variable lookup
   * @param schema - Schema definition
   * @returns Schema name for environment lookup
   */
  private extractSchemaName<T extends SchemaDefinition>(schema: TypedSchema<T>): string {
    // For now, use a simple approach - in a real implementation you might
    // have a more sophisticated naming strategy
    const titleProperty = schema.getTitleProperty();
    return titleProperty.name.toString().toUpperCase();
  }

  /**
   * Convert TypeScript data to Notion API properties format
   * @param data - TypeScript data object
   * @param schema - Schema for type information
   * @returns Notion API properties object
   */
  private convertToNotionProperties<T extends SchemaDefinition>(
    data: Partial<InferSchemaProperties<T>>,
    schema: TypedSchema<T>
  ): Record<string, unknown> {
    const properties: Record<string, unknown> = {};

    for (const [propName, value] of Object.entries(data)) {
      if (value === undefined) continue;

      const propDef = schema.definition.properties[propName];
      if (!propDef) continue;

      properties[propName] = this.convertPropertyValue(value, propDef.type);
    }

    return properties;
  }

  /**
   * Convert single property value to Notion API format
   * @param value - Property value
   * @param propertyType - Property type
   * @returns Notion API property value
   */
  private convertPropertyValue(value: unknown, propertyType: string): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    switch (propertyType) {
      case 'title':
      case 'rich_text':
        return {
          [propertyType]: [
            {
              text: { content: String(value) },
            },
          ],
        };

      case 'number':
        return { number: Number(value) };

      case 'checkbox':
        return { checkbox: Boolean(value) };

      case 'date':
        if (value instanceof Date) {
          return { date: { start: value.toISOString().split('T')[0] } };
        }
        return { date: { start: String(value) } };

      case 'select':
        return { select: { name: String(value) } };

      case 'multi_select':
        if (Array.isArray(value)) {
          return { multi_select: value.map(v => ({ name: String(v) })) };
        }
        return { multi_select: [{ name: String(value) }] };

      case 'url':
        return { url: String(value) };

      case 'email':
        return { email: String(value) };

      default:
        // For other types, return as-is or handle as needed
        return { [propertyType]: value };
    }
  }

  /**
   * Execute API request with rate limiting
   * @param apiCall - Function that makes the API call
   * @returns Promise with API response
   */
  private async executeWithRateLimit<T>(apiCall: () => Promise<T>): Promise<T> {
    return (this.rateLimitQueue = this.rateLimitQueue.then(async () => {
      this.metrics.apiRequestCount++;

      try {
        const result = await apiCall();

        // Wait for rate limit delay
        if (this.config.retryDelayMs && this.config.retryDelayMs > 0) {
          await new Promise(resolve => globalThis.setTimeout(resolve, this.config.retryDelayMs));
        }

        return result;
      } catch (error) {
        if (this.isRateLimitError(error)) {
          this.metrics.rateLimitHits++;
          // Exponential backoff for rate limit errors
          const delay = (this.config.retryDelayMs || 334) * Math.pow(2, this.metrics.rateLimitHits);
          await new Promise(resolve => globalThis.setTimeout(resolve, Math.min(delay, 5000)));
        }
        throw error;
      }
    }));
  }

  /**
   * Check if error is a rate limit error
   * @param error - Error to check
   * @returns True if rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.message.includes('rate') ||
        error.message.includes('429') ||
        (error as { code?: string })?.code === 'rate_limited')
    );
  }

  /**
   * Handle API errors and convert to appropriate error types
   * @param error - Error from API call
   */
  private handleAPIError(error: unknown): void {
    if (error instanceof Error) {
      // Only convert actual Notion API errors, not our custom error types
      if (
        error instanceof SchemaValidationError ||
        error instanceof ConversionError ||
        error instanceof NotionAPIError
      ) {
        // These are already properly typed errors, don't convert them
        return;
      }

      // Convert Notion API errors to our error types
      const errorData = error as {
        status?: number;
        code?: string;
        notion_code?: string;
        message?: string;
      };

      if (errorData.status || errorData.code) {
        throw new NotionAPIError(
          errorData.status || 500,
          errorData.code || error.message,
          errorData.notion_code
        );
      }
    }
  }

  /**
   * Update performance metrics
   * @param duration - Operation duration in milliseconds
   */
  private updateMetrics(duration: number): void {
    if (!this.config.enablePerformanceTracking) return;

    this.metrics.lastQueryDuration = duration;
    this.metrics.averageResponseTime = (this.metrics.averageResponseTime + duration) / 2;

    // Update cache hit rate from transformer factory
    const factoryStats = this.transformerFactory.getCacheStats();
    if (factoryStats.size > 0) {
      this.metrics.cacheHitRate = (factoryStats.size / this.metrics.apiRequestCount) * 100;
    }
  }
}
