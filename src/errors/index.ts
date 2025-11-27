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
  readonly code: string;
  readonly cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.cause = cause;

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
      cause: this.cause,
      stack: this.stack,
    };
  }
}

/**
 * Conversion error when transforming data between TypeScript and Notion formats
 */
export class ConversionError extends TypedNotionError {
  readonly rawValue?: unknown;
  readonly context?: string;
  readonly expectedType?: string;
  readonly actualType?: string;

  constructor(
    message: string,
    code: string,
    rawValue?: unknown,
    context?: string,
    expectedType?: string,
    actualType?: string,
    cause?: Error
  ) {
    super(message, code, cause);
    if (rawValue !== undefined) this.rawValue = rawValue;
    if (context !== undefined) this.context = context;
    if (expectedType !== undefined) this.expectedType = expectedType;
    if (actualType !== undefined) this.actualType = actualType;
  }
}

/**
 * Schema validation error when data doesn't match the expected schema
 */
export class SchemaValidationError extends TypedNotionError {
  readonly property: string;
  readonly expected: string;
  readonly actual: unknown;
  readonly context?: { property: string; expected: string; received: unknown };

  constructor(property: string, expected: string, actual: unknown) {
    const message = `Schema validation failed for property '${property}'. Expected: ${expected}. Actual: ${JSON.stringify(
      actual
    )}`;
    super(message, 'SCHEMA_VALIDATION_ERROR');
    this.property = property;
    this.expected = expected;
    this.actual = actual;
    // Add context for backward compatibility
    this.context = { property, expected, received: actual };
  }
}

/**
 * Notion API error wrapper for better error handling
 */
export class NotionAPIError extends TypedNotionError {
  readonly status: number;
  readonly notionCode?: string;

  constructor(status: number, message: string, notionCode?: string) {
    super(message, 'NOTION_API_ERROR');
    this.status = status;
    if (notionCode !== undefined) this.notionCode = notionCode;
  }
}

/**
 * Property access error for undefined properties
 */
export class PropertyAccessError extends TypedNotionError {
  readonly property: string;
  readonly schema: string;
  readonly propertyName?: string;
  readonly availableProperties?: readonly string[];
  readonly context?: { property: string; schema: string };

  // Support multiple constructor signatures
  constructor(property: string, schemaOrAvailableProperties: string | readonly string[]) {
    let message: string;
    let schema: string = '';
    let availableProperties: readonly string[] | undefined;

    if (typeof schemaOrAvailableProperties === 'string') {
      // Original signature: (property: string, schema: string)
      schema = schemaOrAvailableProperties;
      message = `Property '${property}' not defined in schema`;
    } else {
      // New signature: (property: string, availableProperties: readonly string[])
      availableProperties = schemaOrAvailableProperties;
      if (availableProperties.length === 0) {
        message = `Property '${property}' not found. No properties available`;
      } else {
        message = `Property '${property}' not found. Available: ${availableProperties.join(', ')}`;
      }
    }

    super(message, 'PROPERTY_ACCESS_ERROR');
    this.property = property;
    this.schema = schema;
    this.propertyName = property; // For test compatibility
    if (availableProperties !== undefined) {
      this.availableProperties = availableProperties;
    }
    // Add context for backward compatibility
    this.context = { property, schema };
  }
}

/**
 * Property validation error for runtime value validation
 */
export class PropertyValidationError extends TypedNotionError {
  readonly property: string;
  readonly value: unknown;
  readonly expectedType: string;
  readonly propertyName?: string;
  readonly reason?: string;
  readonly context?: { property: string; value: unknown; expectedType: string };

  constructor(propertyOrPropertyName: string, value: unknown, expectedTypeOrReason: string) {
    const property = propertyOrPropertyName;
    const expectedType = expectedTypeOrReason;
    const message = `Invalid value for property '${property}': expected ${expectedType}, received ${typeof value}`;

    super(message, 'PROPERTY_VALIDATION_ERROR');
    this.property = property;
    this.value = value;
    this.expectedType = expectedType;
    // Add alternative names for test compatibility
    this.propertyName = property;
    this.reason = expectedType;
    // Add context for backward compatibility
    this.context = { property, value, expectedType };
  }
}

/**
 * Selection validation error for select/multi-select properties
 */
