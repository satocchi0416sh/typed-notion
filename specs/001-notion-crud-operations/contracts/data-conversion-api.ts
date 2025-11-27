/**
 * TypeScript API Contracts for Automatic Data Conversion
 *
 * This file defines the contracts for transforming Notion API responses
 * into typed TypeScript objects with automatic property extraction and validation.
 */

import type { z } from 'zod';

// Notion API Response Types (Raw)
export interface NotionAPIResponse {
  object: 'page';
  id: string;
  created_time: string; // ISO 8601 date string
  created_by: NotionUser;
  last_edited_time: string; // ISO 8601 date string
  last_edited_by: NotionUser;
  archived: boolean;
  icon?: NotionIcon | null;
  cover?: NotionCover | null;
  properties: Record<string, NotionPropertyValue>;
  parent: NotionParent;
  url: string;
  public_url?: string | null;
}

export interface NotionPropertyValue {
  id: string;
  type: string;
  [key: string]: unknown; // Property-specific data
}

// Specific property value structures from Notion API
export interface TitlePropertyValue extends NotionPropertyValue {
  type: 'title';
  title: RichTextObject[];
}

export interface RichTextPropertyValue extends NotionPropertyValue {
  type: 'rich_text';
  rich_text: RichTextObject[];
}

export interface NumberPropertyValue extends NotionPropertyValue {
  type: 'number';
  number: number | null;
}

export interface CheckboxPropertyValue extends NotionPropertyValue {
  type: 'checkbox';
  checkbox: boolean;
}

export interface DatePropertyValue extends NotionPropertyValue {
  type: 'date';
  date: {
    start: string; // ISO 8601 date string
    end?: string | null; // ISO 8601 date string
    time_zone?: string | null;
  } | null;
}

export interface SelectPropertyValue extends NotionPropertyValue {
  type: 'select';
  select: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface MultiSelectPropertyValue extends NotionPropertyValue {
  type: 'multi_select';
  multi_select: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export interface PeoplePropertyValue extends NotionPropertyValue {
  type: 'people';
  people: NotionUser[];
}

export interface CreatedTimePropertyValue extends NotionPropertyValue {
  type: 'created_time';
  created_time: string; // ISO 8601 date string
}

export interface CreatedByPropertyValue extends NotionPropertyValue {
  type: 'created_by';
  created_by: NotionUser;
}

export interface LastEditedTimePropertyValue extends NotionPropertyValue {
  type: 'last_edited_time';
  last_edited_time: string; // ISO 8601 date string
}

export interface LastEditedByPropertyValue extends NotionPropertyValue {
  type: 'last_edited_by';
  last_edited_by: NotionUser;
}

export interface UrlPropertyValue extends NotionPropertyValue {
  type: 'url';
  url: string | null;
}

export interface EmailPropertyValue extends NotionPropertyValue {
  type: 'email';
  email: string | null;
}

// Supporting types
export interface RichTextObject {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string } | null;
  };
  mention?: {
    type: string;
    [key: string]: unknown;
  };
  equation?: {
    expression: string;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string | null;
}

export interface NotionUser {
  object: 'user';
  id: string;
  type: 'person' | 'bot';
  name?: string | null;
  avatar_url?: string | null;
  person?: {
    email?: string;
  };
  bot?: {
    owner: {
      type: 'workspace' | 'user';
      workspace?: boolean;
      user?: NotionUser;
    };
    workspace_name?: string | null;
  };
}

export interface NotionIcon {
  type: 'emoji' | 'external' | 'file';
  emoji?: string;
  external?: { url: string };
  file?: { url: string; expiry_time: string };
}

export interface NotionCover {
  type: 'external' | 'file';
  external?: { url: string };
  file?: { url: string; expiry_time: string };
}

export interface NotionParent {
  type: 'database_id' | 'page_id' | 'workspace';
  database_id?: string;
  page_id?: string;
  workspace?: boolean;
}

// Result Pattern for Safe Conversion
export type Result<T, E = ConversionError> = { kind: 'ok'; value: T } | { kind: 'err'; error: E };

export interface ConversionError {
  type: 'VALIDATION_ERROR' | 'CONVERSION_ERROR' | 'SCHEMA_MISMATCH' | 'MISSING_PROPERTY';
  message: string;
  input?: unknown;
  propertyName?: string;
  expectedType?: string;
  actualType?: string;
  originalError?: Error;
}

// Property Extractor Interface
export interface PropertyExtractor {
  /**
   * Extract typed value from Notion property response
   * @param property - Raw Notion property value
   * @returns Extracted typed value or null
   */
  extract(property: NotionPropertyValue): unknown;

  /**
   * Validate property structure matches expected type
   * @param property - Property to validate
   * @returns True if structure is valid
   */
  validate(property: NotionPropertyValue): boolean;

  /**
   * Get default value for this property type when missing
   * @returns Default value appropriate for property type
   */
  getDefaultValue(): unknown;
}

// Specific extractors for each property type
export interface TitleExtractor extends PropertyExtractor {
  extract(property: TitlePropertyValue): string;
}

export interface RichTextExtractor extends PropertyExtractor {
  extract(property: RichTextPropertyValue): string;
}

export interface NumberExtractor extends PropertyExtractor {
  extract(property: NumberPropertyValue): number | null;
}

export interface CheckboxExtractor extends PropertyExtractor {
  extract(property: CheckboxPropertyValue): boolean;
}

export interface DateExtractor extends PropertyExtractor {
  extract(property: DatePropertyValue): Date | null;

