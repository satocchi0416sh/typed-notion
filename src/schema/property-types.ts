/**
 * Property Type Mapping System for typed-notion-core-ts
 *
 * Defines the mapping between property types and valid Notion API filter operators
 * for type-safe query construction.
 */

/**
 * Text-based property filter operators
 */
export interface TextFilters {
  equals: string;
  does_not_equal: string;
  contains: string;
  does_not_contain: string;
  starts_with: string;
  ends_with: string;
  is_empty: true;
  is_not_empty: true;
}

/**
 * Number property filter operators
 */
export interface NumberFilters {
  equals: number;
  does_not_equal: number;
  greater_than: number;
  less_than: number;
  greater_than_or_equal_to: number;
  less_than_or_equal_to: number;
  is_empty: true;
  is_not_empty: true;
}

/**
 * Checkbox property filter operators
 */
export interface CheckboxFilters {
  equals: boolean;
  does_not_equal: boolean;
}

/**
 * Date property filter operators
 */
export interface DateFilters {
  equals: string; // ISO 8601 date string
  before: string;
  after: string;
  on_or_before: string;
  on_or_after: string;
  past_week: Record<string, never>;
  past_month: Record<string, never>;
  past_year: Record<string, never>;
  next_week: Record<string, never>;
  next_month: Record<string, never>;
  next_year: Record<string, never>;
  is_empty: true;
  is_not_empty: true;
}

/**
 * Select property filter operators
 */
export interface SelectFilters {
  equals: string;
  does_not_equal: string;
  is_empty: true;
  is_not_empty: true;
}

/**
 * Multi-select property filter operators
 */
export interface MultiSelectFilters {
  contains: string;
  does_not_contain: string;
  is_empty: true;
  is_not_empty: true;
}

/**
 * People property filter operators
 */
export interface PeopleFilters {
  contains: string; // User ID
  does_not_contain: string;
  is_empty: true;
  is_not_empty: true;
}

/**
 * Complete mapping of property types to their valid filter operators
 */
export type PropertyFilterMap = {
  title: TextFilters;
  rich_text: TextFilters;
  url: TextFilters;
  email: TextFilters;
  number: NumberFilters;
  checkbox: CheckboxFilters;
  date: DateFilters;
  created_time: DateFilters;
  last_edited_time: DateFilters;
  select: SelectFilters;
  multi_select: MultiSelectFilters;
  people: PeopleFilters;
  created_by: PeopleFilters;
  last_edited_by: PeopleFilters;
};

/**
 * Helper type to extract valid operators for a property type
 */
export type ValidOperators<T extends keyof PropertyFilterMap> = keyof PropertyFilterMap[T];

/**
 * Helper type to get the value type for a specific operator
 */
export type FilterValue<
  T extends keyof PropertyFilterMap,
  O extends ValidOperators<T>,
> = PropertyFilterMap[T][O];

/**
 * Validation function to check if an operator is valid for a property type
 * @param propertyType - The property type
 * @param operator - The operator to validate
 * @returns True if the operator is valid for the property type
 */
export function isValidOperator<T extends keyof PropertyFilterMap>(
  propertyType: T,
  operator: string
): operator is ValidOperators<T> {
  const validOperators = getValidOperators(propertyType);
  return validOperators.includes(operator as ValidOperators<T>);
}

/**
 * Get all valid operators for a property type
 * @param propertyType - The property type
 * @returns Array of valid operator names
 */
