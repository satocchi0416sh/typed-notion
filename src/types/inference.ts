/**
 * Type inference system for MVP Property Types
 * Extended with Complex Property Type Inference
 *
 * Based on contracts/schema-api.ts and research decisions
 * Implements advanced TypeScript type inference with literal type preservation
 */

import type { PropertyDefinition, NotionUser, SchemaDefinition } from './core.js';
import type { RollupFunction, FormulaReturnType, FormulaUnionType } from './properties.js';

/**
 * Maps property types to their TypeScript equivalents
 * All types include null as per nullability rules from clarifications
 */
interface PropertyTypeMap {
  title: string | null;
  rich_text: string | null;
  number: number | null;
  checkbox: boolean | null;
  date: Date | null;
  url: string | null;
  email: string | null;
  select: string | null; // Overridden by literal unions
  multi_select: string[] | null; // Overridden by literal unions
  people: NotionUser[] | null;
  created_time: Date | null;
  created_by: NotionUser | null;
  last_edited_time: Date | null;
  last_edited_by: NotionUser | null;
  rollup: number | Date | null; // Inferred by function
  formula: unknown | null; // Inferred by returnType hint
}

/**
 * Maps rollup functions to their result types
 */
type InferRollupType<F extends RollupFunction> = F extends 'count'
  ? number | null
  : F extends 'sum' | 'average' | 'min' | 'max'
    ? number | null
    : F extends 'earliest' | 'latest'
      ? Date | null
      : never;

/**
 * Resolves formula return types to TypeScript types
 */
type ResolveFormulaType<T extends FormulaReturnType> = T extends 'string'
  ? string | null
  : T extends 'number'
    ? number | null
    : T extends 'boolean'
      ? boolean | null
      : T extends 'date'
        ? Date | null
        : T extends FormulaUnionType
          ? ResolveUnionType<T['types']> | null
          : never;

/**
 * Resolves union types recursively
 */
type ResolveUnionType<T extends readonly FormulaReturnType[]> = T extends readonly []
  ? never
  : T extends readonly [infer Head, ...infer Tail]
    ? Head extends FormulaReturnType
      ? Tail extends readonly FormulaReturnType[]
        ? ResolveFormulaTypeBase<Head> | ResolveUnionType<Tail>
        : never
      : never
    : never;

/**
 * Helper to resolve individual formula types without null
 */
type ResolveFormulaTypeBase<T extends FormulaReturnType> = T extends 'string'
  ? string
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : T extends 'date'
        ? Date
        : T extends FormulaUnionType
          ? ResolveUnionType<T['types']>
          : never;

/**
 * Infers the TypeScript type for a property definition
 *
 * This is the core type transformation that enables literal type preservation
 * for select and multi_select properties while maintaining null safety
 * Extended with rollup and formula type inference
 */
export type InferPropertyType<T extends PropertyDefinition> = T extends {
  type: 'select';
  options: readonly (infer U)[];
}
  ? U | null
  : T extends { type: 'multi_select'; options: readonly (infer U)[] }
    ? U[] | null
    : T extends { type: 'rollup'; function: infer F }
      ? F extends RollupFunction
        ? InferRollupType<F>
        : never
      : T extends { type: 'formula'; returnType: infer R }
        ? R extends FormulaReturnType
          ? ResolveFormulaType<R>
          : never
        : T extends { type: infer K }
          ? K extends keyof PropertyTypeMap
            ? PropertyTypeMap[K]
            : never
          : never;

/**
 * Infers property types for an entire schema
 *
 * Transforms a schema definition into a typed property object
 * where each property has its correct TypeScript type
 */
export type InferSchemaProperties<S extends SchemaDefinition> = {
  [K in keyof S['properties']]: InferPropertyType<S['properties'][K]>;
};

/**
 * Type guard to check if a value is a valid property type
 */
export function isValidPropertyType(type: string): type is keyof PropertyTypeMap {
  const validTypes: ReadonlyArray<keyof PropertyTypeMap> = [
    'title',
    'rich_text',
    'number',
    'checkbox',
    'date',
    'url',
    'email',
    'select',
    'multi_select',
    'people',
    'created_time',
    'created_by',
    'last_edited_time',
    'last_edited_by',
    'rollup',
    'formula',
  ];
  return validTypes.includes(type as keyof PropertyTypeMap);
}

/**
 * Type guard to check if a property definition has selection options
 */
export function hasSelectionOptions(
  definition: PropertyDefinition
): definition is Extract<PropertyDefinition, { options: readonly string[] }> {
  return (
    (definition.type === 'select' || definition.type === 'multi_select') && 'options' in definition
  );
}

/**
 * Type guard to check if a property definition is for a title property
 */
export function isTitleProperty(definition: PropertyDefinition): definition is { type: 'title' } {
  return definition.type === 'title';
}

/**
 * Extract literal option types from select/multi_select properties
 * Used for runtime validation of selection values
 */
export type ExtractSelectionOptions<T extends PropertyDefinition> = T extends {
  type: 'select' | 'multi_select';
  options: readonly (infer U)[];
}
  ? U extends string
    ? U
    : never
  : never;
