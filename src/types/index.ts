/**
 * Type system exports for MVP Property Types
 *
 * Re-exports all type definitions for convenient access
 */

export type {
  PropertyType,
  PropertyDefinition,
  SchemaDefinition,
  NotionUser,
  QueryOptions,
  PerformanceMetrics,
} from './core.js';

export type {
  InferPropertyType,
  InferSchemaProperties,
  ExtractSelectionOptions,
} from './inference.js';

export { isValidPropertyType, hasSelectionOptions, isTitleProperty } from './inference.js';

export type {
  TitleProperty,
  RichTextProperty,
  NumberProperty,
  CheckboxProperty,
  DateProperty,
  URLProperty,
  EmailProperty,
  SelectProperty,
  MultiSelectProperty,
  PeopleProperty,
  RollupProperty,
  FormulaProperty,
  RollupFunction,
  FormulaReturnType,
  FormulaUnionType,
  SpecificPropertyDefinition,
} from './properties.js';

export {
  isBasicProperty,
  isTextProperty,
  isSelectionProperty,
  isContactProperty,
  isDateProperty,
  isRollupProperty,
  isFormulaProperty,
  isComplexProperty,
  getPropertyCategory,
} from './properties.js';

// Helper functions for creating complex properties
export { rollup, formula, union } from './helpers.js';
