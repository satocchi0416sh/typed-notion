/**
 * Zod Schema Generator for typed-notion-core-ts
 *
 * Automatically generates Zod validation schemas from TypedSchema definitions
 * with proper type mapping and option preservation for select/multi-select properties.
 */

import { z } from 'zod';
import type { SchemaDefinition, PropertyDefinition } from '../types/core.js';

// Property type to Zod mapping for reference (not used directly due to generic constraints)

/**
 * Zod schema generator for typed schemas
 */
export class ZodSchemaGenerator {
  private readonly schemaCache = new Map<string, z.ZodObject<Record<string, z.ZodTypeAny>>>();

  /**
   * Generate Zod schema from TypedSchema definition
   * @template T - Schema definition type
   * @param definition - Schema definition
   * @returns Zod object schema with proper types
   */
  generateSchema<T extends SchemaDefinition>(definition: T): z.ZodTypeAny {
    // Create cache key from schema definition
    const cacheKey = this.createCacheKey(definition);

    // Check cache first
    const cached = this.schemaCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate property schemas
    const propertySchemas: Record<string, z.ZodNullable<z.ZodTypeAny>> = {};

    for (const [propertyName, propertyDef] of Object.entries(definition.properties)) {
      propertySchemas[propertyName] = this.createPropertySchema(propertyDef);
    }

    // Create Zod object schema
    const zodSchema = z.object(propertySchemas);

    // Cache the result
    this.schemaCache.set(cacheKey, zodSchema);

    return zodSchema;
  }

  /**
   * Create Zod schema for a single property
   * @param propertyDef - Property definition
   * @returns Nullable Zod schema for the property
   */
  private createPropertySchema(propertyDef: PropertyDefinition): z.ZodNullable<z.ZodTypeAny> {
    switch (propertyDef.type) {
      case 'title':
      case 'rich_text':
      case 'url':
        return z.string().nullable();

      case 'email':
        return z.string().email().nullable();

      case 'number':
        return z.number().nullable();

      case 'checkbox':
        return z.boolean().nullable();

      case 'date':
      case 'created_time':
      case 'last_edited_time':
        return z.date().nullable();

      case 'select':
        if ('options' in propertyDef && propertyDef.options) {
          // Create literal union type for select options
          const options = propertyDef.options;
          if (options.length === 0) {
            return z.string().nullable();
          }
          if (options.length === 1) {
            return z.literal(options[0] as string).nullable();
          }
          // Create union of literals for multiple options
          const [first, second, ...rest] = options as readonly string[];
          if (second === undefined) {
            return z.literal(first).nullable();
          }
          return z
            .union([z.literal(first), z.literal(second), ...rest.map(option => z.literal(option))])
            .nullable();
        }
        return z.string().nullable();

      case 'multi_select':
        if ('options' in propertyDef && propertyDef.options) {
          // Create array of literal union type for multi-select options
          const options = propertyDef.options;
          if (options.length === 0) {
            return z.array(z.string()).nullable();
          }
          if (options.length === 1) {
            return z.array(z.literal(options[0] as string)).nullable();
          }
          // Create array of union of literals
          const [first, second, ...rest] = options as readonly string[];
          if (second === undefined) {
            return z.array(z.literal(first)).nullable();
          }
          return z
            .array(
              z.union([
                z.literal(first),
                z.literal(second),
                ...rest.map(option => z.literal(option)),
              ])
            )
            .nullable();
        }
        return z.array(z.string()).nullable();

      case 'people':
      case 'created_by':
      case 'last_edited_by': {
        // Define NotionUser schema
        const notionUserSchema = z.object({
          id: z.string(),
          type: z.union([z.literal('person'), z.literal('bot')]),
          name: z.string().optional(),
          avatar_url: z.string().optional(),
          person: z
            .object({
              email: z.string().optional(),
            })
            .optional(),
          bot: z.record(z.unknown()).optional(),
        });
        return z.array(notionUserSchema).nullable();
      }

      default:
        // Fallback for unknown property types
        return z.unknown().nullable();
    }
  }

  /**
   * Create cache key for schema definition
   * @param definition - Schema definition
   * @returns Cache key string
   */
  private createCacheKey(definition: SchemaDefinition): string {
    // Create deterministic cache key from schema structure
    const properties = Object.entries(definition.properties)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistency
      .map(([name, def]) => {
        if ('options' in def && def.options) {
          return `${name}:${def.type}:[${def.options.join(',')}]`;
        }
        return `${name}:${def.type}`;
      })
      .join('|');

    return `${definition.databaseId}:${properties}`;
  }

  /**
   * Clear schema cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.schemaCache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache usage information
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.schemaCache.size,
      keys: Array.from(this.schemaCache.keys()),
    };
  }
}

// Global instance for performance
let globalGenerator: ZodSchemaGenerator | null = null;

/**
 * Get the global Zod schema generator instance
 * @returns Zod schema generator
 */
export function getZodSchemaGenerator(): ZodSchemaGenerator {
  if (!globalGenerator) {
    globalGenerator = new ZodSchemaGenerator();
  }
  return globalGenerator;
}

/**
 * Reset the global generator instance (useful for testing)
 */
export function resetZodSchemaGenerator(): void {
  if (globalGenerator) {
    globalGenerator.clearCache();
  }
  globalGenerator = null;
}
