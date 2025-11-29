/**
 * Helper functions for creating complex property definitions
 *
 * Provides a more ergonomic API for defining rollup and formula properties
 * with better developer experience and type safety.
 */

import type { RollupFunction, FormulaReturnType, FormulaUnionType } from './properties.js';

/**
 * Helper function to create rollup property definitions
 *
 * @param relation - Name of the relation property
 * @param property - Name of the property in the related database
 * @param func - Aggregation function to apply
 * @returns Rollup property definition
 *
 * @example
 * ```typescript
 * const schema = createTypedSchema({
 *   title: { type: 'title' },
 *   taskCount: rollup('tasks', 'title', 'count'),
 *   totalBudget: rollup('expenses', 'amount', 'sum'),
 *   averageRating: rollup('reviews', 'rating', 'average'),
 *   earliestDue: rollup('tasks', 'due_date', 'earliest'),
 * });
 * ```
 */
export function rollup<F extends RollupFunction>(
  relation: string,
  property: string,
  func: F
): { type: 'rollup'; relation: string; property: string; function: F } {
  return {
    type: 'rollup' as const,
    relation,
    property,
    function: func,
  };
}

/**
 * Helper function to create formula property definitions
 *
 * @param returnType - Type hint for the formula result
 * @param expression - Optional formula expression for documentation
 * @returns Formula property definition
 *
 * @example
 * ```typescript
 * const schema = createTypedSchema({
 *   title: { type: 'title' },
 *   displayName: formula('string', 'concat("Task: ", title)'),
 *   isOverdue: formula('boolean', 'prop("Due Date") < now()'),
 *   priority: formula('number'),  // No expression provided
 *   dynamicStatus: formula(union('string', 'number'), 'if(completed, "Done", daysRemaining)'),
 * });
 * ```
 */
export function formula<T extends FormulaReturnType>(
  returnType: T,
  expression?: string
): { type: 'formula'; returnType: T; expression?: string } {
  if (expression === undefined) {
    return {
      type: 'formula' as const,
      returnType,
    };
  }
  return {
    type: 'formula' as const,
    returnType,
    expression,
  };
}

/**
 * Helper function to create union types for formula properties
 *
 * @param types - Array of primitive types to include in the union
 * @returns Union type definition
 *
 * @example
 * ```typescript
 * // Create a formula that can return either string or number
 * const conditionalStatus = formula(
 *   union('string', 'number'),
 *   'if(completed, "Done", daysRemaining)'
 * );
 *
 * // Create a formula that can return string, number, or boolean
 * const dynamicValue = formula(
 *   union('string', 'number', 'boolean'),
 *   'complexConditionalLogic()'
 * );
 * ```
 */
export function union<T extends readonly FormulaReturnType[]>(...types: T): FormulaUnionType {
  return {
    kind: 'union' as const,
    types: types as readonly FormulaReturnType[],
  };
}
