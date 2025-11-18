/**
 * Valibot validation schemas for runtime validation
 * 
 * Based on research decisions (Valibot chosen for performance and bundle size)
 * Implements creation-time validation as per clarifications
 */

import * as v from 'valibot';
import type { PropertyDefinition, SchemaDefinition, PropertyType } from '../types/core.js';

/**
 * Validation schema for property types
 */
const propertyTypeSchema = v.picklist([
  'title',
  'rich_text',
  'number',
  'checkbox',
  'date',
  'url',
  'email',
  'select',
  'multi_select',
  'people'
] as const);

/**
 * Validation schema for property definitions
 * Uses discriminated union based on property type
 */
const propertyDefinitionSchema = v.variant('type', [
  v.object({
    type: v.literal('title')
  }),
  v.object({
    type: v.literal('rich_text')
  }),
  v.object({
    type: v.literal('number'),
    format: v.optional(v.picklist(['number', 'percent', 'dollar']))
  }),
  v.object({
    type: v.literal('checkbox')
  }),
  v.object({
    type: v.literal('date')
  }),
  v.object({
    type: v.literal('url')
  }),
  v.object({
    type: v.literal('email')
  }),
  v.object({
    type: v.literal('select'),
    options: v.pipe(
      v.array(v.string()),
      v.check((options) => options.length > 0, 'Select options cannot be empty'),
      v.check((options) => new Set(options).size === options.length, 'Select options must be unique')
    )
  }),
  v.object({
    type: v.literal('multi_select'),
    options: v.pipe(
      v.array(v.string()),
      v.check((options) => options.length > 0, 'Multi-select options cannot be empty'),
      v.check((options) => new Set(options).size === options.length, 'Multi-select options must be unique')
    )
  }),
  v.object({
    type: v.literal('people')
  })
]);

/**
 * Validation schema for schema definitions
 * Enforces structural rules and business constraints
 */
const schemaDefinitionSchema = v.pipe(
  v.object({
    databaseId: v.pipe(
      v.string(),
      v.minLength(1, 'Database ID cannot be empty'),
      v.regex(/^[a-f0-9\-]{36}$/, 'Database ID must be a valid UUID format')
    ),
    properties: v.pipe(
      v.record(v.string(), propertyDefinitionSchema),
      v.check((properties) => Object.keys(properties).length > 0, 'Schema must have at least one property'),
      v.check((properties) => Object.keys(properties).length <= 20, 'Schema cannot have more than 20 properties'),
      v.check(
        (properties) => {
          const titleProperties = Object.values(properties).filter((prop) => prop.type === 'title');
          return titleProperties.length === 1;
        },
        'Schema must have exactly one title property'
      )
    )
  })
);

/**
 * Validation schema for Notion database IDs
 */
const databaseIdSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.regex(/^[a-f0-9\-]{36}$/, 'Invalid database ID format')
);

/**
 * Validation schema for property names
 */
const propertyNameSchema = v.pipe(
  v.string(),
  v.minLength(1, 'Property name cannot be empty'),
  v.maxLength(100, 'Property name too long'),
  v.regex(/^[a-zA-Z][a-zA-Z0-9_\s]*$/, 'Property name must start with letter and contain only letters, numbers, underscores, and spaces')
);

/**
 * Validate a property type string
 */
export function validatePropertyType(type: string): PropertyType {
  return v.parse(propertyTypeSchema, type);
}

/**
 * Validate a property definition object
 */
export function validatePropertyDefinition(definition: unknown): PropertyDefinition {
  return v.parse(propertyDefinitionSchema, definition);
}

/**
 * Validate a complete schema definition
 * This is the main validation function used during schema creation
 */
export function validateSchemaDefinition(schema: unknown): SchemaDefinition {
  return v.parse(schemaDefinitionSchema, schema);
}

/**
 * Validate a database ID
 */
export function validateDatabaseId(id: string): string {
  return v.parse(databaseIdSchema, id);
}

/**
 * Validate a property name
 */
export function validatePropertyName(name: string): string {
  return v.parse(propertyNameSchema, name);
}

/**
 * Validate selection options array
 */
export function validateSelectionOptions(options: unknown): string[] {
  const optionsSchema = v.pipe(
    v.array(v.string()),
    v.check((opts) => opts.length > 0, 'Selection options cannot be empty'),
    v.check((opts) => new Set(opts).size === opts.length, 'Selection options must be unique'),
    v.check((opts) => opts.every(opt => opt.trim().length > 0), 'Selection options cannot be empty strings')
  );
  
  return v.parse(optionsSchema, options);
}

/**
 * Type guard that validates if an object is a valid schema definition
 */
export function isValidSchemaDefinition(value: unknown): value is SchemaDefinition {
  try {
    validateSchemaDefinition(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard that validates if an object is a valid property definition
 */
export function isValidPropertyDefinition(value: unknown): value is PropertyDefinition {
  try {
    validatePropertyDefinition(value);
    return true;
  } catch {
    return false;
  }
}