export function getValidOperators<T extends keyof PropertyFilterMap>(
  propertyType: T
): ValidOperators<T>[] {
  // Define operators for each property type
  const operatorMap: Record<keyof PropertyFilterMap, string[]> = {
    title: [
      'equals',
      'does_not_equal',
      'contains',
      'does_not_contain',
      'starts_with',
      'ends_with',
      'is_empty',
      'is_not_empty',
    ],
    rich_text: [
      'equals',
      'does_not_equal',
      'contains',
      'does_not_contain',
      'starts_with',
      'ends_with',
      'is_empty',
      'is_not_empty',
    ],
    url: [
      'equals',
      'does_not_equal',
      'contains',
      'does_not_contain',
      'starts_with',
      'ends_with',
      'is_empty',
      'is_not_empty',
    ],
    email: [
      'equals',
      'does_not_equal',
      'contains',
      'does_not_contain',
      'starts_with',
      'ends_with',
      'is_empty',
      'is_not_empty',
    ],
    number: [
      'equals',
      'does_not_equal',
      'greater_than',
      'less_than',
      'greater_than_or_equal_to',
      'less_than_or_equal_to',
      'is_empty',
      'is_not_empty',
    ],
    checkbox: ['equals', 'does_not_equal'],
    date: [
      'equals',
      'before',
      'after',
      'on_or_before',
      'on_or_after',
      'past_week',
      'past_month',
      'past_year',
      'next_week',
      'next_month',
      'next_year',
      'is_empty',
      'is_not_empty',
    ],
    created_time: [
      'equals',
      'before',
      'after',
      'on_or_before',
      'on_or_after',
      'past_week',
      'past_month',
      'past_year',
      'next_week',
      'next_month',
      'next_year',
      'is_empty',
      'is_not_empty',
    ],
    last_edited_time: [
      'equals',
      'before',
      'after',
      'on_or_before',
      'on_or_after',
      'past_week',
      'past_month',
      'past_year',
      'next_week',
      'next_month',
      'next_year',
      'is_empty',
      'is_not_empty',
    ],
    select: ['equals', 'does_not_equal', 'is_empty', 'is_not_empty'],
    multi_select: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
    people: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
    created_by: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
    last_edited_by: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
  };

  return operatorMap[propertyType] as ValidOperators<T>[];
}

/**
 * Validate a filter value for a specific property type and operator
 * @param propertyType - The property type
 * @param operator - The filter operator
 * @param value - The value to validate
 * @returns True if the value is valid for the property type and operator
 */
export function validateFilterValue<T extends keyof PropertyFilterMap>(
  propertyType: T,
  operator: ValidOperators<T>,
  value: unknown
): boolean {
  // Type-specific validation
  switch (propertyType) {
    case 'title':
    case 'rich_text':
    case 'url':
    case 'email':
      if (operator === 'is_empty' || operator === 'is_not_empty') {
        return value === true;
      }
      return typeof value === 'string';

    case 'number':
      if (operator === 'is_empty' || operator === 'is_not_empty') {
        return value === true;
      }
      return typeof value === 'number' && !isNaN(value);

    case 'checkbox':
      return typeof value === 'boolean';

    case 'date':
    case 'created_time':
    case 'last_edited_time':
      if (operator === 'is_empty' || operator === 'is_not_empty') {
        return value === true;
      }
      if (
        ['past_week', 'past_month', 'past_year', 'next_week', 'next_month', 'next_year'].includes(
          operator as string
        )
      ) {
        return typeof value === 'object' && value !== null;
      }
      return typeof value === 'string' && isValidISODate(value);

    case 'select':
      if (operator === 'is_empty' || operator === 'is_not_empty') {
        return value === true;
      }
      return typeof value === 'string';

    case 'multi_select':
      if (operator === 'is_empty' || operator === 'is_not_empty') {
        return value === true;
      }
      return typeof value === 'string';

    case 'people':
    case 'created_by':
    case 'last_edited_by':
      if (operator === 'is_empty' || operator === 'is_not_empty') {
        return value === true;
      }
      return typeof value === 'string'; // User ID

    default:
      return false;
  }
}

/**
 * Check if a string is a valid ISO 8601 date
 * @param dateString - The date string to validate
 * @returns True if valid ISO date
 */
function isValidISODate(dateString: string): boolean {
  // Basic ISO 8601 format validation
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  // Check if it can be parsed as a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Get a human-readable description of valid values for a property type and operator
 * @param propertyType - The property type
 * @param operator - The operator
 * @returns Description string
 */
export function getFilterValueDescription<T extends keyof PropertyFilterMap>(
  propertyType: T,
  operator: ValidOperators<T>
): string {
  if (operator === 'is_empty' || operator === 'is_not_empty') {
    return 'true (no value required)';
  }

  switch (propertyType) {
    case 'title':
    case 'rich_text':
    case 'url':
    case 'email':
    case 'select':
    case 'multi_select':
      return 'string';

    case 'number':
      return 'number';

    case 'checkbox':
      return 'boolean (true or false)';

    case 'date':
    case 'created_time':
    case 'last_edited_time':
      if (
        ['past_week', 'past_month', 'past_year', 'next_week', 'next_month', 'next_year'].includes(
          operator as string
        )
      ) {
        return 'empty object {}';
      }
      return 'ISO 8601 date string (e.g., "2023-12-25" or "2023-12-25T10:30:00Z")';

    case 'people':
    case 'created_by':
    case 'last_edited_by':
      return 'user ID string';

    default:
      return 'unknown';
  }
}
