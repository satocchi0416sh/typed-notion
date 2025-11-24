/**
 * Schema system exports for MVP Property Types
 *
 * Re-exports all schema-related functionality
 */

export { TypedSchema, createTypedSchema } from './typed-schema.js';

export {
  ZodSchemaGenerator,
  getZodSchemaGenerator,
  resetZodSchemaGenerator,
} from './zod-generator.js';

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
} from './property-types.js';

export {
  isValidOperator,
  getValidOperators,
  validateFilterValue,
  getFilterValueDescription,
} from './property-types.js';

export {
  validatePropertyType,
  validatePropertyDefinition,
  validateSchemaDefinition,
  validateDatabaseId,
  validatePropertyName,
  validateSelectionOptions,
  isValidSchemaDefinition,
  isValidPropertyDefinition,
} from './validation.js';

export {
  validateSchemaStructure,
  validatePropertyStructure,
  validatePropertyValue,
  validateSchema,
  DEFAULT_VALIDATION_CONFIG,
} from './validator.js';

export type { ValidationResult, ValidationConfig } from './validator.js';
