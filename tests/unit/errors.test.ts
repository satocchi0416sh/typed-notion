/**
 * Unit tests for Error classes and Result patterns
 *
 * Tests all error types and the Result pattern implementation
 * for proper error handling and type safety.
 */

import { describe, it, expect } from 'vitest';
import {
  ConversionError,
  SchemaValidationError,
  NotionAPIError,
  PropertyValidationError,
  PropertyAccessError,
  SelectionValidationError,
  SchemaRegistrationError,
  ConfigurationError,
  createOk,
  createErr,
  isOk,
  isErr,
} from '../../src/errors/index.js';

describe('Error Classes', () => {
  describe('TypedNotionError (Base Class)', () => {
    it('should create error with message and code', () => {
      const error = new ConversionError('Test error', 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('ConversionError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const error = new ConversionError(
        'Wrapper error',
        'WRAPPER_ERROR',
        undefined,
        undefined,
        undefined,
        undefined,
        cause
      );

      expect(error.cause).toBe(cause);
    });

    it('should format error message consistently', () => {
      const error = new ConversionError('Something went wrong', 'GENERIC_ERROR');
      expect(error.toString()).toContain('ConversionError');
      expect(error.toString()).toContain('Something went wrong');
    });
  });

  describe('ConversionError', () => {
    it('should create conversion error with all details', () => {
      const error = new ConversionError(
        'Failed to convert property',
        'CONVERSION_FAILED',
        { raw: 'value' },
        'title',
        'string',
        'object'
      );

      expect(error.message).toBe('Failed to convert property');
      expect(error.code).toBe('CONVERSION_FAILED');
      expect(error.rawValue).toEqual({ raw: 'value' });
      expect(error.context).toBe('title');
      expect(error.expectedType).toBe('string');
      expect(error.actualType).toBe('object');
    });

    it('should work with minimal parameters', () => {
      const error = new ConversionError('Basic error', 'BASIC_ERROR', null);

      expect(error.message).toBe('Basic error');
      expect(error.rawValue).toBeNull();
      expect(error.context).toBeUndefined();
    });

    it('should include cause error when provided', () => {
      const cause = new Error('Parse error');
      const error = new ConversionError(
        'Conversion failed',
        'CONVERSION_ERROR',
        {},
        'property',
        'string',
        'number',
        cause
      );

      expect(error.cause).toBe(cause);
    });
  });

  describe('SchemaValidationError', () => {
    it('should create schema validation error', () => {
      const error = new SchemaValidationError('status', 'valid select option', 'InvalidOption');

      expect(error.property).toBe('status');
      expect(error.expected).toBe('valid select option');
      expect(error.actual).toBe('InvalidOption');
      expect(error.message).toContain('status');
      expect(error.code).toBe('SCHEMA_VALIDATION_ERROR');
    });

    it('should handle complex objects in actual value', () => {
      const complexValue = { nested: { data: 'value' } };
      const error = new SchemaValidationError('config', 'valid configuration', complexValue);

      expect(error.actual).toBe(complexValue);
      expect(error.message).toContain('config');
    });

    it('should handle null and undefined values', () => {
      const nullError = new SchemaValidationError('field', 'required', null);
      const undefinedError = new SchemaValidationError('field', 'required', undefined);

      expect(nullError.actual).toBeNull();
      expect(undefinedError.actual).toBeUndefined();
    });
  });

  describe('NotionAPIError', () => {
    it('should create API error with status and notion code', () => {
      const error = new NotionAPIError(404, 'object_not_found', 'validation_error');

      expect(error.status).toBe(404);
      expect(error.notionCode).toBe('validation_error');
      expect(error.message).toBe('object_not_found');
      expect(error.code).toBe('NOTION_API_ERROR');
    });

    it('should work with just status code', () => {
      const error = new NotionAPIError(500, 'Internal server error');

      expect(error.status).toBe(500);
      expect(error.notionCode).toBeUndefined();
      expect(error.message).toBe('Internal server error');
    });

    it('should handle rate limiting errors', () => {
      const error = new NotionAPIError(429, 'Rate limited', 'rate_limited');

      expect(error.status).toBe(429);
      expect(error.notionCode).toBe('rate_limited');
    });
  });

  describe('PropertyValidationError', () => {
    it('should create property validation error', () => {
      const error = new PropertyValidationError('email', 'user@example.com', 'valid email format');

      expect(error.propertyName).toBe('email');
      expect(error.value).toBe('user@example.com');
      expect(error.reason).toBe('valid email format');
      expect(error.code).toBe('PROPERTY_VALIDATION_ERROR');
    });

    it('should handle complex property values', () => {
      const complexValue = [{ id: 1, name: 'test' }];
      const error = new PropertyValidationError('items', complexValue, 'valid item structure');

      expect(error.value).toBe(complexValue);
    });
  });

  describe('PropertyAccessError', () => {
    it('should create property access error', () => {
      const error = new PropertyAccessError('nonexistent', ['title', 'status', 'priority']);

      expect(error.propertyName).toBe('nonexistent');
      expect(error.availableProperties).toEqual(['title', 'status', 'priority']);
      expect(error.message).toContain('nonexistent');
      expect(error.message).toContain('title, status, priority');
    });

    it('should handle empty available properties', () => {
      const error = new PropertyAccessError('any', []);

      expect(error.availableProperties).toEqual([]);
      expect(error.message).toContain('No properties');
    });
  });

  describe('SelectionValidationError', () => {
    it('should create selection validation error', () => {
      const error = new SelectionValidationError('status', 'InvalidStatus', [
        'Active',
        'Inactive',
        'Pending',
      ]);

      expect(error.property).toBe('status');
      expect(error.value).toBe('InvalidStatus');
      expect(error.validOptions).toEqual(['Active', 'Inactive', 'Pending']);
      expect(error.message).toContain('InvalidStatus');
      expect(error.message).toContain('Active, Inactive, Pending');
    });

    it('should handle empty valid options', () => {
      const error = new SelectionValidationError('field', 'value', []);

      expect(error.validOptions).toEqual([]);
      expect(error.message).toContain('No valid options');
    });
  });

  describe('SchemaRegistrationError', () => {
    it('should create schema registration error', () => {
      const error = new SchemaRegistrationError('MySchema', 'Schema already registered');

      expect(error.schemaName).toBe('MySchema');
      expect(error.message).toContain('MySchema');
      expect(error.message).toContain('Schema already registered');
      expect(error.code).toBe('SCHEMA_REGISTRATION_ERROR');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError(
        'database_id',
        'NOTION_DB_TASKS',
        'Environment variable not set'
      );

      expect(error.configKey).toBe('database_id');
      expect(error.envVariable).toBe('NOTION_DB_TASKS');
      expect(error.message).toContain('database_id');
      expect(error.message).toContain('NOTION_DB_TASKS');
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });

    it('should work without environment variable', () => {
      const error = new ConfigurationError('key', undefined, 'Invalid value');

      expect(error.envVariable).toBeUndefined();
      expect(error.message).toContain('key');
    });
  });
});

describe('Result Pattern', () => {
  describe('createOk()', () => {
    it('should create successful result with value', () => {
      const result = createOk('success value');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success value');
      }
      expect(result).not.toHaveProperty('error');
    });

    it('should handle null and undefined values', () => {
      const nullResult = createOk(null);
      const undefinedResult = createOk(undefined);

      expect(nullResult.ok).toBe(true);
      if (nullResult.ok) {
        expect(nullResult.value).toBeNull();
      }
      expect(undefinedResult.ok).toBe(true);
      if (undefinedResult.ok) {
        expect(undefinedResult.value).toBeUndefined();
      }
    });

    it('should handle complex objects', () => {
      const complexObject = { nested: { array: [1, 2, 3] } };
      const result = createOk(complexObject);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(complexObject);
      }
    });
  });

  describe('createErr()', () => {
    it('should create error result with error', () => {
      const error = new Error('test error');
      const result = createErr(error);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
      expect(result).not.toHaveProperty('value');
    });

    it('should handle custom error types', () => {
      const customError = new ConversionError('Failed', 'CONVERSION_ERROR', {});
      const result = createErr(customError);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(customError);
        expect(result.error).toBeInstanceOf(ConversionError);
      }
    });

    it('should handle string errors', () => {
      const result = createErr('string error');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('string error');
      }
    });
  });

  describe('isOk()', () => {
    it('should identify successful results', () => {
      const okResult = createOk('value');
      const errResult = createErr(new Error('error'));

      expect(isOk(okResult)).toBe(true);
      expect(isOk(errResult)).toBe(false);
    });

    it('should work as type guard', () => {
      const result = createOk(42);

      if (isOk(result)) {
        // TypeScript should infer this as OkResult<number>
        expect(typeof result.value).toBe('number');
        expect(result.value).toBe(42);
      }
    });
  });

  describe('isErr()', () => {
    it('should identify error results', () => {
      const okResult = createOk('value');
      const errResult = createErr(new Error('error'));

      expect(isErr(okResult)).toBe(false);
      expect(isErr(errResult)).toBe(true);
    });

    it('should work as type guard', () => {
      const error = new ConversionError('test', 'TEST', {});
      const result = createErr(error);

      if (isErr(result)) {
        // TypeScript should infer this as ErrResult<ConversionError>
        expect(result.error).toBeInstanceOf(ConversionError);
        expect(result.error.message).toBe('test');
      }
    });
  });

  describe('Result Pattern Integration', () => {
    it('should work in typical async functions', async () => {
      async function riskyOperation(shouldFail: boolean) {
        if (shouldFail) {
          return createErr(new Error('Operation failed'));
        }
        return createOk('Success!');
      }

      const successResult = await riskyOperation(false);
      const errorResult = await riskyOperation(true);

      expect(isOk(successResult)).toBe(true);
      expect(isErr(errorResult)).toBe(true);

      if (isOk(successResult)) {
        expect(successResult.value).toBe('Success!');
      }

      if (isErr(errorResult)) {
        expect(errorResult.error.message).toBe('Operation failed');
      }
    });

    it('should chain results properly', () => {
      function processValue(value: number) {
        if (value < 0) {
          return createErr(new Error('Negative value'));
        }
        return createOk(value * 2);
      }

      function validateAndProcess(input: number) {
        const processResult = processValue(input);
        if (isErr(processResult)) {
          return processResult;
        }

        if (processResult.value > 100) {
          return createErr(new Error('Value too large'));
        }

        return createOk(processResult.value);
      }

      const validResult = validateAndProcess(25);
      const negativeResult = validateAndProcess(-5);
      const largeResult = validateAndProcess(75);

      expect(isOk(validResult)).toBe(true);
      expect(isErr(negativeResult)).toBe(true);
      expect(isErr(largeResult)).toBe(true);

      if (isOk(validResult)) {
        expect(validResult.value).toBe(50);
      }
    });

    it('should handle nested error propagation', () => {
      function level3() {
        return createErr(new ConversionError('Level 3 error', 'L3_ERROR', {}));
      }

      function level2() {
        const result = level3();
        if (isErr(result)) {
          return createErr(new Error(`Level 2: ${result.error.message}`));
        }
        return createOk('Level 2 success');
      }

      function level1() {
        const result = level2();
        if (isErr(result)) {
          return createErr(new Error(`Level 1: ${result.error.message}`));
        }
        return createOk('Level 1 success');
      }

      const result = level1();
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('Level 1');
        expect(result.error.message).toContain('Level 2');
        expect(result.error.message).toContain('Level 3 error');
      }
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with generics', () => {
      interface User {
        id: string;
        name: string;
      }

      function getUser(id: string) {
        if (id === 'invalid') {
          return createErr(new Error('User not found'));
        }
        return createOk<User>({ id, name: `User ${id}` });
      }

      const result = getUser('123');
      expect(isOk(result)).toBe(true);

      if (isOk(result)) {
        // TypeScript knows result.value is User
        expect(result.value.id).toBe('123');
        expect(result.value.name).toBe('User 123');
      }

      const errorResult = getUser('invalid');
      expect(isErr(errorResult)).toBe(true);
    });

    it('should handle union types correctly', () => {
      function parseNumber(str: string) {
        const num = parseFloat(str);
        if (isNaN(num)) {
          return createErr(new Error('Not a number'));
        }
        return createOk(num);
      }

      const validResult = parseNumber('42.5');
      const invalidResult = parseNumber('not-a-number');

      expect(isOk(validResult)).toBe(true);
      expect(isErr(invalidResult)).toBe(true);

      if (isOk(validResult)) {
        expect(typeof validResult.value).toBe('number');
        expect(validResult.value).toBe(42.5);
      }
    });
  });
});
