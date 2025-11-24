/**
 * Custom Vitest matchers for typed-notion testing
 *
 * Provides domain-specific assertion helpers for common
 * testing patterns in the typed-notion codebase.
 */

import { expect } from 'vitest';
import type { Result } from '../../src/errors/index.js';

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeOkResult(): T;
    toBeErrResult(): T;
    toBeValidNotionFilter(): T;
    toBeValidSchema(): T;
    toHaveValidTimezone(): T;
    toMatchPropertyType(expectedType: string): T;
  }
}

// Result pattern matchers
expect.extend({
  toBeOkResult(received: Result<unknown, unknown>) {
    const { isNot } = this;

    const pass = received.ok === true;

    return {
      pass,
      message: () => {
        const verb = isNot ? 'not to be' : 'to be';
        return `Expected result ${verb} an Ok result, but got ${
          pass ? 'Ok' : 'Err'
        } result${!pass && 'error' in received ? ` with error: ${received.error}` : ''}`;
      },
    };
  },

  toBeErrResult(received: Result<unknown, unknown>) {
    const { isNot } = this;

    const pass = received.ok === false;

    return {
      pass,
      message: () => {
        const verb = isNot ? 'not to be' : 'to be';
        return `Expected result ${verb} an Err result, but got ${
          pass ? 'Err' : 'Ok'
        } result${!pass && 'value' in received ? ` with value: ${received.value}` : ''}`;
      },
    };
  },

  toBeValidNotionFilter(received: unknown) {
    const { isNot } = this;

    let pass = true;
    let errorMessage = '';

    try {
      // Check if it has the basic structure of a filter
      if (typeof received !== 'object' || received === null) {
        pass = false;
        errorMessage = 'Filter must be an object';
      } else if ('and' in received) {
        // Compound AND filter
        if (!Array.isArray(received.and) || received.and.length === 0) {
          pass = false;
          errorMessage = 'AND filter must have a non-empty array';
        }
      } else if ('or' in received) {
        // Compound OR filter
        if (!Array.isArray(received.or) || received.or.length === 0) {
          pass = false;
          errorMessage = 'OR filter must have a non-empty array';
        }
      } else if ('property' in received) {
        // Property filter
        if (typeof received.property !== 'string') {
          pass = false;
          errorMessage = 'Property filter must have a string property field';
        } else {
          // Check if it has at least one property type condition
          const propertyTypes = [
            'title',
            'rich_text',
            'number',
            'select',
            'multi_select',
            'date',
            'people',
            'files',
            'checkbox',
            'url',
            'email',
            'phone_number',
            'formula',
            'relation',
            'created_time',
            'created_by',
            'last_edited_time',
            'last_edited_by',
          ];

          const hasCondition = propertyTypes.some(type => type in received);
          if (!hasCondition) {
            pass = false;
            errorMessage = 'Property filter must have at least one property type condition';
          }
        }
      } else {
        pass = false;
        errorMessage = 'Filter must be either a property filter or compound filter (AND/OR)';
      }
    } catch (error) {
      pass = false;
      errorMessage = `Error validating filter: ${error}`;
    }

    return {
      pass,
      message: () => {
        const verb = isNot ? 'not to be' : 'to be';
        return `Expected filter ${verb} a valid Notion filter${
          !pass ? `. ${errorMessage}` : ''
        }\n\nReceived: ${String(received)}`;
      },
    };
  },

  toBeValidSchema(received: unknown) {
    const { isNot } = this;

    let pass = true;
    let errorMessage = '';

    try {
      if (typeof received !== 'object' || received === null) {
        pass = false;
        errorMessage = 'Schema must be an object';
      } else if (!('properties' in received)) {
        pass = false;
        errorMessage = 'Schema must have a properties field';
      } else if (typeof received.properties !== 'object' || received.properties === null) {
        pass = false;
        errorMessage = 'Schema properties must be an object';
      } else {
        // Check if properties have valid structure
        for (const [propName, propDef] of Object.entries(received.properties)) {
          if (typeof propDef !== 'object' || propDef === null) {
            pass = false;
            errorMessage = `Property '${propName}' must be an object`;
            break;
          }

          const def = propDef as Record<string, unknown>;
          if (!('type' in def) || typeof def.type !== 'string') {
            pass = false;
            errorMessage = `Property '${propName}' must have a string type field`;
            break;
          }

          const validTypes = [
            'title',
            'rich_text',
            'number',
            'select',
            'multi_select',
            'date',
            'people',
            'files',
            'checkbox',
            'url',
            'email',
            'phone_number',
            'formula',
            'relation',
            'created_time',
            'created_by',
            'last_edited_time',
            'last_edited_by',
          ];

          if (!validTypes.includes(def.type)) {
            pass = false;
            errorMessage = `Property '${propName}' has invalid type '${def.type}'`;
            break;
          }
        }
      }
    } catch (error) {
      pass = false;
      errorMessage = `Error validating schema: ${error}`;
    }

    return {
      pass,
      message: () => {
        const verb = isNot ? 'not to be' : 'to be';
        return `Expected schema ${verb} a valid schema definition${
          !pass ? `. ${errorMessage}` : ''
        }\n\nReceived: ${String(received)}`;
      },
    };
  },

  toHaveValidTimezone(received: string) {
    const { isNot } = this;

    let pass = true;
    let errorMessage = '';

    try {
      if (typeof received !== 'string') {
        pass = false;
        errorMessage = 'Timezone must be a string';
      } else {
        // Try to create a date with the timezone
        try {
          Intl.DateTimeFormat(undefined, { timeZone: received });
        } catch {
          pass = false;
          errorMessage = `Invalid timezone identifier: ${received}`;
        }
      }
    } catch (error) {
      pass = false;
      errorMessage = `Error validating timezone: ${error}`;
    }

    return {
      pass,
      message: () => {
        const verb = isNot ? 'not to have' : 'to have';
        return `Expected ${String(received)} ${verb} a valid timezone identifier${
          !pass ? `. ${errorMessage}` : ''
        }`;
      },
    };
  },

  toMatchPropertyType(received: unknown, expectedType: string) {
    const { isNot } = this;

    let pass = true;
    let errorMessage = '';

    try {
      if (typeof received !== 'object' || received === null) {
        pass = false;
        errorMessage = 'Property must be an object';
      } else if (!('type' in received)) {
        pass = false;
        errorMessage = 'Property must have a type field';
      } else if (received.type !== expectedType) {
        pass = false;
        errorMessage = `Expected type '${expectedType}', got '${received.type}'`;
      }
    } catch (error) {
      pass = false;
      errorMessage = `Error comparing property type: ${error}`;
    }

    return {
      pass,
      message: () => {
        const verb = isNot ? 'not to match' : 'to match';
        return `Expected property ${verb} type '${expectedType}'${
          !pass ? `. ${errorMessage}` : ''
        }\n\nReceived: ${String(received)}`;
      },
    };
  },
});

