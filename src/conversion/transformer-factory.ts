/**
 * Transformer Factory for typed-notion-core-ts
 *
 * Creates and manages NotionPageTransformer instances with caching
 * and performance optimization.
 */

import type { SchemaDefinition } from '../types/core.js';
import { NotionPageTransformer, DEFAULT_CONVERSION_CONFIG } from './page-transformer.js';
import type { ConversionConfig } from './page-transformer.js';

/**
 * Enhanced typed schema interface for transformer factory
 */
export interface EnhancedTypedSchema<T extends SchemaDefinition> {
  readonly definition: T;
  readonly propertyNames: string[];
  readonly databaseId: string;
  readonly createdAt: Date;
}

/**
 * Transformer factory for creating page transformers
 */
export class TransformerFactory {
  private readonly transformerCache = new Map<string, NotionPageTransformer<SchemaDefinition>>();
  private readonly maxCacheSize: number;

  constructor(maxCacheSize = 50) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Create transformer for specific schema
   * @template T - Schema definition type
   * @param schema - Schema definition
   * @param config - Configuration for transformation behavior
   * @returns Page transformer instance
   */
  createTransformer<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    config: ConversionConfig = DEFAULT_CONVERSION_CONFIG
  ): NotionPageTransformer<T> {
    return new NotionPageTransformer(
      {
        definition: schema.definition,
        propertyNames: schema.propertyNames,
      },
      config
    );
  }

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
    config: ConversionConfig = DEFAULT_CONVERSION_CONFIG
  ): NotionPageTransformer<T> {
    const key = cacheKey || this.createCacheKey(schema, config);

    // Check if transformer exists in cache
    const cached = this.transformerCache.get(key);
    if (cached) {
      return cached as NotionPageTransformer<T>;
    }

    // Create new transformer
    const transformer = this.createTransformer(schema, config);

    // Add to cache with size limit
    if (this.transformerCache.size >= this.maxCacheSize) {
      // Remove oldest entry (first in iteration order)
      const firstKey = this.transformerCache.keys().next().value;
      if (firstKey) {
        this.transformerCache.delete(firstKey);
      }
    }

    this.transformerCache.set(key, transformer);
    return transformer;
  }

  /**
   * Clear transformer cache
   */
  clearCache(): void {
    this.transformerCache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache usage information
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    keys: string[];
    hitRate?: number;
  } {
    return {
      size: this.transformerCache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.transformerCache.keys()),
    };
  }

  /**
   * Create cache key for schema and config
   * @param schema - Schema definition
   * @param config - Conversion configuration
   * @returns Cache key string
   */
  private createCacheKey<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    config: ConversionConfig
  ): string {
    // Create deterministic key based on schema and config
    const schemaKey = `${schema.databaseId}:${schema.propertyNames.sort().join(',')}`;
    const configKey = `${config.strictTypeValidation}:${config.missingPropertyStrategy}:${config.preserveRichTextFormatting}`;
    return `${schemaKey}|${configKey}`;
  }

  /**
   * Remove specific transformer from cache
   * @param cacheKey - Cache key to remove
   * @returns True if transformer was removed
   */
  removeFromCache(cacheKey: string): boolean {
    return this.transformerCache.delete(cacheKey);
  }

  /**
   * Check if transformer exists in cache
   * @param cacheKey - Cache key to check
   * @returns True if transformer exists in cache
   */
  hasInCache(cacheKey: string): boolean {
    return this.transformerCache.has(cacheKey);
  }
}

/**
 * Streaming transformer for large datasets
 */
export class StreamingTransformer<T extends SchemaDefinition> {
  constructor(
    private readonly transformer: NotionPageTransformer<T>,
    private readonly batchSize = 10
  ) {}

  /**
   * Transform pages in batches for memory efficiency
   * @param pages - Raw Notion page responses
   * @param batchSize - Number of pages to process per batch
   * @returns Async generator yielding transformation results
   */
  async *transformStream(
    pages: Array<import('./page-transformer.js').NotionAPIResponse>,
    batchSize: number = this.batchSize
  ): AsyncGenerator<
    import('../errors/index.js').Result<
      Array<import('../types/inference.js').InferSchemaProperties<T> & { id: string }>
    >
  > {
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(page => this.transformAsync(page)));

      // Separate successful and failed results
      const successfulResults: Array<
        import('../types/inference.js').InferSchemaProperties<T> & { id: string }
      > = [];
      const errors: Array<import('../errors/index.js').ConversionError> = [];

      for (const result of results) {
        if (result.ok) {
          successfulResults.push(result.value);
        } else {
          errors.push(result.error);
        }
      }

      // Yield batch result
      if (errors.length === 0) {
        yield { ok: true, value: successfulResults };
      } else {
        const firstError = errors[0];
        if (firstError) {
          yield { ok: false, error: firstError };
        }
      }
    }
  }

  /**
   * Transform single page asynchronously
   * @param page - Raw Notion page response
   * @returns Promise resolving to transformation result
   */
  async transformAsync(
    page: import('./page-transformer.js').NotionAPIResponse
  ): Promise<
    import('../errors/index.js').Result<
      import('../types/inference.js').InferSchemaProperties<T> & { id: string }
    >
  > {
    return new Promise(resolve => {
      // Use setTimeout to make transformation asynchronous
      globalThis.setTimeout(() => {
        const result = this.transformer.transform(page);
        resolve(result);
      }, 0);
    });
  }

  /**
   * Get performance metrics from underlying transformer
   * @returns Transformation metrics
   */
  getMetrics(): import('./page-transformer.js').TransformationMetrics {
    return this.transformer.getMetrics();
  }
}

// Global factory instance
let globalFactory: TransformerFactory | null = null;

/**
 * Get the global transformer factory instance
 * @param maxCacheSize - Maximum cache size for the factory
 * @returns Transformer factory instance
 */
export function getTransformerFactory(maxCacheSize?: number): TransformerFactory {
  if (!globalFactory || (maxCacheSize && maxCacheSize !== 50)) {
    globalFactory = new TransformerFactory(maxCacheSize);
  }
  return globalFactory;
}

/**
 * Reset the global factory instance (useful for testing)
 */
export function resetTransformerFactory(): void {
  if (globalFactory) {
    globalFactory.clearCache();
  }
  globalFactory = null;
}