  /**
   * Parse date with timezone handling
   * @param dateString - ISO date string
   * @param timezone - Target timezone (optional)
   * @returns Parsed Date object
   */
  parseDate(dateString: string, timezone?: string): Date | null;
}

export interface SelectExtractor extends PropertyExtractor {
  extract(property: SelectPropertyValue): string | null;
}

export interface MultiSelectExtractor extends PropertyExtractor {
  extract(property: MultiSelectPropertyValue): string[];
}

export interface PeopleExtractor extends PropertyExtractor {
  extract(property: PeoplePropertyValue): NotionUser[];
}

export interface CreatedTimeExtractor extends PropertyExtractor {
  extract(property: CreatedTimePropertyValue): Date;
}

export interface CreatedByExtractor extends PropertyExtractor {
  extract(property: CreatedByPropertyValue): NotionUser;
}

export interface LastEditedTimeExtractor extends PropertyExtractor {
  extract(property: LastEditedTimePropertyValue): Date;
}

export interface LastEditedByExtractor extends PropertyExtractor {
  extract(property: LastEditedByPropertyValue): NotionUser;
}

export interface UrlExtractor extends PropertyExtractor {
  extract(property: UrlPropertyValue): string | null;
}

export interface EmailExtractor extends PropertyExtractor {
  extract(property: EmailPropertyValue): string | null;
}

// Main Data Transformer Interface
export interface NotionPageTransformer<T extends SchemaDefinition> {
  /**
   * Transform raw Notion page response to typed object
   * @param notionPage - Raw Notion API page response
   * @returns Result containing typed object or conversion error
   */
  transform(notionPage: NotionAPIResponse): Result<InferSchemaProperties<T> & { id: string }>;

  /**
   * Transform single property value
   * @param property - Raw property value
   * @param expectedType - Expected property type from schema
   * @returns Result containing extracted value or error
   */
  transformProperty(property: NotionPropertyValue, expectedType: string): Result<unknown>;

  /**
   * Validate property structure matches schema expectations
   * @param property - Property to validate
   * @param schemaProperty - Schema property definition
   * @returns Validation result
   */
  validateProperty(
    property: NotionPropertyValue,
    schemaProperty: PropertyDefinition
  ): ValidationResult;

  /**
   * Get performance metrics for transformation operations
   * @returns Transformation performance data
   */
  getMetrics(): TransformationMetrics;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TransformationMetrics {
  transformationCount: number;
  totalTransformationTime: number; // milliseconds
  averageTransformationTime: number; // milliseconds
  errorCount: number;
  lastTransformationTime: number; // milliseconds
  cacheHitRate: number; // percentage
  largestPayloadSize: number; // bytes
}

// Configuration for data conversion behavior
export interface ConversionConfig {
  /**
   * Whether to validate property types strictly
   * If false, type mismatches will be logged as warnings but not fail conversion
   */
  strictTypeValidation: boolean;

  /**
   * Default timezone for date conversion when timezone is not specified
   */
  defaultTimezone?: string;

  /**
   * Whether to preserve rich text formatting information
   * If false, only plain text is extracted
   */
  preserveRichTextFormatting: boolean;

  /**
   * How to handle missing properties
   */
  missingPropertyStrategy: 'default' | 'null' | 'error';

  /**
   * Performance optimization settings
   */
  performance: {
    enableCaching: boolean;
    cacheMaxSize: number;
    enableMetrics: boolean;
  };
}

// Factory for creating property extractors
export interface PropertyExtractorFactory {
  /**
   * Create extractor for specific property type
   * @param propertyType - Property type identifier
   * @param config - Configuration for extraction behavior
   * @returns Property extractor instance
   */
  createExtractor(propertyType: string, config?: ConversionConfig): PropertyExtractor;

  /**
   * Get all supported property types
   * @returns Array of supported property type identifiers
   */
  getSupportedTypes(): string[];

  /**
   * Register custom property extractor
   * @param propertyType - Property type identifier
   * @param extractor - Custom extractor implementation
   */
  registerExtractor(propertyType: string, extractor: PropertyExtractor): void;
}

// Transformer Factory for creating page transformers
export interface TransformerFactory {
  /**
   * Create transformer for specific schema
   * @template T - Schema definition type
   * @param schema - Schema definition
   * @param config - Configuration for transformation behavior
   * @returns Page transformer instance
   */
  createTransformer<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    config?: ConversionConfig
  ): NotionPageTransformer<T>;

  /**
   * Create transformer with caching
   * @template T - Schema definition type
   * @param schema - Schema definition
   * @param cacheKey - Key for caching transformer instance
   * @param config - Configuration for transformation behavior
   * @returns Cached transformer instance
   */
  getCachedTransformer<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    cacheKey?: string,
    config?: ConversionConfig
  ): NotionPageTransformer<T>;

  /**
   * Clear transformer cache
   */
  clearCache(): void;
}

// Streaming transformer for large datasets
export interface StreamingTransformer<T extends SchemaDefinition> {
  /**
   * Transform pages in batches for memory efficiency
   * @param pages - Raw Notion page responses
   * @param batchSize - Number of pages to process per batch
   * @returns Async generator yielding transformation results
   */
  transformStream(
    pages: NotionAPIResponse[],
    batchSize?: number
  ): AsyncGenerator<Result<Array<InferSchemaProperties<T> & { id: string }>>>;

  /**
   * Transform single page asynchronously
   * @param page - Raw Notion page response
   * @returns Promise resolving to transformation result
   */
  transformAsync(
    page: NotionAPIResponse
  ): Promise<Result<InferSchemaProperties<T> & { id: string }>>;
}
