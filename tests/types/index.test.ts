/**
 * Tests for types index exports (src/types/index.ts)
 *
 * Tests that all type definitions and functions are properly exported
 * and accessible from the main types entry point.
 */

import { describe, it, expect } from 'vitest';
import type {
  // Core types
  PropertyType,
  PropertyDefinition,
  SchemaDefinition,
  NotionUser,
  QueryOptions,
  PerformanceMetrics,
  // Inference types
  InferPropertyType,
  ExtractSelectionOptions,
  // Property types
  TitleProperty,
  RichTextProperty,
  NumberProperty,
  CheckboxProperty,
  DateProperty,
  URLProperty,
  EmailProperty,
  SelectProperty,
  MultiSelectProperty,
  RollupProperty,
  FormulaProperty,
  RollupFunction,
  FormulaReturnType,
} from '../../src/types/index.js';

import {
  // Inference functions
  isValidPropertyType,
  hasSelectionOptions,
  isTitleProperty,
  // Property functions
  isBasicProperty,
  isTextProperty,
  isSelectionProperty,
  isContactProperty,
  isDateProperty,
  isRollupProperty,
  isFormulaProperty,
  isComplexProperty,
  getPropertyCategory,
  // Helper functions
  rollup,
  formula,
  union,
} from '../../src/types/index.js';

describe('Types Index Exports', () => {
  describe('Core Type Exports', () => {
    it('should export PropertyType union', () => {
      const type: PropertyType = 'title';
      expect(typeof type).toBe('string');
    });

    it('should export PropertyDefinition types', () => {
      const def: PropertyDefinition = { type: 'title' };
      expect(def.type).toBe('title');
    });

    it('should export SchemaDefinition interface', () => {
      const schema: SchemaDefinition = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: { title: { type: 'title' } },
      };
      expect(schema.databaseId).toBeTruthy();
    });

    it('should export NotionUser interface', () => {
      const user: NotionUser = { id: 'user-123', type: 'person' };
      expect(user.id).toBe('user-123');
    });

    it('should export QueryOptions interface', () => {
      const options: QueryOptions = { page_size: 50 };
      expect(options.page_size).toBe(50);
    });

    it('should export PerformanceMetrics interface', () => {
      const metrics: PerformanceMetrics = {
        schemaProcessingTime: 100,
        activeSchemaCount: 5,
        lastQueryDuration: 50,
      };
      expect(metrics.schemaProcessingTime).toBe(100);
    });
  });

  describe('Inference Type Exports', () => {
    it('should export InferPropertyType type', () => {
      type TestType = InferPropertyType<{ type: 'title' }>;
      const value: TestType = 'test string';
      expect(typeof value).toBe('string');
    });

    it('should export ExtractSelectionOptions type', () => {
      type TestOptions = ExtractSelectionOptions<{ type: 'select'; options: ['A', 'B'] }>;
      const option: TestOptions = 'A';
      expect(option).toBe('A');
    });
  });

  describe('Property Type Exports', () => {
    it('should export specific property types', () => {
      const title: TitleProperty = { type: 'title' };
      const text: RichTextProperty = { type: 'rich_text' };
      const number: NumberProperty = { type: 'number' };
      const checkbox: CheckboxProperty = { type: 'checkbox' };
      const date: DateProperty = { type: 'date' };
      const url: URLProperty = { type: 'url' };
      const email: EmailProperty = { type: 'email' };

      expect(title.type).toBe('title');
      expect(text.type).toBe('rich_text');
      expect(number.type).toBe('number');
      expect(checkbox.type).toBe('checkbox');
      expect(date.type).toBe('date');
      expect(url.type).toBe('url');
      expect(email.type).toBe('email');
    });

    it('should export selection property types', () => {
      const select: SelectProperty = { type: 'select', options: ['A', 'B'] };
      const multiSelect: MultiSelectProperty = {
        type: 'multi_select',
        options: ['Tag1', 'Tag2'],
      };

      expect(select.type).toBe('select');
      expect(multiSelect.type).toBe('multi_select');
    });

    it('should export complex property types', () => {
      const rollupProp: RollupProperty = {
        type: 'rollup',
        relation: 'tasks',
        property: 'count',
        function: 'sum',
      };
      const formulaProp: FormulaProperty = {
        type: 'formula',
        returnType: 'string',
      };

      expect(rollupProp.type).toBe('rollup');
      expect(formulaProp.type).toBe('formula');
    });

    it('should export rollup and formula utility types', () => {
      const rollupFunc: RollupFunction = 'count';
      const returnType: FormulaReturnType = 'number';

      expect(rollupFunc).toBe('count');
      expect(returnType).toBe('number');
    });
  });

  describe('Inference Function Exports', () => {
    it('should export isValidPropertyType function', () => {
      expect(isValidPropertyType('title')).toBe(true);
      expect(isValidPropertyType('invalid' as PropertyType)).toBe(false);
    });

    it('should export hasSelectionOptions function', () => {
      expect(hasSelectionOptions({ type: 'select', options: ['A'] })).toBe(true);
      expect(hasSelectionOptions({ type: 'title' })).toBe(false);
    });

    it('should export isTitleProperty function', () => {
      expect(isTitleProperty({ type: 'title' })).toBe(true);
      expect(isTitleProperty({ type: 'rich_text' })).toBe(false);
    });
  });

  describe('Property Function Exports', () => {
    it('should export basic property type guards', () => {
      expect(isBasicProperty({ type: 'title' })).toBe(true);
      expect(isTextProperty({ type: 'rich_text' })).toBe(true);
      expect(isSelectionProperty({ type: 'select', options: ['A'] })).toBe(true);
      expect(isContactProperty({ type: 'people' })).toBe(true);
      expect(isDateProperty({ type: 'date' })).toBe(true);
    });

    it('should export complex property type guards', () => {
      const rollupDef = {
        type: 'rollup',
        relation: 'tasks',
        property: 'count',
        function: 'sum',
      } as const;
      const formulaDef = { type: 'formula', returnType: 'string' } as const;

      expect(isRollupProperty(rollupDef)).toBe(true);
      expect(isFormulaProperty(formulaDef)).toBe(true);
      expect(isComplexProperty(rollupDef)).toBe(true);
      expect(isComplexProperty(formulaDef)).toBe(true);
    });

    it('should export getPropertyCategory function', () => {
      expect(getPropertyCategory({ type: 'title' })).toBe('basic');
      expect(getPropertyCategory({ type: 'select', options: ['A'] })).toBe('selection');
      expect(
        getPropertyCategory({ type: 'rollup', relation: 'r', property: 'p', function: 'count' })
      ).toBe('complex');
    });
  });

  describe('Helper Function Exports', () => {
    it('should export rollup helper function', () => {
      const rollupDef = rollup('tasks', 'priority', 'sum');
      expect(rollupDef.type).toBe('rollup');
      expect(rollupDef.relation).toBe('tasks');
      expect(rollupDef.property).toBe('priority');
      expect(rollupDef.function).toBe('sum');
    });

    it('should export formula helper function', () => {
      const formulaDef = formula('string', 'prop("Title")');
      expect(formulaDef.type).toBe('formula');
      expect(formulaDef.returnType).toBe('string');
      expect(formulaDef.expression).toBe('prop("Title")');
    });

    it('should export union helper function', () => {
      const unionDef = union('string', 'number');
      expect(unionDef.kind).toBe('union');
      expect(unionDef.types).toEqual(['string', 'number']);
    });
  });
});
