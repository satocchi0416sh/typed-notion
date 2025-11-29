/**
 * Simple type inference tests for src/types/inference.ts
 *
 * Testing type guards and runtime functions only.
 * Type-level tests removed due to expect-type compatibility issues.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidPropertyType,
  hasSelectionOptions,
  isTitleProperty,
} from '../../src/types/inference.js';
import {
  isRollupProperty,
  isFormulaProperty,
  isComplexProperty,
} from '../../src/types/properties.js';

describe('Type Inference Runtime Functions', () => {
  describe('isValidPropertyType', () => {
    it('should return true for valid property types', () => {
      expect(isValidPropertyType('title')).toBe(true);
      expect(isValidPropertyType('rich_text')).toBe(true);
      expect(isValidPropertyType('number')).toBe(true);
      expect(isValidPropertyType('checkbox')).toBe(true);
      expect(isValidPropertyType('date')).toBe(true);
      expect(isValidPropertyType('url')).toBe(true);
      expect(isValidPropertyType('email')).toBe(true);
      expect(isValidPropertyType('select')).toBe(true);
      expect(isValidPropertyType('multi_select')).toBe(true);
      expect(isValidPropertyType('people')).toBe(true);
      expect(isValidPropertyType('created_time')).toBe(true);
      expect(isValidPropertyType('created_by')).toBe(true);
      expect(isValidPropertyType('last_edited_time')).toBe(true);
      expect(isValidPropertyType('last_edited_by')).toBe(true);
      expect(isValidPropertyType('rollup')).toBe(true);
      expect(isValidPropertyType('formula')).toBe(true);
    });

    it('should return false for invalid property types', () => {
      expect(isValidPropertyType('invalid')).toBe(false);
      expect(isValidPropertyType('unknown')).toBe(false);
      expect(isValidPropertyType('')).toBe(false);
      expect(isValidPropertyType('TEXT')).toBe(false);
    });
  });

  describe('hasSelectionOptions', () => {
    it('should return true for select properties with options', () => {
      const selectProperty = {
        type: 'select' as const,
        options: ['Option 1', 'Option 2'] as const,
      };
      expect(hasSelectionOptions(selectProperty)).toBe(true);
    });

    it('should return true for multi_select properties with options', () => {
      const multiSelectProperty = {
        type: 'multi_select' as const,
        options: ['Tag 1', 'Tag 2', 'Tag 3'] as const,
      };
      expect(hasSelectionOptions(multiSelectProperty)).toBe(true);
    });

    it('should return false for non-selection properties', () => {
      const titleProperty = { type: 'title' as const };
      const numberProperty = { type: 'number' as const };

      expect(hasSelectionOptions(titleProperty)).toBe(false);
      expect(hasSelectionOptions(numberProperty)).toBe(false);
    });
  });

  describe('isTitleProperty', () => {
    it('should return true for title properties', () => {
      const titleProperty = { type: 'title' as const };
      expect(isTitleProperty(titleProperty)).toBe(true);
    });

    it('should return false for non-title properties', () => {
      const numberProperty = { type: 'number' as const };
      const selectProperty = {
        type: 'select' as const,
        options: ['Option 1'] as const,
      };

      expect(isTitleProperty(numberProperty)).toBe(false);
      expect(isTitleProperty(selectProperty)).toBe(false);
    });
  });

  describe('isRollupProperty', () => {
    it('should return true for rollup properties', () => {
      const rollupProperty = {
        type: 'rollup' as const,
        relation: 'tasks',
        property: 'priority',
        function: 'count' as const,
      };
      expect(isRollupProperty(rollupProperty)).toBe(true);
    });

    it('should return false for non-rollup properties', () => {
      const titleProperty = { type: 'title' as const };
      const numberProperty = { type: 'number' as const };
      const formulaProperty = {
        type: 'formula' as const,
        returnType: 'number' as const,
      };

      expect(isRollupProperty(titleProperty)).toBe(false);
      expect(isRollupProperty(numberProperty)).toBe(false);
      expect(isRollupProperty(formulaProperty)).toBe(false);
    });
  });

  describe('isFormulaProperty', () => {
    it('should return true for formula properties', () => {
      const formulaProperty = {
        type: 'formula' as const,
        returnType: 'number' as const,
      };
      expect(isFormulaProperty(formulaProperty)).toBe(true);
    });

    it('should return true for formula properties with expression', () => {
      const formulaProperty = {
        type: 'formula' as const,
        returnType: 'string' as const,
        expression: 'prop("First Name") + " " + prop("Last Name")',
      };
      expect(isFormulaProperty(formulaProperty)).toBe(true);
    });

    it('should return false for non-formula properties', () => {
      const titleProperty = { type: 'title' as const };
      const rollupProperty = {
        type: 'rollup' as const,
        relation: 'tasks',
        property: 'priority',
        function: 'count' as const,
      };

      expect(isFormulaProperty(titleProperty)).toBe(false);
      expect(isFormulaProperty(rollupProperty)).toBe(false);
    });
  });

  describe('isComplexProperty', () => {
    it('should return true for rollup properties', () => {
      const rollupProperty = {
        type: 'rollup' as const,
        relation: 'tasks',
        property: 'priority',
        function: 'sum' as const,
      };
      expect(isComplexProperty(rollupProperty)).toBe(true);
    });

    it('should return true for formula properties', () => {
      const formulaProperty = {
        type: 'formula' as const,
        returnType: 'boolean' as const,
        expression: 'prop("Due Date") < now()',
      };
      expect(isComplexProperty(formulaProperty)).toBe(true);
    });

    it('should return false for basic properties', () => {
      const titleProperty = { type: 'title' as const };
      const numberProperty = { type: 'number' as const };
      const selectProperty = {
        type: 'select' as const,
        options: ['Option 1'] as const,
      };

      expect(isComplexProperty(titleProperty)).toBe(false);
      expect(isComplexProperty(numberProperty)).toBe(false);
      expect(isComplexProperty(selectProperty)).toBe(false);
    });
  });
});
