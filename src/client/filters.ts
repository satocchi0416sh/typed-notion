/**
 * Type-Safe Filter System for typed-notion-core-ts
 *
 * Provides type-safe filter construction for Notion API queries
 * with validation and automatic type checking.
 */

import type { SchemaDefinition } from '../types/core.js';
import type { PropertyFilterMap } from '../schema/property-types.js';
import { isValidOperator } from '../schema/property-types.js';

/**
 * Type-safe filter for a specific schema
 */
export type NotionFilter<T extends SchemaDefinition> =
  | {
      [K in keyof T['properties']]: {
        property: K;
      } & {
        [P in T['properties'][K]['type']]: P extends keyof PropertyFilterMap
          ? Partial<PropertyFilterMap[P]>
          : never;
      };
    }[keyof T['properties']]
  | CompoundFilter<T>;

/**
 * Compound filter for AND/OR logic
 */
export type CompoundFilter<T extends SchemaDefinition> =
  | {
      and: Array<NotionFilter<T>>;
    }
  | {
      or: Array<NotionFilter<T>>;
    };

/**
 * Query options with type-safe filters and sorting
 */
export interface QueryOptions<T extends SchemaDefinition = SchemaDefinition> {
  filter?: NotionFilter<T>;
  sorts?: Array<{
    property: keyof T['properties'];
    direction: 'ascending' | 'descending';
  }>;
  page_size?: number; // 1-100, default 100
  start_cursor?: string;
  select_properties?: Array<keyof T['properties']>;
}

/**
 * Notion API filter structure (for conversion)
 */
export interface NotionAPIFilter {
  property?: string;
  and?: NotionAPIFilter[];
  or?: NotionAPIFilter[];
  [key: string]: unknown;
}

/**
 * Filter validation result
 */
export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Filter builder for convenient filter construction
 */
export class FilterBuilder<T extends SchemaDefinition> {
  private filters: NotionFilter<T>[] = [];

  constructor(private schema: { definition: T }) {}

  /**
   * Add property filter condition
   * @param property - Schema property name
   * @param condition - Filter condition with operator and value
   */
  where<K extends keyof T['properties']>(
    property: K,
    condition: Partial<PropertyFilterMap[T['properties'][K]['type']]>
  ): FilterBuilder<T> {
    // Create property filter
    const propertyType = this.schema.definition.properties[property].type;
    const filter = {
      property,
      [propertyType]: condition,
    } as unknown as NotionFilter<T>;

    this.filters.push(filter);
    return this;
  }

  /**
   * Combine filters with AND logic
   * @param filter - Additional filter to combine
   */
  and(filter: NotionFilter<T>): FilterBuilder<T> {
    this.filters.push(filter);
    return this;
  }

  /**
   * Combine filters with OR logic
   * @param filter - Alternative filter condition
   */
  or(filter: NotionFilter<T>): FilterBuilder<T> {
    // Create OR compound filter with current filters
    if (this.filters.length === 0) {
      this.filters.push(filter);
    } else if (this.filters.length === 1) {
      const currentFilter = this.filters[0]!;
      this.filters = [];
      this.filters.push({
        or: [currentFilter, filter],
      } satisfies CompoundFilter<T>);
    } else {
      const currentFilters = [...this.filters];
      this.filters = [];
      this.filters.push({
        or: [{ and: currentFilters } satisfies CompoundFilter<T>, filter],
      } satisfies CompoundFilter<T>);
    }
    return this;
  }

  /**
   * Build final filter object
   * @returns Constructed NotionFilter
   */
  build(): NotionFilter<T> | undefined {
    if (this.filters.length === 0) {
      return undefined;
    }

    if (this.filters.length === 1) {
      return this.filters[0]!;
    }

    // Multiple filters, combine with AND
    return {
      and: this.filters,
    } satisfies CompoundFilter<T>;
  }

  /**
   * Clear all filters
   */
  clear(): FilterBuilder<T> {
    this.filters = [];
    return this;
  }

  /**
   * Get current filter count
   */
  getFilterCount(): number {
    return this.filters.length;
  }
}

/**
 * Filter validator for checking filter correctness
 */
export class FilterValidator<T extends SchemaDefinition> {
  constructor(private schema: { definition: T }) {}

