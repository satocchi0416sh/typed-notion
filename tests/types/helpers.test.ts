/**
 * Tests for complex property helper functions
 *
 * Tests the rollup(), formula(), and union() helper functions
 * that provide a more ergonomic API for creating complex properties.
 */

import { describe, it, expect } from 'vitest';
import { rollup, formula, union } from '../../src/types/helpers.js';

describe('Complex Property Helpers', () => {
  describe('rollup() helper', () => {
    it('should create rollup property definition for count function', () => {
      const rollupProperty = rollup('tasks', 'title', 'count');

      expect(rollupProperty).toEqual({
        type: 'rollup',
        relation: 'tasks',
        property: 'title',
        function: 'count',
      });
    });

    it('should create rollup property definition for sum function', () => {
      const rollupProperty = rollup('expenses', 'amount', 'sum');

      expect(rollupProperty).toEqual({
        type: 'rollup',
        relation: 'expenses',
        property: 'amount',
        function: 'sum',
      });
    });

    it('should create rollup property definition for date functions', () => {
      const earliestRollup = rollup('tasks', 'due_date', 'earliest');
      const latestRollup = rollup('tasks', 'due_date', 'latest');

      expect(earliestRollup).toEqual({
        type: 'rollup',
        relation: 'tasks',
        property: 'due_date',
        function: 'earliest',
      });

      expect(latestRollup).toEqual({
        type: 'rollup',
        relation: 'tasks',
        property: 'due_date',
        function: 'latest',
      });
    });

    it('should create rollup property definition for statistical functions', () => {
      const avgRollup = rollup('reviews', 'rating', 'average');
      const minRollup = rollup('scores', 'value', 'min');
      const maxRollup = rollup('scores', 'value', 'max');

      expect(avgRollup.function).toBe('average');
      expect(minRollup.function).toBe('min');
      expect(maxRollup.function).toBe('max');
    });
  });

  describe('formula() helper', () => {
    it('should create formula property with string return type', () => {
      const formulaProperty = formula('string', 'concat("Hello ", name)');

      expect(formulaProperty).toEqual({
        type: 'formula',
        returnType: 'string',
        expression: 'concat("Hello ", name)',
      });
    });

    it('should create formula property with boolean return type', () => {
      const formulaProperty = formula('boolean', 'priority > 5');

      expect(formulaProperty).toEqual({
        type: 'formula',
        returnType: 'boolean',
        expression: 'priority > 5',
      });
    });

    it('should create formula property with number return type', () => {
      const formulaProperty = formula('number', 'priority * 2');

      expect(formulaProperty).toEqual({
        type: 'formula',
        returnType: 'number',
        expression: 'priority * 2',
      });
    });

    it('should create formula property with date return type', () => {
      const formulaProperty = formula('date', 'dateAdd(now(), 7, "days")');

      expect(formulaProperty).toEqual({
        type: 'formula',
        returnType: 'date',
        expression: 'dateAdd(now(), 7, "days")',
      });
    });

    it('should create formula property without expression', () => {
      const formulaProperty = formula('string');

      expect(formulaProperty).toEqual({
        type: 'formula',
        returnType: 'string',
        expression: undefined,
      });
    });

    it('should work with union return types', () => {
      const unionType = union('string', 'number');
      const formulaProperty = formula(unionType, 'if(completed, "Done", daysRemaining)');

      expect(formulaProperty.returnType).toEqual({
        kind: 'union',
        types: ['string', 'number'],
      });
      expect(formulaProperty.expression).toBe('if(completed, "Done", daysRemaining)');
    });
  });

  describe('union() helper', () => {
    it('should create union type with two types', () => {
      const unionType = union('string', 'number');

      expect(unionType).toEqual({
        kind: 'union',
        types: ['string', 'number'],
      });
    });

    it('should create union type with multiple types', () => {
      const unionType = union('string', 'number', 'boolean');

      expect(unionType).toEqual({
        kind: 'union',
        types: ['string', 'number', 'boolean'],
      });
    });

    it('should create union type with all supported types', () => {
      const unionType = union('string', 'number', 'boolean', 'date');

      expect(unionType).toEqual({
        kind: 'union',
        types: ['string', 'number', 'boolean', 'date'],
      });
    });

    it('should preserve type order', () => {
      const unionType = union('boolean', 'string', 'number');

      expect(unionType.types).toEqual(['boolean', 'string', 'number']);
    });
  });

  describe('Integration with schema creation', () => {
    it('should work together to create complex schema definitions', () => {
      // Simulate schema creation using helpers
      const schemaProperties = {
        title: { type: 'title' as const },

        // Rollup properties
        taskCount: rollup('tasks', 'title', 'count'),
        totalBudget: rollup('expenses', 'amount', 'sum'),
        averageRating: rollup('reviews', 'rating', 'average'),

        // Formula properties
        displayName: formula('string', 'concat("Project: ", title)'),
        isOverdue: formula('boolean', 'dueDate < now()'),
        priority: formula('number'),

        // Union type formula
        status: formula(union('string', 'number'), 'if(completed, "Done", daysRemaining)'),
      };

      // Verify all properties have correct structure
      expect(schemaProperties.taskCount.type).toBe('rollup');
      expect(schemaProperties.taskCount.function).toBe('count');

      expect(schemaProperties.displayName.type).toBe('formula');
      expect(schemaProperties.displayName.returnType).toBe('string');

      expect(schemaProperties.status.type).toBe('formula');
      expect(schemaProperties.status.returnType).toEqual({
        kind: 'union',
        types: ['string', 'number'],
      });
    });
  });
});
