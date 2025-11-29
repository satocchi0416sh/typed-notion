/**
 * Tests for rollup and formula property support
 *
 * Tests both runtime validation and type inference for complex property types.
 * Covers rollup functions, formula return types, and type safety.
 */

import { describe, it, expect } from 'vitest';
import {
  validatePropertyDefinition,
  validateSchemaDefinition,
  isValidPropertyDefinition,
} from '../../src/schema/validation.js';
import {
  isRollupProperty,
  isFormulaProperty,
  isComplexProperty,
} from '../../src/types/properties.js';
import { complexPropertiesSchema } from '../utils/test-schemas.js';
import type { RollupProperty, FormulaProperty } from '../../src/types/properties.js';

describe('Complex Properties', () => {
  describe('Rollup Properties', () => {
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
        expect(isRollupProperty(rollupProperty)).toBe(true);
        expect(isComplexProperty(rollupProperty)).toBe(true);
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
        type: 'rollup',
        relation: '',
        property: 'priority',
        function: 'count',
      };

      const emptyProperty = {
        type: 'rollup',
        relation: 'tasks',
        property: '',
        function: 'count',
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
          title: { type: 'title' },
          taskCount: {
            type: 'rollup',
            relation: 'tasks',
            property: 'title',
            function: 'count',
          },
        },
      };

      expect(() => validateSchemaDefinition(schemaWithRollup)).not.toThrow();
    });
  });

  describe('Formula Properties', () => {
    it('should validate formula properties with basic return types', () => {
      const basicReturnTypes = ['string', 'number', 'boolean', 'date'] as const;

      basicReturnTypes.forEach(returnType => {
        const formulaProperty = {
          type: 'formula' as const,
          returnType,
        };

        expect(() => validatePropertyDefinition(formulaProperty)).not.toThrow();
        expect(isValidPropertyDefinition(formulaProperty)).toBe(true);
        expect(isFormulaProperty(formulaProperty)).toBe(true);
        expect(isComplexProperty(formulaProperty)).toBe(true);
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
      expect(isFormulaProperty(unionFormulaProperty)).toBe(true);
      expect(isComplexProperty(unionFormulaProperty)).toBe(true);
    });

    it('should validate formula properties with optional expression', () => {
      const formulaWithExpression = {
        type: 'formula',
        returnType: 'string',
        expression: 'prop("First Name") + " " + prop("Last Name")',
      };

      const formulaWithoutExpression = {
        type: 'formula',
        returnType: 'number',
      };

      expect(() => validatePropertyDefinition(formulaWithExpression)).not.toThrow();
      expect(() => validatePropertyDefinition(formulaWithoutExpression)).not.toThrow();
      expect(isValidPropertyDefinition(formulaWithExpression)).toBe(true);
      expect(isValidPropertyDefinition(formulaWithoutExpression)).toBe(true);
    });

    it('should reject formula properties with invalid return types', () => {
      const invalidFormula = {
        type: 'formula',
        returnType: 'invalid_type',
      };

      expect(() => validatePropertyDefinition(invalidFormula)).toThrow();
      expect(isValidPropertyDefinition(invalidFormula)).toBe(false);
    });

    it('should validate formula properties in schema context', () => {
      const schemaWithFormula = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          title: { type: 'title' },
          fullName: {
            type: 'formula',
            returnType: 'string',
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
            type: 'rollup',
            relation: 'tasks',
            property: 'title',
            function: 'count',
          },
          fullName: {
            type: 'formula',
            returnType: 'string',
          },
        },
      };

      expect(() => validateSchemaDefinition(schemaWithoutTitle)).toThrow();
    });

    it('should validate complex properties alongside basic properties', () => {
      const mixedSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          title: { type: 'title' },
          description: { type: 'rich_text' },
          priority: { type: 'number' },
          status: { type: 'select', options: ['Active', 'Inactive'] },
          taskCount: {
            type: 'rollup',
            relation: 'tasks',
            property: 'title',
            function: 'count',
          },
          isComplete: {
            type: 'formula',
            returnType: 'boolean',
            expression: 'prop("Progress") == 100',
          },
        },
      };

      expect(() => validateSchemaDefinition(mixedSchema)).not.toThrow();
    });
  });

  describe('Type Guards', () => {
    const rollupProperty: RollupProperty = {
      type: 'rollup',
      relation: 'tasks',
      property: 'priority',
      function: 'sum',
    };

    const formulaProperty: FormulaProperty = {
      type: 'formula',
      returnType: 'string',
      expression: 'prop("Name")',
    };

    const basicProperty = { type: 'title' as const };

    it('should correctly identify rollup properties', () => {
      expect(isRollupProperty(rollupProperty)).toBe(true);
      expect(isRollupProperty(formulaProperty)).toBe(false);
      expect(isRollupProperty(basicProperty)).toBe(false);
    });

    it('should correctly identify formula properties', () => {
      expect(isFormulaProperty(formulaProperty)).toBe(true);
      expect(isFormulaProperty(rollupProperty)).toBe(false);
      expect(isFormulaProperty(basicProperty)).toBe(false);
    });

    it('should correctly identify complex properties', () => {
      expect(isComplexProperty(rollupProperty)).toBe(true);
      expect(isComplexProperty(formulaProperty)).toBe(true);
      expect(isComplexProperty(basicProperty)).toBe(false);
    });
  });
});
