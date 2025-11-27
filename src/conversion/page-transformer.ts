/**
 * NotionPageTransformer for typed-notion-core-ts
 *
 * Transforms raw Notion API page responses into typed TypeScript objects
 * using property extractors and schema definitions.
 */

import type { SchemaDefinition } from '../types/core.js';
import type { InferSchemaProperties } from '../types/inference.js';
import { createOk, createErr, ConversionError, isOk } from '../errors/index.js';
import type { Result } from '../errors/index.js';
import type { PropertyExtractor, NotionPropertyValue, NotionUser } from './property-extractors.js';
import {
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
} from './property-extractors.js';

/**
 * Raw Notion API page response structure
 */
export interface NotionAPIResponse {
  object: 'page';
  id: string;
  created_time: string;
  created_by: NotionUser;
  last_edited_time: string;
  last_edited_by: NotionUser;
  archived: boolean;
  icon?: unknown;
  cover?: unknown;
  properties: Record<string, NotionPropertyValue>;
  parent: unknown;
  url: string;
  public_url?: string | null;
}

/**
 * Configuration for data conversion behavior
 */
export interface ConversionConfig {
  /**
   * Whether to validate property types strictly
   */
  strictTypeValidation: boolean;

  /**
   * Default timezone for date conversion when timezone is not specified
   */
  defaultTimezone?: string;

  /**
   * Whether to preserve rich text formatting information
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

/**
 * Performance metrics for transformation operations
 */
export interface TransformationMetrics {
  transformationCount: number;
  totalTransformationTime: number; // milliseconds
  averageTransformationTime: number; // milliseconds
  errorCount: number;
  lastTransformationTime: number; // milliseconds
  cacheHitRate: number; // percentage
  largestPayloadSize: number; // bytes
}

/**
 * NotionPageTransformer transforms Notion pages to typed objects
 */
export class NotionPageTransformer<T extends SchemaDefinition> {
  private readonly extractorMap = new Map<string, PropertyExtractor<unknown>>();
  private readonly metrics: TransformationMetrics;
  private readonly extractorCache = new Map<string, PropertyExtractor<unknown>>();

  constructor(
    private readonly schema: { definition: T; propertyNames: string[] },
    private readonly config: ConversionConfig = DEFAULT_CONVERSION_CONFIG
  ) {
    this.metrics = {
      transformationCount: 0,
      totalTransformationTime: 0,
      averageTransformationTime: 0,
      errorCount: 0,
      lastTransformationTime: 0,
      cacheHitRate: 0,
      largestPayloadSize: 0,
    };

    this.initializeExtractors();
  }