// Helper functions for common test patterns
export function expectOkResult<T>(
  result: Result<T, unknown>
): asserts result is { ok: true; value: T } {
  expect(result).toBeOkResult();
}

export function expectErrResult<E>(
  result: Result<unknown, E>
): asserts result is { ok: false; error: E } {
  expect(result).toBeErrResult();
}

// Performance testing helpers
export function measureAsyncPerformance<T>(
  operation: () => Promise<T>,
  maxTimeMs: number = 1000
): Promise<{ result: T; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();

    operation()
      .then(result => {
        const endTime = performance.now();
        const durationMs = endTime - startTime;

        if (durationMs > maxTimeMs) {
          reject(new Error(`Operation took ${durationMs}ms, expected <${maxTimeMs}ms`));
        } else {
          resolve({ result, durationMs });
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function measureSyncPerformance<T>(
  operation: () => T,
  maxTimeMs: number = 100
): { result: T; durationMs: number } {
  const startTime = performance.now();
  const result = operation();
  const endTime = performance.now();
  const durationMs = endTime - startTime;

  if (durationMs > maxTimeMs) {
    throw new Error(`Operation took ${durationMs}ms, expected <${maxTimeMs}ms`);
  }

  return { result, durationMs };
}

// Memory usage helpers
export function measureMemoryUsage<T>(operation: () => T): { result: T; memoryUsedMB: number } {
  // Force garbage collection if available (Node.js --expose-gc)
  if (global.gc) {
    global.gc();
  }

  const initialMemory = process.memoryUsage().heapUsed;
  const result = operation();
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryUsedMB = (finalMemory - initialMemory) / 1024 / 1024;

  return { result, memoryUsedMB };
}

// Test data generators
export function generateTestString(length: number = 100): string {
  return 'x'.repeat(length);
}

export function generateTestArray<T>(generator: () => T, count: number = 100): T[] {
  return Array.from({ length: count }, generator);
}

export function generateLargeObject(
  depth: number = 3,
  width: number = 10
): Record<string, unknown> {
  if (depth === 0) {
    return { value: Math.random().toString(36) };
  }

  const obj: Record<string, unknown> = {};
  for (let i = 0; i < width; i++) {
    obj[`prop_${i}`] = generateLargeObject(depth - 1, width);
  }
  return obj;
}

// Async test helpers
export function waitForCondition(
  condition: () => boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Condition not met within ${timeoutMs}ms`));
      } else {
        globalThis.setTimeout(check, intervalMs);
      }
    };

    check();
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => globalThis.setTimeout(resolve, ms));
}
