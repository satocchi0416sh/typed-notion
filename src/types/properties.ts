/**
 * Property-specific type definitions for MVP Property Types
 *
 * Extends core types with specialized property interfaces
 * Implements User Story 1: Basic Schema Definition support
 */

import type { PropertyDefinition } from './core.js';

/**
 * Title property definition
 * Every schema must have exactly one title property
 */
export interface TitleProperty {
  readonly type: 'title';
}

/**
 * Rich text property definition
 * Supports formatted text content
 */
export interface RichTextProperty {
  readonly type: 'rich_text';
}

/**
 * Number property definition
 * Supports various number formatting options
 */
export interface NumberProperty {
  readonly type: 'number';
  readonly format?: 'number' | 'percent' | 'dollar';
}

/**
 * Checkbox property definition
 * Boolean values with null support
 */
export interface CheckboxProperty {
  readonly type: 'checkbox';
}

/**
 * Date property definition
 * Date values with null support
 */
export interface DateProperty {
  readonly type: 'date';
}

/**
 * URL property definition
 * String values validated as URLs
 */
export interface URLProperty {
  readonly type: 'url';
}

/**
 * Email property definition
 * String values validated as email addresses
 */
export interface EmailProperty {
  readonly type: 'email';
}

/**
 * Select property definition
 * Single selection from predefined options
 */
export interface SelectProperty {
  readonly type: 'select';
  readonly options: readonly string[];
}

/**
 * Multi-select property definition
 * Multiple selections from predefined options
 */
export interface MultiSelectProperty {
  readonly type: 'multi_select';
  readonly options: readonly string[];
}

/**
 * People property definition
 * References to Notion users
 */
export interface PeopleProperty {
  readonly type: 'people';
}

/**
 * Union of all property types for type narrowing
 * Matches the PropertyDefinition from core types
 */
export type SpecificPropertyDefinition =
  | TitleProperty
  | RichTextProperty
  | NumberProperty
  | CheckboxProperty
  | DateProperty
  | URLProperty
  | EmailProperty
  | SelectProperty
  | MultiSelectProperty
  | PeopleProperty;

/**
 * Type guard to check if a property is a basic property (User Story 1)
 * Basic properties: title, number, checkbox
 */
export function isBasicProperty(
  property: PropertyDefinition
): property is TitleProperty | NumberProperty | CheckboxProperty {
  return property.type === 'title' || property.type === 'number' || property.type === 'checkbox';
}

/**
 * Type guard to check if a property is a text property (User Story 2)
 * Text properties: title, rich_text
 */
export function isTextProperty(
  property: PropertyDefinition
): property is TitleProperty | RichTextProperty {
  return property.type === 'title' || property.type === 'rich_text';
}

/**
 * Type guard to check if a property is a selection property (User Story 2)
 * Selection properties: select, multi_select
 */
export function isSelectionProperty(
  property: PropertyDefinition
): property is SelectProperty | MultiSelectProperty {
  return property.type === 'select' || property.type === 'multi_select';
}

/**
 * Type guard to check if a property is a contact property (User Story 3)
 * Contact properties: email, url, people
 */
export function isContactProperty(
  property: PropertyDefinition
): property is EmailProperty | URLProperty | PeopleProperty {
  return property.type === 'email' || property.type === 'url' || property.type === 'people';
}

/**
 * Type guard to check if a property is a date property (User Story 3)
 */
export function isDateProperty(property: PropertyDefinition): property is DateProperty {
  return property.type === 'date';
}

/**
 * Get the category of a property for organization
 */
export function getPropertyCategory(
  property: PropertyDefinition
): 'basic' | 'text' | 'selection' | 'contact' | 'date' {
  if (isBasicProperty(property)) return 'basic';
  if (isTextProperty(property)) return 'text';
  if (isSelectionProperty(property)) return 'selection';
  if (isContactProperty(property)) return 'contact';
  if (isDateProperty(property)) return 'date';

  // This should never happen with proper typing, but provides fallback
  return 'basic';
}