  /**
   * Transform raw Notion page response to typed object
   * @param notionPage - Raw Notion API page response
   * @returns Result containing typed object or conversion error
   */
  transform(notionPage: NotionAPIResponse): Result<InferSchemaProperties<T> & { id: string }> {
    const startTime = performance.now();

    try {
      // Track payload size
      const payloadSize = JSON.stringify(notionPage).length;
      if (payloadSize > this.metrics.largestPayloadSize) {
        this.metrics.largestPayloadSize = payloadSize;
      }

      // Transform properties
      const transformedProperties: Record<string, unknown> = {};
      const errors: ConversionError[] = [];

      for (const [propertyName, propertyDef] of Object.entries(this.schema.definition.properties)) {
        const notionProperty = notionPage.properties[propertyName];

        if (!notionProperty) {
          // Handle missing property based on strategy
          switch (this.config.missingPropertyStrategy) {
            case 'error':
              errors.push(
                new ConversionError(
                  `Missing property: ${propertyName}`,
                  'MISSING_PROPERTY',
                  notionPage.properties,
                  propertyName,
                  propertyDef.type,
                  'undefined'
                )
              );
              break;
            case 'null':
              transformedProperties[propertyName] = null;
              break;
            case 'default': {
              const extractor = this.getExtractor(propertyDef.type);
              transformedProperties[propertyName] = extractor?.getDefaultValue() ?? null;
              break;
            }
          }
          continue;
        }

        // Transform property
        const propertyResult = this.transformProperty(notionProperty, propertyDef.type);

        if (isOk(propertyResult)) {
          transformedProperties[propertyName] = propertyResult.value;
        } else {
          if (this.config.strictTypeValidation) {
            errors.push(propertyResult.error);
          } else {
            // Use default value on error if not strict
            const extractor = this.getExtractor(propertyDef.type);
            transformedProperties[propertyName] = extractor?.getDefaultValue() ?? null;
          }
        }
      }

      // Check for errors
      if (errors.length > 0 && this.config.strictTypeValidation) {
        this.metrics.errorCount += errors.length;
        return createErr(
          new ConversionError(
            `Transformation failed with ${errors.length} errors`,
            'VALIDATION_ERROR',
            notionPage,
            undefined,
            'valid properties',
            'invalid properties'
          )
        );
      }

      // Add page ID
      const result = {
        ...transformedProperties,
        id: notionPage.id,
      } as InferSchemaProperties<T> & { id: string };

      // Update metrics
      const endTime = performance.now();
      const transformationTime = endTime - startTime;
      this.updateMetrics(transformationTime);

      return createOk(result);
    } catch (error) {
      const endTime = performance.now();
      const transformationTime = endTime - startTime;
      this.updateMetrics(transformationTime);
      this.metrics.errorCount++;

      return createErr(
        new ConversionError(
          `Unexpected transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CONVERSION_ERROR',
          notionPage,
          undefined,
          'transformed object',
          typeof error,
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Transform single property value
   * @param property - Raw property value
   * @param expectedType - Expected property type from schema
   * @returns Result containing extracted value or error
   */
  transformProperty(property: NotionPropertyValue, expectedType: string): Result<unknown> {
    const extractor = this.getExtractor(expectedType);

    if (!extractor) {
      return createErr(
        new ConversionError(
          `No extractor available for property type: ${expectedType}`,
          'SCHEMA_MISMATCH',
          property,
          undefined,
          expectedType,
          property.type
        )
      );
    }

    // Validate property type matches expected type
    if (property.type !== expectedType) {
      return createErr(
        new ConversionError(
          `Property type mismatch: expected ${expectedType}, got ${property.type}`,
          'SCHEMA_MISMATCH',
          property,
          undefined,
          expectedType,
          property.type
        )
      );
    }

    return extractor.extract(property);
  }

  /**
   * Get property extractor for type
   * @param propertyType - Property type
   * @returns Property extractor or undefined
   */
  private getExtractor(propertyType: string): PropertyExtractor<unknown> | undefined {
    // Check cache first
    if (this.config.performance.enableCaching) {
      const cached = this.extractorCache.get(propertyType);
      if (cached) {
        return cached;
      }
    }

    let extractor = this.extractorMap.get(propertyType);

    if (!extractor) {
      // Create extractor on demand
      extractor = this.createExtractor(propertyType);
      if (extractor) {
        this.extractorMap.set(propertyType, extractor);

        if (this.config.performance.enableCaching) {
          this.extractorCache.set(propertyType, extractor);
        }
      }
    }

    return extractor;
  }

  /**
   * Create property extractor for type
   * @param propertyType - Property type
   * @returns Property extractor or undefined
   */
  private createExtractor(propertyType: string): PropertyExtractor<unknown> | undefined {
    switch (propertyType) {
      case 'title':
        return new TitleExtractor();
      case 'rich_text':
        return new RichTextExtractor();
      case 'number':
        return new NumberExtractor();
      case 'checkbox':
        return new CheckboxExtractor();
      case 'date':
        return new DateExtractor(this.config.defaultTimezone);
      case 'select':
        return new SelectExtractor();
      case 'multi_select':
        return new MultiSelectExtractor();
      case 'people':
        return new PeopleExtractor();
      case 'created_time':
        return new CreatedTimeExtractor();
      case 'last_edited_time':
        return new LastEditedTimeExtractor();
      case 'created_by':
        return new PeopleExtractor(); // Created by uses people extractor
      case 'last_edited_by':
        return new PeopleExtractor(); // Last edited by uses people extractor
      case 'url':
        return new UrlExtractor();
      case 'email':
        return new EmailExtractor();
      default:
        return undefined;
    }
  }

  /**
   * Initialize property extractors
   */
  private initializeExtractors(): void {
    // Pre-create extractors for all property types in the schema
    for (const propertyDef of Object.values(this.schema.definition.properties)) {
      const extractor = this.createExtractor(propertyDef.type);
      if (extractor) {
        this.extractorMap.set(propertyDef.type, extractor);
      }
    }
  }

  /**
   * Update performance metrics
   * @param transformationTime - Time taken for transformation in milliseconds
   */
  private updateMetrics(transformationTime: number): void {
    if (!this.config.performance.enableMetrics) {
      return;
    }

    this.metrics.transformationCount++;
    this.metrics.totalTransformationTime += transformationTime;
    this.metrics.lastTransformationTime = transformationTime;
    this.metrics.averageTransformationTime =
      this.metrics.totalTransformationTime / this.metrics.transformationCount;

    // Calculate cache hit rate
    if (this.config.performance.enableCaching && this.extractorCache.size > 0) {
      const totalRequests = this.metrics.transformationCount * this.schema.propertyNames.length;
      const cacheableRequests = Math.min(totalRequests, this.extractorCache.size);
      this.metrics.cacheHitRate = (cacheableRequests / totalRequests) * 100;
    }
  }

  /**
   * Get performance metrics for transformation operations
   * @returns Transformation performance data
   */
  getMetrics(): TransformationMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics.transformationCount = 0;
    this.metrics.totalTransformationTime = 0;
    this.metrics.averageTransformationTime = 0;
    this.metrics.errorCount = 0;
    this.metrics.lastTransformationTime = 0;
    this.metrics.cacheHitRate = 0;
    this.metrics.largestPayloadSize = 0;
  }

  /**
   * Clear extractor cache
   */
  clearCache(): void {
    this.extractorCache.clear();
  }
}

/**
 * Default conversion configuration
 */
export const DEFAULT_CONVERSION_CONFIG: ConversionConfig = {
  strictTypeValidation: true,
  preserveRichTextFormatting: false,
  missingPropertyStrategy: 'null',
  performance: {
    enableCaching: true,
    cacheMaxSize: 100,
    enableMetrics: true,
  },
};
