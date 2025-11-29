/**
 * Tests for schema validation (src/schema/validation.ts)
 *
 * Tests runtime validation using Valibot schemas for all property types
 * including rollup and formula properties.
 */

import { describe, it, expect } from 'vitest';
import {
  validatePropertyDefinition,
  validateSchemaDefinition,
  isValidPropertyDefinition,
} from '../../src/schema/validation.js';
import { complexPropertiesSchema } from '../utils/test-schemas.js';

describe('Schema Validation', () => {
  describe('Rollup Property Validation', () => {
    it('should validate rollup properties with all function types', () => {
      const rollupFunctions = [
        'count',
        'sum',
        'average',
        'min',
        'max',
        'earliest',
        'latest',
      ] as const;

      rollupFunctions.forEach(func => {
        const rollupProperty = {
          type: 'rollup' as const,
          relation: 'tasks',
          property: 'priority',
          function: func,
        };

        expect(() => validatePropertyDefinition(rollupProperty)).not.toThrow();
        expect(isValidPropertyDefinition(rollupProperty)).toBe(true);
      });
    });

    it('should reject rollup properties with invalid functions', () => {
      const invalidRollup = {
        type: 'rollup' as const,
        relation: 'tasks',
        property: 'priority',
        function: 'invalid_function' as any,
      };

      expect(() => validatePropertyDefinition(invalidRollup)).toThrow();
      expect(isValidPropertyDefinition(invalidRollup)).toBe(false);
    });

    it('should reject rollup properties with empty relation or property names', () => {
      const emptyRelation = {
        type: 'rollup' as const,
        relation: '',
        property: 'priority',
        function: 'count' as const,
      };

      const emptyProperty = {
        type: 'rollup' as const,
        relation: 'tasks',
        property: '',
        function: 'count' as const,
      };

      expect(() => validatePropertyDefinition(emptyRelation)).toThrow();
      expect(() => validatePropertyDefinition(emptyProperty)).toThrow();
      expect(isValidPropertyDefinition(emptyRelation)).toBe(false);
      expect(isValidPropertyDefinition(emptyProperty)).toBe(false);
    });

    it('should validate rollup properties in schema context', () => {
      const schemaWithRollup = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          title: { type: 'title' as const },
          taskCount: {
            type: 'rollup' as const,
            relation: 'tasks',
            property: 'title',
            function: 'count' as const,
          },
        },
      };

      expect(() => validateSchemaDefinition(schemaWithRollup)).not.toThrow();
    });
  });

  describe('Formula Property Validation', () => {
    it('should validate formula properties with basic return types', () => {
      const basicReturnTypes = ['string', 'number', 'boolean', 'date'] as const;

      basicReturnTypes.forEach(returnType => {
        const formulaProperty = {
          type: 'formula' as const,
          returnType,
        };

        expect(() => validatePropertyDefinition(formulaProperty)).not.toThrow();
        expect(isValidPropertyDefinition(formulaProperty)).toBe(true);
      });
    });

    it('should validate formula properties with union return types', () => {
      const unionFormulaProperty = {
        type: 'formula' as const,
        returnType: {
          kind: 'union' as const,
          types: ['string', 'number'] as const,
        },
      };

      expect(() => validatePropertyDefinition(unionFormulaProperty)).not.toThrow();
      expect(isValidPropertyDefinition(unionFormulaProperty)).toBe(true);
    });

    it('should validate formula properties with optional expression', () => {
      const formulaWithExpression = {
        type: 'formula' as const,
        returnType: 'string' as const,
        expression: 'prop("First Name") + " " + prop("Last Name")',
      };

      const formulaWithoutExpression = {
        type: 'formula' as const,
        returnType: 'number' as const,
      };

      expect(() => validatePropertyDefinition(formulaWithExpression)).not.toThrow();
      expect(() => validatePropertyDefinition(formulaWithoutExpression)).not.toThrow();
      expect(isValidPropertyDefinition(formulaWithExpression)).toBe(true);
      expect(isValidPropertyDefinition(formulaWithoutExpression)).toBe(true);
    });

    it('should reject formula properties with invalid return types', () => {
      const invalidFormula = {
        type: 'formula' as const,
        returnType: 'invalid_type' as any,
      };

      expect(() => validatePropertyDefinition(invalidFormula)).toThrow();
      expect(isValidPropertyDefinition(invalidFormula)).toBe(false);
    });

    it('should validate formula properties in schema context', () => {
      const schemaWithFormula = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          title: { type: 'title' as const },
          fullName: {
            type: 'formula' as const,
            returnType: 'string' as const,
            expression: 'prop("First Name") + " " + prop("Last Name")',
          },
        },
      };

      expect(() => validateSchemaDefinition(schemaWithFormula)).not.toThrow();
    });
  });

  describe('Complex Schema Validation', () => {
    it('should validate schema with multiple complex properties', () => {
      expect(() => validateSchemaDefinition(complexPropertiesSchema)).not.toThrow();
    });

    it('should enforce title property requirement even with complex properties', () => {
      const schemaWithoutTitle = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          taskCount: {
            type: 'rollup' as const,
            relation: 'tasks',
            property: 'title',
            function: 'count' as const,
          },
          fullName: {
            type: 'formula' as const,
            returnType: 'string' as const,
          },
        },
      };

      expect(() => validateSchemaDefinition(schemaWithoutTitle)).toThrow();
    });

    it('should validate complex properties alongside basic properties', () => {
      const mixedSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          title: { type: 'title' as const },
          description: { type: 'rich_text' as const },
          priority: { type: 'number' as const },
          status: { type: 'select' as const, options: ['Active', 'Inactive'] as const },
          taskCount: {
            type: 'rollup' as const,
            relation: 'tasks',
            property: 'title',
            function: 'count' as const,
          },
          isComplete: {
            type: 'formula' as const,
            returnType: 'boolean' as const,
            expression: 'prop("Progress") == 100',
          },
        },
      };

      expect(() => validateSchemaDefinition(mixedSchema)).not.toThrow();
    });
  });
});
