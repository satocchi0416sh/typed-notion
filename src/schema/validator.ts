/**
 * Schema validation logic for MVP Property Types
 * 
 * Implements business rules and constraints for User Story 1
 * Focuses on title requirements and basic property type validation
 */

import type { SchemaDefinition, PropertyDefinition } from '../types/core.js';
import { SchemaValidationError, PropertyValidationError, SelectionValidationError } from '../errors/index.js';

/**
 * Validation result interface
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
}

/**
 * Schema validation configuration
 */
export interface ValidationConfig {
  readonly maxProperties: number;
  readonly minProperties: number;
  readonly requireTitle: boolean;
  readonly allowMultipleTitles: boolean;
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxProperties: 20,
  minProperties: 1,
  requireTitle: true,
  allowMultipleTitles: false
} as const;

/**
 * Validates a complete schema definition against business rules
 * 
 * @param schema - Schema definition to validate
 * @param config - Validation configuration (optional)
 * @returns Validation result with errors
 */
export function validateSchemaStructure(
  schema: unknown,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  
  // Basic type check
  if (!schema || typeof schema !== 'object') {
    return { isValid: false, errors: ['Schema must be a non-null object'] };
  }
  
  const typedSchema = schema as Record<string, unknown>;
  
  // Database ID validation
  if (!typedSchema.databaseId || typeof typedSchema.databaseId !== 'string') {
    errors.push('Database ID is required and must be a string');
  } else if (!isValidDatabaseId(typedSchema.databaseId)) {
    errors.push('Database ID must be a valid UUID format');
  }
  
  // Properties validation
  if (!typedSchema.properties || typeof typedSchema.properties !== 'object') {
    errors.push('Properties are required and must be an object');
    return { isValid: false, errors };
  }
  
  const properties = typedSchema.properties as Record<string, unknown>;
  const propertyEntries = Object.entries(properties);
  
  // Property count validation
  if (propertyEntries.length < config.minProperties) {
    errors.push(`Schema must have at least ${config.minProperties} property`);
  }
  
  if (propertyEntries.length > config.maxProperties) {
    errors.push(`Schema cannot have more than ${config.maxProperties} properties`);
  }
  
  // Title property validation
  const titleProperties = propertyEntries.filter(([, def]) => 
    isPropertyDefinition(def) && def.type === 'title'
  );
  
  if (config.requireTitle && titleProperties.length === 0) {
    errors.push('Schema must have exactly one title property');
  }
  
  if (!config.allowMultipleTitles && titleProperties.length > 1) {
    errors.push('Schema cannot have multiple title properties');
  }
  
  // Validate each property
  for (const [name, definition] of propertyEntries) {
    const propertyErrors = validatePropertyStructure(name, definition);
    errors.push(...propertyErrors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a single property definition
 * 
 * @param name - Property name
 * @param definition - Property definition to validate
 * @returns Array of validation errors
 */
export function validatePropertyStructure(name: string, definition: unknown): string[] {
  const errors: string[] = [];
  
  // Property name validation
  const nameErrors = validatePropertyName(name);
  errors.push(...nameErrors);
  
  // Property definition validation
  if (!isPropertyDefinition(definition)) {
    errors.push(`Property '${name}': Invalid property definition structure`);
    return errors;
  }
  
  // Type-specific validation
  switch (definition.type) {
    case 'title':
    case 'rich_text':
    case 'checkbox':
    case 'date':
    case 'url':
    case 'email':
    case 'people':
      // These types have no additional validation rules
      break;
      
    case 'number':
      if (definition.format && !isValidNumberFormat(definition.format)) {
        errors.push(`Property '${name}': Invalid number format '${definition.format}'`);
      }
      break;
      
    case 'select':
    case 'multi_select':
      if (!('options' in definition) || !Array.isArray(definition.options)) {
        errors.push(`Property '${name}': Selection properties must have options array`);
      } else {
        const optionErrors = validateSelectionOptions(definition.options, name);
        errors.push(...optionErrors);
      }
      break;
      
    default:
      errors.push(`Property '${name}': Unknown property type`);
  }
  
  return errors;
}

/**
 * Validates a property name follows naming conventions
 * 
 * @param name - Property name to validate
 * @returns Array of validation errors
 */
export function validatePropertyName(name: string): string[] {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Property name must be a non-empty string');
    return errors;
  }
  
  if (name.length === 0) {
    errors.push('Property name cannot be empty');
  }
  
  if (name.length > 100) {
    errors.push('Property name cannot exceed 100 characters');
  }
  
  // Must start with letter
  if (!/^[a-zA-Z]/.test(name)) {
    errors.push('Property name must start with a letter');
  }
  
  // Valid characters: letters, numbers, underscores, spaces
  if (!/^[a-zA-Z][a-zA-Z0-9_\s]*$/.test(name)) {
    errors.push('Property name can only contain letters, numbers, underscores, and spaces');
  }
  
  return errors;
}

/**
 * Validates selection options for select/multi_select properties
 * 
 * @param options - Selection options to validate
 * @param propertyName - Property name for error context
 * @returns Array of validation errors
 */
export function validateSelectionOptions(options: unknown, propertyName: string): string[] {
  const errors: string[] = [];
  
  if (!Array.isArray(options)) {
    errors.push(`Property '${propertyName}': Options must be an array`);
    return errors;
  }
  
  if (options.length === 0) {
    errors.push(`Property '${propertyName}': Selection options cannot be empty`);
  }
  
  // Check all options are strings
  const invalidOptions = options.filter(option => typeof option !== 'string');
  if (invalidOptions.length > 0) {
    errors.push(`Property '${propertyName}': All options must be strings`);
  }
  
  // Check for empty string options
  const emptyOptions = options.filter(option => 
    typeof option === 'string' && option.trim().length === 0
  );
  if (emptyOptions.length > 0) {
    errors.push(`Property '${propertyName}': Options cannot be empty strings`);
  }
  
  // Check for duplicates
  const stringOptions = options.filter(option => typeof option === 'string') as string[];
  const uniqueOptions = new Set(stringOptions);
  if (uniqueOptions.size !== stringOptions.length) {
    errors.push(`Property '${propertyName}': Options must be unique`);
  }
  
  return errors;
}

/**
 * Validates a property value matches its schema definition
 * 
 * @param value - Value to validate
 * @param definition - Property definition to validate against
 * @param propertyName - Property name for error context
 * @throws {PropertyValidationError} When value doesn't match property type
 * @throws {SelectionValidationError} When selection value is invalid
 */
export function validatePropertyValue(
  value: unknown,
  definition: PropertyDefinition,
  propertyName: string
): void {
  // Handle null/undefined values (all properties are nullable)
  if (value === null || value === undefined) {
    return;
  }
  
  switch (definition.type) {
    case 'title':
    case 'rich_text':
      if (typeof value !== 'string') {
        throw new PropertyValidationError(propertyName, value, 'string');
      }
      break;
      
    case 'email':
      if (typeof value !== 'string') {
        throw new PropertyValidationError(propertyName, value, 'string');
      }
      if (!isValidEmail(value)) {
        throw new PropertyValidationError(propertyName, value, 'valid email address');
      }
      break;
      
    case 'url':
      if (typeof value !== 'string') {
        throw new PropertyValidationError(propertyName, value, 'string');
      }
      if (!isValidURL(value)) {
        throw new PropertyValidationError(propertyName, value, 'valid URL');
      }
      break;
      
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        throw new PropertyValidationError(propertyName, value, 'number');
      }
      break;
      
    case 'checkbox':
      if (typeof value !== 'boolean') {
        throw new PropertyValidationError(propertyName, value, 'boolean');
      }
      break;
      
    case 'date':
      if (!(value instanceof Date)) {
        throw new PropertyValidationError(propertyName, value, 'Date');
      }
      break;
      
    case 'select':
      if (typeof value !== 'string') {
        throw new PropertyValidationError(propertyName, value, 'string');
      }
      if ('options' in definition && !definition.options.includes(value)) {
        throw new SelectionValidationError(propertyName, value, definition.options);
      }
      break;
      
    case 'multi_select':
      if (!Array.isArray(value)) {
        throw new PropertyValidationError(propertyName, value, 'string[]');
      }
      if (!value.every(v => typeof v === 'string')) {
        throw new PropertyValidationError(propertyName, value, 'string[]');
      }
      if ('options' in definition) {
        const invalidValues = value.filter(v => !definition.options.includes(v));
        if (invalidValues.length > 0) {
          throw new SelectionValidationError(propertyName, invalidValues[0], definition.options);
        }
      }
      break;
      
    case 'people':
      if (!Array.isArray(value)) {
        throw new PropertyValidationError(propertyName, value, 'NotionUser[]');
      }
      if (!value.every(isValidNotionUser)) {
        throw new PropertyValidationError(propertyName, value, 'array of valid NotionUser objects');
      }
      break;
  }
}

/**
 * Type guard to check if an object is a valid property definition
 */
function isPropertyDefinition(value: unknown): value is PropertyDefinition {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  if (!obj.type || typeof obj.type !== 'string') {
    return false;
  }
  
  const validTypes = [
    'title', 'rich_text', 'number', 'checkbox', 'date', 
    'url', 'email', 'select', 'multi_select', 'people'
  ];
  
  return validTypes.includes(obj.type);
}

/**
 * Validates database ID format (UUID)
 */
function isValidDatabaseId(id: string): boolean {
  return /^[a-f0-9\-]{36}$/.test(id);
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates URL format
 */
function isValidURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates NotionUser object structure
 */
function isValidNotionUser(user: unknown): user is { id: string; name?: string | null; type: 'person' | 'bot' } {
  if (!user || typeof user !== 'object') {
    return false;
  }
  
  const userObj = user as Record<string, unknown>;
  return (
    typeof userObj.id === 'string' &&
    userObj.id.length > 0 &&
    (userObj.name === null || userObj.name === undefined || typeof userObj.name === 'string') &&
    (userObj.type === 'person' || userObj.type === 'bot')
  );
}

/**
 * Validates number format options
 */
function isValidNumberFormat(format: unknown): format is 'number' | 'percent' | 'dollar' {
  return format === 'number' || format === 'percent' || format === 'dollar';
}

/**
 * High-level schema validation function that throws on errors
 * 
 * @param schema - Schema to validate
 * @param config - Validation configuration
 * @throws {SchemaValidationError} When validation fails
 */
export function validateSchema(
  schema: unknown,
  config?: ValidationConfig
): asserts schema is SchemaDefinition {
  const result = validateSchemaStructure(schema, config);
  
  if (!result.isValid) {
    throw new SchemaValidationError(
      'schema',
      'valid schema structure',
      `Validation failed: ${result.errors.join(', ')}`
    );
  }
}