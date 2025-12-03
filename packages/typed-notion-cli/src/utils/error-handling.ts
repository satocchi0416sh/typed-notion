import chalk from 'chalk';

/**
 * Custom CLI error class with enhanced error information
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1,
    public readonly suggestion?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

/**
 * Configuration-related errors
 */
export class ConfigurationError extends CLIError {
  constructor(message: string, suggestion?: string, cause?: Error) {
    super(message, 1, suggestion, cause);
    this.name = 'ConfigurationError';
  }
}

/**
 * API-related errors
 */
export class NotionAPIError extends CLIError {
  constructor(message: string, suggestion?: string, cause?: Error) {
    super(message, 2, suggestion, cause);
    this.name = 'NotionAPIError';
  }
}

/**
 * File system related errors
 */
export class FileSystemError extends CLIError {
  constructor(message: string, suggestion?: string, cause?: Error) {
    super(message, 3, suggestion, cause);
    this.name = 'FileSystemError';
  }
}

/**
 * Schema validation errors
 */
export class SchemaValidationError extends CLIError {
  constructor(message: string, suggestion?: string, cause?: Error) {
    super(message, 4, suggestion, cause);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Retry-related errors
 */
export class RetryableError extends CLIError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    cause?: Error
  ) {
    super(message, 5, retryAfter ? `Retry after ${retryAfter} seconds` : undefined, cause);
    this.name = 'RetryableError';
  }
}

/**
 * Format error messages with consistent styling
 */
export function formatError(error: Error): string {
  if (error instanceof CLIError) {
    let formatted = chalk.red(`✗ ${error.message}`);

    if (error.suggestion) {
      formatted += `\n${chalk.yellow(`💡 ${error.suggestion}`)}`;
    }

    if (error.cause) {
      formatted += `\n${chalk.gray(`Caused by: ${error.cause.message}`)}`;
    }

    return formatted;
  }

  return chalk.red(`✗ Unexpected error: ${error.message}`);
}

/**
 * Format success messages
 */
export function formatSuccess(message: string): string {
  return chalk.green(`✓ ${message}`);
}

/**
 * Format warning messages
 */
export function formatWarning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Format info messages
 */
export function formatInfo(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RetryableError) {
    return true;
  }

  if (error instanceof NotionAPIError && error.cause) {
    // Check for specific API error codes that are retryable
    const errorMessage = error.cause.message.toLowerCase();
    return (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection')
    );
  }

  return false;
}

/**
 * Extract meaningful error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error occurred';
}

/**
 * Create a CLIError from an unknown error
 */
export function createCLIError(error: unknown, context: string, suggestion?: string): CLIError {
  const message = `${context}: ${getErrorMessage(error)}`;
  const cause = error instanceof Error ? error : undefined;

  return new CLIError(message, 1, suggestion, cause);
}
