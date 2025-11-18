/**
 * TypedSchema base class for MVP Property Types
 * 
 * Implements User Story 1: Basic Schema Definition
 * Provides type-safe schema creation with compile-time and runtime validation
 */

import type { SchemaDefinition, PropertyDefinition, PerformanceMetrics } from '../types/core.js';
import type { InferSchemaProperties } from '../types/inference.js';
import { validateSchemaDefinition, validatePropertyName } from './validation.js';
import { SchemaValidationError, PropertyAccessError } from '../errors/index.js';

/**
 * TypedSchema class provides type-safe schema management
 * 
 * Generic parameter S extends SchemaDefinition to enable:
 * - Compile-time type inference for property access
 * - Runtime validation of schema structure
 * - Type-safe query result mapping
 */
export class TypedSchema<S extends SchemaDefinition> {
  private readonly _definition: S;
  private readonly _createdAt: Date;
  private _lastQueryDuration: number = 0;

  /**
   * Create a new TypedSchema instance
   * 
   * @param definition - Schema definition object
   * @throws {SchemaValidationError} When schema validation fails
   */
  constructor(definition: S) {
    // Validate schema at creation time (FR-008)
    try {
      validateSchemaDefinition(definition);
    } catch (error) {
      if (error instanceof Error) {
        throw new SchemaValidationError('schema', 'valid schema definition', definition);
      }
      throw error;
    }

    this._definition = definition;
    this._createdAt = new Date();
  }

  /**
   * Get the database ID for this schema
   */
  get databaseId(): string {
    return this._definition.databaseId;
  }

  /**
   * Get the schema definition (read-only)
   */
  get definition(): S {
    return this._definition;
  }

  /**
   * Get all property names defined in this schema
   */
  get propertyNames(): string[] {
    return Object.keys(this._definition.properties);
  }

  /**
   * Get all property definitions
   */
  get properties(): S['properties'] {
    return this._definition.properties;
  }

  /**
   * Get creation timestamp
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Check if a property exists in this schema
   * 
   * @param propertyName - Name of the property to check
   * @returns True if property exists
   */
  hasProperty(propertyName: string): boolean {
    return propertyName in this._definition.properties;
  }

  /**
   * Get a specific property definition
   * 
   * @param propertyName - Name of the property
   * @returns Property definition
   * @throws {PropertyAccessError} When property doesn't exist
   */
  getProperty<K extends keyof S['properties']>(propertyName: K): S['properties'][K] {
    const propName = String(propertyName);
    if (!this.hasProperty(propName)) {
      throw new PropertyAccessError(propName, this._definition.databaseId);
    }
    
    return this._definition.properties[propertyName as string] as S['properties'][K];
  }

  /**
   * Validate a property name follows naming conventions
   * 
   * @param name - Property name to validate
   * @throws {SchemaValidationError} When name is invalid
   */
  validatePropertyName(name: string): void {
    try {
      validatePropertyName(name);
    } catch (error) {
      if (error instanceof Error) {
        throw new SchemaValidationError('propertyName', 'valid property name', name);
      }
      throw error;
    }
  }

  /**
   * Get the title property for this schema
   * Every schema must have exactly one title property
   */
  getTitleProperty(): { name: keyof S['properties']; definition: PropertyDefinition } {
    const titleEntries = Object.entries(this._definition.properties)
      .filter(([, def]) => def.type === 'title');
    
    if (titleEntries.length === 0) {
      throw new SchemaValidationError('titleProperty', 'exactly one title property', 'none found');
    }
    
    if (titleEntries.length > 1) {
      throw new SchemaValidationError('titleProperty', 'exactly one title property', `${titleEntries.length} found`);
    }

    const [name, definition] = titleEntries[0]!;
    return { name: name as keyof S['properties'], definition };
  }

  /**
   * Get properties by type
   * 
   * @param type - Property type to filter by
   * @returns Array of property entries matching the type
   */
  getPropertiesByType<T extends PropertyDefinition['type']>(
    type: T
  ): Array<{ name: keyof S['properties']; definition: Extract<S['properties'][keyof S['properties']], { type: T }> }> {
    return Object.entries(this._definition.properties)
      .filter((entry): entry is [string, Extract<S['properties'][keyof S['properties']], { type: T }>] => {
        const [, def] = entry;
        return def.type === type;
      })
      .map(([name, definition]) => ({ 
        name: name as keyof S['properties'], 
        definition 
      }));
  }

  /**
   * Update last query duration for performance tracking
   * Internal method used by query operations
   */
  _updateQueryDuration(duration: number): void {
    this._lastQueryDuration = duration;
  }

  /**
   * Get performance metrics for this schema (NFR-001)
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now();
    const schemaProcessingTime = now - this._createdAt.getTime();
    
    return {
      schemaProcessingTime,
      activeSchemaCount: 1, // Single schema instance
      lastQueryDuration: this._lastQueryDuration
    };
  }

  /**
   * Create a type-safe property value validator
   * Returns a function that validates property values match schema types
   */
  createPropertyValidator(): <K extends keyof InferSchemaProperties<S>>(
    propertyName: K,
    value: unknown
  ) => value is InferSchemaProperties<S>[K] {
    return <K extends keyof InferSchemaProperties<S>>(
      propertyName: K,
      value: unknown
    ): value is InferSchemaProperties<S>[K] => {
      // Get property definition
      const propDef = this.getProperty(propertyName);
      
      // Handle null values (all properties are nullable)
      if (value === null || value === undefined) {
        return true;
      }

      // Type-specific validation
      switch (propDef.type) {
        case 'title':
        case 'rich_text':
        case 'url':
        case 'email':
          return typeof value === 'string';
          
        case 'number':
          return typeof value === 'number' && !isNaN(value);
          
        case 'checkbox':
          return typeof value === 'boolean';
          
        case 'date':
          return value instanceof Date;
          
        case 'select':
          if ('options' in propDef && typeof value === 'string') {
            return propDef.options.includes(value);
          }
          return false;
          
        case 'multi_select':
          if ('options' in propDef && Array.isArray(value)) {
            return value.every(v => typeof v === 'string' && propDef.options.includes(v));
          }
          return false;
          
        case 'people':
          return Array.isArray(value);
          
        default:
          return false;
      }
    };
  }

  /**
   * Convert schema to JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      databaseId: this._definition.databaseId,
      properties: this._definition.properties,
      createdAt: this._createdAt.toISOString(),
      propertyCount: Object.keys(this._definition.properties).length
    };
  }
}

/**
 * Factory function to create a TypedSchema with type inference
 * 
 * @param definition - Schema definition
 * @returns TypedSchema instance with inferred types
 */
export function createTypedSchema<S extends SchemaDefinition>(
  definition: S
): TypedSchema<S> {
  return new TypedSchema(definition);
}