export class SelectionValidationError extends TypedNotionError {
  readonly property?: string;
  readonly invalidValue?: unknown;
  readonly validOptions?: readonly string[];
  readonly value?: unknown;
  readonly context?: { property: string; value: unknown; validOptions: readonly string[] };

  constructor(
    propertyOrMessage: string,
    invalidValueOrProperty?: unknown | string,
    validOptions?: readonly string[]
  ) {
    let message: string;
    let property: string | undefined;
    let invalidValue: unknown;

    if (validOptions !== undefined) {
      // New signature: (property, value, validOptions)
      property = propertyOrMessage;
      invalidValue = invalidValueOrProperty;
      if (validOptions.length === 0) {
        message = `Invalid value '${invalidValue}' for property '${property}'. No valid options available`;
      } else {
        message = `Invalid value '${invalidValue}' for property '${property}'. Valid options: ${validOptions.join(
          ', '
        )}`;
      }
    } else {
      // Original signature: (message, property?, invalidValue?, validOptions?)
      message = propertyOrMessage;
      property = invalidValueOrProperty as string | undefined;
      invalidValue = undefined;
    }

    super(message, 'SELECTION_VALIDATION_ERROR');
    if (property !== undefined) this.property = property;
    if (invalidValue !== undefined) {
      this.invalidValue = invalidValue;
      this.value = invalidValue; // For test compatibility
    }
    if (validOptions !== undefined) this.validOptions = validOptions;

    // Add context for backward compatibility
    if (property !== undefined && invalidValue !== undefined && validOptions !== undefined) {
      this.context = { property, value: invalidValue, validOptions };
    }
  }
}

/**
 * Schema registration error when a schema is registered incorrectly
 */
export class SchemaRegistrationError extends TypedNotionError {
  readonly schemaName?: string;
  readonly details?: string;

  constructor(schemaNameOrMessage: string, detailsOrSchemaName?: string) {
    let message: string;
    let schemaName: string | undefined;

    if (detailsOrSchemaName !== undefined) {
      // New signature: (schemaName, details)
      schemaName = schemaNameOrMessage;
      const details = detailsOrSchemaName;
      message = `Schema '${schemaName}': ${details}`;
    } else {
      // Original signature: (message, schemaName?, details?)
      message = schemaNameOrMessage;
      schemaName = undefined;
    }

    super(message, 'SCHEMA_REGISTRATION_ERROR');
    if (schemaName !== undefined) this.schemaName = schemaName;
    if (detailsOrSchemaName !== undefined && schemaName === schemaNameOrMessage) {
      this.details = detailsOrSchemaName;
    }
  }
}

/**
 * Configuration error for invalid configuration
 */
export class ConfigurationError extends TypedNotionError {
  readonly configKey?: string;
  readonly environmentVariable?: string;
  readonly envVariable?: string;

  constructor(
    configKeyOrMessage: string,
    environmentVariableOrConfigKey?: string,
    messageOrEnvironmentVariable?: string
  ) {
    let message: string;
    let configKey: string | undefined;
    let environmentVariable: string | undefined;

    if (messageOrEnvironmentVariable !== undefined) {
      // New signature: (configKey, envVariable, message)
      configKey = configKeyOrMessage;
      environmentVariable = environmentVariableOrConfigKey;
      message = messageOrEnvironmentVariable;
      if (!message.includes(configKey) || !message.includes(environmentVariable!)) {
        message = `Configuration error for '${configKey}' (env: ${environmentVariable}): ${message}`;
      }
    } else if (environmentVariableOrConfigKey !== undefined) {
      // Simplified signature: (message, configKey?, envVariable?)
      message = configKeyOrMessage;
      configKey = environmentVariableOrConfigKey;
    } else {
      // Message only
      message = configKeyOrMessage;
    }

    super(message, 'CONFIGURATION_ERROR');
    if (configKey !== undefined) this.configKey = configKey;
    if (environmentVariable !== undefined) {
      this.environmentVariable = environmentVariable;
      this.envVariable = environmentVariable; // For test compatibility
    }
  }
}

// Result type for safe error handling in conversion operations
export type Result<T, E = ConversionError> = { ok: true; value: T } | { ok: false; error: E };

// Helper functions for Result type
export function createOk<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function createErr<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}
