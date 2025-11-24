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

/**
 * Data conversion error for transformation failures between Notion API and TypeScript types
 * Thrown when automatic data conversion fails during query/create/update operations
 */
export class ConversionError extends TypedNotionError {
  readonly code = 'CONVERSION_ERROR';
  readonly context: {
    type: 'VALIDATION_ERROR' | 'CONVERSION_ERROR' | 'SCHEMA_MISMATCH' | 'MISSING_PROPERTY';
    input?: unknown;
    propertyName?: string;
    expectedType?: string;
    actualType?: string;
    originalError?: Error;
  };

  constructor(
    message: string,
    type: 'VALIDATION_ERROR' | 'CONVERSION_ERROR' | 'SCHEMA_MISMATCH' | 'MISSING_PROPERTY',
    input?: unknown,
    propertyName?: string,
    expectedType?: string,
    actualType?: string,
    originalError?: Error
  ) {
    super(message);
    this.context = {
      type,
      ...(input !== undefined && { input }),
      ...(propertyName !== undefined && { propertyName }),
      ...(expectedType !== undefined && { expectedType }),
      ...(actualType !== undefined && { actualType }),
      ...(originalError !== undefined && { originalError }),
    };
  }
}

/**
 * Configuration error for environment and database ID resolution issues
 * Thrown when environment variables are missing or database configurations are invalid
 */
export class ConfigurationError extends TypedNotionError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly context: {
    type: 'MISSING_ENV' | 'INVALID_DATABASE_ID' | 'VALIDATION_FAILED' | 'API_ERROR';
    schemaName?: string;
    suggestion?: string;
  };

  constructor(
    message: string,
    type: 'MISSING_ENV' | 'INVALID_DATABASE_ID' | 'VALIDATION_FAILED' | 'API_ERROR',
    schemaName?: string,
    suggestion?: string
  ) {
    super(message);
    this.context = {
      type,
      ...(schemaName !== undefined && { schemaName }),
      ...(suggestion !== undefined && { suggestion }),
    };
  }
}

/**
 * Schema registration error for configuration management issues
 * Thrown when registering schemas with the configuration manager fails
 */
export class SchemaRegistrationError extends TypedNotionError {
  readonly code = 'SCHEMA_REGISTRATION_ERROR';
  readonly context: {
    schemaName: string;
    validationErrors?: Array<{
      type: string;
      message: string;
      property?: string;
    }>;
  };

  constructor(
    message: string,
    schemaName: string,
    validationErrors?: Array<{
      type: string;
      message: string;
      property?: string;
    }>
  ) {
    super(message);
    this.context = {
      schemaName,
      ...(validationErrors !== undefined && { validationErrors }),
    };
  }
}

// Result type for safe error handling in conversion operations
export type Result<T, E = ConversionError> = { kind: 'ok'; value: T } | { kind: 'err'; error: E };

// Helper functions for Result type
export function createOk<T>(value: T): Result<T> {
  return { kind: 'ok', value };
}

export function createErr<E>(error: E): Result<never, E> {
  return { kind: 'err', error };
}

export function isOk<T, E>(result: Result<T, E>): result is { kind: 'ok'; value: T } {
  return result.kind === 'ok';
}

export function isErr<T, E>(result: Result<T, E>): result is { kind: 'err'; error: E } {
  return result.kind === 'err';
}
