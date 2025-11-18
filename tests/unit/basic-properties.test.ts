/**
 * Unit tests for basic property types in User Story 1
 *
 * Tests individual property type behavior:
 * - Title properties
 * - Number properties (with formatting)
 * - Checkbox properties
 */

import { describe, it, expect } from 'vitest';
import {
  validatePropertyStructure,
  validatePropertyValue,
  validatePropertyName,
  validateSelectionOptions,
  validateSchemaStructure,
  DEFAULT_VALIDATION_CONFIG,
} from '../../src/schema/validator.js';
import { PropertyValidationError, SelectionValidationError } from '../../src/errors/index.js';
import type { PropertyDefinition } from '../../src/types/core.js';

describe('Unit Tests: Basic Property Types', () => {
  describe('Title Property', () => {
    it('should validate title property definition', () => {
      const definition: PropertyDefinition = { type: 'title' };
      const errors = validatePropertyStructure('Name', definition);
      expect(errors).toHaveLength(0);
    });

    it('should validate title property values', () => {
      const definition: PropertyDefinition = { type: 'title' };

      // Valid values
      expect(() => validatePropertyValue('John Doe', definition, 'Name')).not.toThrow();
      expect(() => validatePropertyValue('', definition, 'Name')).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'Name')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'Name')).not.toThrow();
    });

    it('should reject invalid title property values', () => {
      const definition: PropertyDefinition = { type: 'title' };

      expect(() => validatePropertyValue(123, definition, 'Name')).toThrow(PropertyValidationError);
      expect(() => validatePropertyValue(true, definition, 'Name')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue([], definition, 'Name')).toThrow(PropertyValidationError);
      expect(() => validatePropertyValue({}, definition, 'Name')).toThrow(PropertyValidationError);
    });

    it('should provide specific error details for title properties', () => {
      const definition: PropertyDefinition = { type: 'title' };

      try {
        validatePropertyValue(123, definition, 'Name');
      } catch (error) {
        expect(error).toBeInstanceOf(PropertyValidationError);
        const propError = error as PropertyValidationError;
        expect(propError.context.property).toBe('Name');
        expect(propError.context.value).toBe(123);
        expect(propError.context.expectedType).toBe('string');
      }
    });
  });

  describe('Number Property', () => {
    it('should validate number property definition without format', () => {
      const definition: PropertyDefinition = { type: 'number' };
      const errors = validatePropertyStructure('Age', definition);
      expect(errors).toHaveLength(0);
    });

    it('should validate number property definition with valid formats', () => {
      const definitions = [
        { type: 'number' as const, format: 'number' as const },
        { type: 'number' as const, format: 'percent' as const },
        { type: 'number' as const, format: 'dollar' as const },
      ];

      definitions.forEach((definition, index) => {
        const errors = validatePropertyStructure(`Number${index}`, definition);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject number property with invalid format', () => {
      const definition = {
        type: 'number' as const,
        format: 'invalid-format' as any,
      };
      const errors = validatePropertyStructure('Price', definition);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid number format');
    });

    it('should validate number property values', () => {
      const definition: PropertyDefinition = { type: 'number' };

      // Valid values
      expect(() => validatePropertyValue(42, definition, 'Age')).not.toThrow();
      expect(() => validatePropertyValue(0, definition, 'Age')).not.toThrow();
      expect(() => validatePropertyValue(-10, definition, 'Age')).not.toThrow();
      expect(() => validatePropertyValue(3.14, definition, 'Age')).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'Age')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'Age')).not.toThrow();
    });

    it('should reject invalid number property values', () => {
      const definition: PropertyDefinition = { type: 'number' };

      expect(() => validatePropertyValue('123', definition, 'Age')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue(NaN, definition, 'Age')).toThrow(PropertyValidationError);
      expect(() => validatePropertyValue(true, definition, 'Age')).toThrow(PropertyValidationError);
      expect(() => validatePropertyValue([], definition, 'Age')).toThrow(PropertyValidationError);
    });

    it('should handle number formatting validation', () => {
      const dollarDefinition: PropertyDefinition = {
        type: 'number',
        format: 'dollar',
      };
      const percentDefinition: PropertyDefinition = {
        type: 'number',
        format: 'percent',
      };

      // Format doesn't affect value validation, only definition validation
      expect(() => validatePropertyValue(99.99, dollarDefinition, 'Price')).not.toThrow();
      expect(() => validatePropertyValue(0.15, percentDefinition, 'Discount')).not.toThrow();
    });
  });

  describe('Checkbox Property', () => {
    it('should validate checkbox property definition', () => {
      const definition: PropertyDefinition = { type: 'checkbox' };
      const errors = validatePropertyStructure('Active', definition);
      expect(errors).toHaveLength(0);
    });

    it('should validate checkbox property values', () => {
      const definition: PropertyDefinition = { type: 'checkbox' };

      // Valid values
      expect(() => validatePropertyValue(true, definition, 'Active')).not.toThrow();
      expect(() => validatePropertyValue(false, definition, 'Active')).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'Active')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'Active')).not.toThrow();
    });

    it('should reject invalid checkbox property values', () => {
      const definition: PropertyDefinition = { type: 'checkbox' };

      expect(() => validatePropertyValue('true', definition, 'Active')).toThrow(
        PropertyValidationError
      );
      expect(() => validatePropertyValue(1, definition, 'Active')).toThrow(PropertyValidationError);
      expect(() => validatePropertyValue(0, definition, 'Active')).toThrow(PropertyValidationError);
      expect(() => validatePropertyValue([], definition, 'Active')).toThrow(
        PropertyValidationError
      );
    });
  });

  describe('Property Name Validation', () => {
    it('should accept valid property names', () => {
      const validNames = [
        'Name',
        'Age',
        'Active',
        'FirstName',
        'User_ID',
        'Status Code',
        'Email Address',
        'A',
        'a1',
        'Property123',
      ];

      validNames.forEach(name => {
        const errors = validatePropertyName(name);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject invalid property names', () => {
      const invalidCases = [
        { name: '', reason: 'empty string' },
        { name: '123Invalid', reason: 'starts with number' },
        { name: '_Invalid', reason: 'starts with underscore' },
        { name: 'Invalid@Name', reason: 'contains special characters' },
        { name: 'Invalid-Name', reason: 'contains hyphen' },
        { name: 'Invalid.Name', reason: 'contains dot' },
        { name: 'a'.repeat(101), reason: 'too long' },
      ];

      invalidCases.forEach(({ name, reason }) => {
        const errors = validatePropertyName(name);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle non-string property names', () => {
      const invalidNames = [null, undefined, 123, true, {}, []];

      invalidNames.forEach(name => {
        const errors = validatePropertyName(name as any);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('non-empty string');
      });
    });
  });

  describe('Schema Structure Validation', () => {
    it('should validate basic schema structure', () => {
      const schema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Name: { type: 'title' },
          Age: { type: 'number' },
          Active: { type: 'checkbox' },
        },
      };

      const result = validateSchemaStructure(schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject schema without title property', () => {
      const schema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Age: { type: 'number' },
          Active: { type: 'checkbox' },
        },
      };

      const result = validateSchemaStructure(schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('title property'))).toBe(true);
    });

    it('should reject schema with multiple title properties', () => {
      const schema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title1: { type: 'title' },
          Title2: { type: 'title' },
          Age: { type: 'number' },
        },
      };

      const result = validateSchemaStructure(schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('multiple title properties'))).toBe(true);
    });

    it('should validate property count limits', () => {
      // Test minimum properties
      const emptySchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {},
      };

      const emptyResult = validateSchemaStructure(emptySchema);
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors.some(error => error.includes('at least'))).toBe(true);

      // Test maximum properties
      const tooManyProperties = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: Object.fromEntries(
          Array.from({ length: 25 }, (_, i) => [
            i === 0 ? 'Title' : `Prop${i}`,
            i === 0 ? { type: 'title' } : { type: 'number' },
          ])
        ),
      };

      const tooManyResult = validateSchemaStructure(tooManyProperties);
      expect(tooManyResult.isValid).toBe(false);
      expect(tooManyResult.errors.some(error => error.includes('more than'))).toBe(true);
    });

    it('should validate database ID format', () => {
      const invalidIdCases = [
        'not-a-uuid',
        '12345',
        '12345678123456789abc123456789abc', // Too short
        '12345678-1234-5678-9abc-123456789abcd', // Too long
        'GGGGGGGG-1234-5678-9abc-123456789abc', // Invalid characters
      ];

      invalidIdCases.forEach(invalidId => {
        const schema = {
          databaseId: invalidId,
          properties: {
            Name: { type: 'title' },
          },
        };

        const result = validateSchemaStructure(schema);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('UUID'))).toBe(true);
      });
    });

    it('should handle malformed schema objects', () => {
      const malformedCases = [
        null,
        undefined,
        'not an object',
        123,
        [],
        { databaseId: '12345678-1234-5678-9abc-123456789abc' }, // Missing properties
        { properties: { Name: { type: 'title' } } }, // Missing databaseId
      ];

      malformedCases.forEach(malformed => {
        const result = validateSchemaStructure(malformed);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Custom Validation Configuration', () => {
    it('should allow custom validation rules', () => {
      const customConfig = {
        maxProperties: 5,
        minProperties: 2,
        requireTitle: false,
        allowMultipleTitles: true,
      };

      // Schema without title (should pass with custom config)
      const schemaWithoutTitle = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Age: { type: 'number' },
          Active: { type: 'checkbox' },
        },
      };

      const result = validateSchemaStructure(schemaWithoutTitle, customConfig);
      expect(result.isValid).toBe(true);
    });

    it('should enforce custom property limits', () => {
      const strictConfig = {
        maxProperties: 2,
        minProperties: 1,
        requireTitle: true,
        allowMultipleTitles: false,
      };

      const tooManyPropsSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Name: { type: 'title' },
          Age: { type: 'number' },
          Active: { type: 'checkbox' },
        },
      };

      const result = validateSchemaStructure(tooManyPropsSchema, strictConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('more than 2'))).toBe(true);
    });
  });
});