  /**
   * Validate a filter against the schema
   * @param filter - Filter to validate
   * @returns Validation result
   */
  validate(filter: NotionFilter<T>): FilterValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.validateFilter(filter, errors, warnings);
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Recursive filter validation
   * @param filter - Filter to validate
   * @param errors - Error array to populate
   * @param warnings - Warning array to populate
   */
  private validateFilter(filter: NotionFilter<T>, errors: string[], warnings: string[]): void {
    // Check if it's a compound filter
    if ('and' in filter) {
      if (!Array.isArray(filter.and) || filter.and.length === 0) {
        errors.push('AND filter must contain at least one condition');
        return;
      }
      for (const subFilter of filter.and) {
        this.validateFilter(subFilter, errors, warnings);
      }
      return;
    }

    if ('or' in filter) {
      if (!Array.isArray(filter.or) || filter.or.length === 0) {
        errors.push('OR filter must contain at least one condition');
        return;
      }
      for (const subFilter of filter.or) {
        this.validateFilter(subFilter, errors, warnings);
      }
      return;
    }

    // Property filter validation
    if (!('property' in filter)) {
      errors.push('Filter must have a property field');
      return;
    }

    const propertyName = filter.property as string;
    const propertyDef = this.schema.definition.properties[propertyName];

    if (!propertyDef) {
      errors.push(`Property '${propertyName}' does not exist in schema`);
      return;
    }

    const propertyType = propertyDef.type;
    const filterCondition = (filter as Record<string, unknown>)[propertyType];

    if (!filterCondition) {
      errors.push(`Filter must specify condition for property type '${propertyType}'`);
      return;
    }

    // Validate each operator and value in the condition
    for (const [operator, value] of Object.entries(filterCondition)) {
      // Check if operator is valid for property type
      if (!isValidOperator(propertyType as keyof PropertyFilterMap, operator)) {
        errors.push(`Invalid operator '${operator}' for property type '${propertyType}'`);
        continue;
      }

      // Note: Value validation is skipped due to complex TypeScript type constraints
      // Invalid values will be caught during actual Notion API calls

      // Check select/multi-select options if available
      if (
        (propertyType === 'select' || propertyType === 'multi_select') &&
        'options' in propertyDef &&
        propertyDef.options &&
        typeof value === 'string' &&
        operator !== 'is_empty' &&
        operator !== 'is_not_empty'
      ) {
        const options = propertyDef.options as readonly string[];
        if (!options.includes(value)) {
          warnings.push(
            `Value '${value}' is not in the defined options for property '${propertyName}': [${options.join(', ')}]`
          );
        }
      }
    }
  }
}

/**
 * Filter converter to transform type-safe filters to Notion API format
 */
export class FilterConverter<T extends SchemaDefinition> {
  /**
   * Convert type-safe filter to Notion API filter
   * @param filter - Type-safe filter
   * @returns Notion API filter object
   */
  toNotionFilter(filter: NotionFilter<T>): NotionAPIFilter {
    return this.convertFilter(filter);
  }

  /**
   * Recursive filter conversion
   * @param filter - Filter to convert
   * @returns Notion API filter
   */
  private convertFilter(filter: NotionFilter<T>): NotionAPIFilter {
    // Handle compound filters
    if ('and' in filter) {
      return {
        and: filter.and.map(f => this.convertFilter(f)),
      };
    }

    if ('or' in filter) {
      return {
        or: filter.or.map(f => this.convertFilter(f)),
      };
    }

    // Handle property filters
    const propertyFilter = filter as Record<string, unknown> & { property: string };
    const propertyName = propertyFilter.property;
    const propertyType = Object.keys(propertyFilter).find(key => key !== 'property');

    if (!propertyType) {
      throw new Error('Invalid filter: missing property type');
    }

    const condition = propertyFilter[propertyType];

    return {
      property: propertyName,
      [propertyType]: condition,
    };
  }
}

/**
 * Create a filter builder for a schema
 * @param schema - Schema definition
 * @returns Filter builder instance
 */
export function createFilterBuilder<T extends SchemaDefinition>(schema: {
  definition: T;
}): FilterBuilder<T> {
  return new FilterBuilder(schema);
}

/**
 * Create a filter validator for a schema
 * @param schema - Schema definition
 * @returns Filter validator instance
 */
export function createFilterValidator<T extends SchemaDefinition>(schema: {
  definition: T;
}): FilterValidator<T> {
  return new FilterValidator(schema);
}

/**
 * Create a filter converter for transforming filters to Notion API format
 * @returns Filter converter instance
 */
export function createFilterConverter<T extends SchemaDefinition>(): FilterConverter<T> {
  return new FilterConverter<T>();
}
