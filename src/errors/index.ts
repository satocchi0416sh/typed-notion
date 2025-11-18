/**
 * Typed exception classes for the MVP Property Types system
 *
 * Based on design from contracts/schema-api.ts and clarifications
 * All errors follow exception-based error handling strategy
 */

/**
 * Base error class for all typed exceptions
 * Provides common structure for all library errors
 */
export abstract class TypedNotionError extends Error {
  abstract readonly code: string;
  abstract readonly context: Record<string, unknown>;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Get a JSON representation of the error for logging/debugging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Schema validation error for creation-time validation failures
 * Thrown when schema definitions are invalid (FR-008)
 */
export class SchemaValidationError extends TypedNotionError {
  readonly code = 'SCHEMA_VALIDATION_ERROR';
  readonly context: { property: string; expected: string; received: unknown };

  constructor(property: string, expected: string, received: unknown) {
    super(
      `Invalid property type for '${property}': expected ${expected}, received ${typeof received}`
    );
    this.context = { property, expected, received };
  }
}

/**
 * Property access error for undefined properties
 * Thrown when accessing properties not defined in schema
 */
export class PropertyAccessError extends TypedNotionError {
  readonly code = 'PROPERTY_ACCESS_ERROR';
  readonly context: { property: string; schema: string };

  constructor(property: string, schema: string) {
    super(`Property '${property}' not defined in schema`);
    this.context = { property, schema };
  }
}

/**
 * Notion API interaction errors
 * Thrown when Notion API calls fail
 */
export class NotionAPIError extends TypedNotionError {
  readonly code = 'NOTION_API_ERROR';
  readonly context: { status: number; message: string; request_id?: string };

  constructor(status: number, message: string, request_id?: string) {
    super(`Notion API error (${status}): ${message}`);
    this.context = request_id ? { status, message, request_id } : { status, message };
  }
}

/**
 * Property validation error for runtime value validation
 * Thrown when property values don't match their schema types
 */
export class PropertyValidationError extends TypedNotionError {
  readonly code = 'PROPERTY_VALIDATION_ERROR';
  readonly context: { property: string; value: unknown; expectedType: string };

  constructor(property: string, value: unknown, expectedType: string) {
    super(
      `Invalid value for property '${property}': expected ${expectedType}, received ${typeof value}`
    );
    this.context = { property, value, expectedType };
  }
}

/**
 * Selection option validation error for invalid select/multi-select values
 * Thrown when selection properties receive values not in their options array
 */
export class SelectionValidationError extends TypedNotionError {
  readonly code = 'SELECTION_VALIDATION_ERROR';
  readonly context: { property: string; value: unknown; validOptions: readonly string[] };

  constructor(property: string, value: unknown, validOptions: readonly string[]) {
    super(
      `Invalid selection value for property '${property}': '${value}' is not one of [${validOptions.join(', ')}]`
    );
    this.context = { property, value, validOptions };
  }
}
