/**
 * Simple type inference tests for src/types/inference.ts
 *
 * Testing type guards and runtime functions only.
 * Type-level tests removed due to expect-type compatibility issues.
 */

import { describe, it, expect } from 'vitest';
import { expectTypeOf } from 'expect-type';
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
import type { InferPropertyType, InferSchemaProperties } from '../../src/types/index.js';
import { createTypedSchema } from '../../src/schema/index.js';

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

  describe('Literal Type Preservation', () => {
    describe('Select Property Literal Types', () => {
      it('should preserve select options as literal union types', () => {
        type SelectProperty = { type: 'select'; options: readonly ['Todo', 'In Progress', 'Done'] };
        type InferredType = InferPropertyType<SelectProperty>;

        expectTypeOf<InferredType>().toEqualTypeOf<'Todo' | 'In Progress' | 'Done' | null>();
      });

      it('should handle single option select types', () => {
        type SingleSelectProperty = { type: 'select'; options: readonly ['Only Option'] };
        type InferredType = InferPropertyType<SingleSelectProperty>;

        expectTypeOf<InferredType>().toEqualTypeOf<'Only Option' | null>();
      });

      it('should handle complex option names in select', () => {
        type ComplexSelectProperty = {
          type: 'select';
          options: readonly [
            'Option with spaces',
            'Option_with_underscores',
            'Option-with-dashes',
            'Option123',
          ];
        };
        type InferredType = InferPropertyType<ComplexSelectProperty>;

        expectTypeOf<InferredType>().toEqualTypeOf<
          | 'Option with spaces'
          | 'Option_with_underscores'
          | 'Option-with-dashes'
          | 'Option123'
          | null
        >();
      });
    });

    describe('Multi-Select Property Literal Types', () => {
      it('should preserve multi_select options as literal union arrays', () => {
        type MultiSelectProperty = {
          type: 'multi_select';
          options: readonly ['Bug', 'Feature', 'Enhancement', 'Documentation'];
        };
        type InferredType = InferPropertyType<MultiSelectProperty>;

        expectTypeOf<InferredType>().toEqualTypeOf<
          ('Bug' | 'Feature' | 'Enhancement' | 'Documentation')[] | null
        >();
      });

      it('should handle single option multi_select types', () => {
        type SingleMultiSelectProperty = { type: 'multi_select'; options: readonly ['OnlyTag'] };
        type InferredType = InferPropertyType<SingleMultiSelectProperty>;

        expectTypeOf<InferredType>().toEqualTypeOf<'OnlyTag'[] | null>();
      });
    });
  });

  describe('Schema-Level Type Inference', () => {
    it('should preserve literal types in complete task schema', () => {
      const taskSchema = {
        databaseId: 'task-schema-uuid-1234-5678',
        properties: {
          Title: { type: 'title' },
          Description: { type: 'rich_text' },
          Status: {
            type: 'select',
            options: ['Todo', 'In Progress', 'Done'] as const,
          },
          Tags: {
            type: 'multi_select',
            options: ['Bug', 'Feature', 'Enhancement', 'Documentation'] as const,
          },
        },
      } as const;

      type InferredProperties = InferSchemaProperties<typeof taskSchema>;

      expectTypeOf<InferredProperties['Title']>().toEqualTypeOf<string | null>();
      expectTypeOf<InferredProperties['Description']>().toEqualTypeOf<string | null>();
      expectTypeOf<InferredProperties['Status']>().toEqualTypeOf<
        'Todo' | 'In Progress' | 'Done' | null
      >();
      expectTypeOf<InferredProperties['Tags']>().toEqualTypeOf<
        ('Bug' | 'Feature' | 'Enhancement' | 'Documentation')[] | null
      >();
    });

    it('should preserve literal types in project management schema', () => {
      const projectSchema = {
        databaseId: 'project-schema-uuid-abcd-efgh',
        properties: {
          Name: { type: 'title' },
          Priority: {
            type: 'select',
            options: ['Low', 'Medium', 'High', 'Critical'] as const,
          },
          Categories: {
            type: 'multi_select',
            options: ['Frontend', 'Backend', 'DevOps', 'Design', 'Testing'] as const,
          },
          Notes: { type: 'rich_text' },
          IsActive: { type: 'checkbox' },
        },
      } as const;

      type InferredProperties = InferSchemaProperties<typeof projectSchema>;

      expectTypeOf<InferredProperties['Name']>().toEqualTypeOf<string | null>();
      expectTypeOf<InferredProperties['Priority']>().toEqualTypeOf<
        'Low' | 'Medium' | 'High' | 'Critical' | null
      >();
      expectTypeOf<InferredProperties['Categories']>().toEqualTypeOf<
        ('Frontend' | 'Backend' | 'DevOps' | 'Design' | 'Testing')[] | null
      >();
      expectTypeOf<InferredProperties['Notes']>().toEqualTypeOf<string | null>();
      expectTypeOf<InferredProperties['IsActive']>().toEqualTypeOf<boolean | null>();
    });
  });

  describe('TypedSchema Integration', () => {
    it('should maintain literal types through TypedSchema creation', () => {
      const schema = createTypedSchema({
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Status: {
            type: 'select',
            options: ['Draft', 'Published', 'Archived'] as const,
          },
          Tags: {
            type: 'multi_select',
            options: ['Tech', 'Business', 'Personal'] as const,
          },
        },
      } as const);

      // Property definitions should maintain their literal option types
      const statusProperty = schema.getProperty('Status');
      expectTypeOf(statusProperty.type).toEqualTypeOf<'select'>();
      expectTypeOf(statusProperty).toHaveProperty('options');

      const tagsProperty = schema.getProperty('Tags');
      expectTypeOf(tagsProperty.type).toEqualTypeOf<'multi_select'>();
      expectTypeOf(tagsProperty).toHaveProperty('options');
    });

    it('should provide type-safe property access with literal constraints', () => {
      const blogSchema = createTypedSchema({
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Status: {
            type: 'select',
            options: ['Draft', 'Review', 'Published'] as const,
          },
          Categories: {
            type: 'multi_select',
            options: ['Tutorial', 'News', 'Opinion', 'Review'] as const,
          },
        },
      } as const);

      // Property names should be constrained to schema properties
      expectTypeOf<Parameters<typeof blogSchema.getProperty>[0]>().toEqualTypeOf<
        'Title' | 'Status' | 'Categories'
      >();

      // Property validator should accept literal types
      const validator = blogSchema.createPropertyValidator();

      // This should validate the literal types at runtime
      const statusResult = validator('Status', 'Draft');
      expectTypeOf(statusResult).toEqualTypeOf<boolean>();

      const categoryResult = validator('Categories', ['Tutorial', 'News']);
      expectTypeOf(categoryResult).toEqualTypeOf<boolean>();
    });
  });

  describe('Literal Type Edge Cases', () => {
    it('should handle numeric-like string literals', () => {
      const versionSchema = {
        databaseId: 'version-uuid',
        properties: {
          Title: { type: 'title' },
          Version: {
            type: 'select',
            options: ['1.0', '1.1', '2.0', '2.1', '3.0'] as const,
          },
        },
      } as const;

      type VersionProperties = InferSchemaProperties<typeof versionSchema>;
      expectTypeOf<VersionProperties['Version']>().toEqualTypeOf<
        '1.0' | '1.1' | '2.0' | '2.1' | '3.0' | null
      >();
    });

    it('should handle emoji and unicode literals', () => {
      const reactionSchema = {
        databaseId: 'reaction-uuid',
        properties: {
          Title: { type: 'title' },
          Reaction: {
            type: 'select',
            options: ['👍', '👎', '❤️', '😂', '😮', '😢'] as const,
          },
          Moods: {
            type: 'multi_select',
            options: ['Happy 😊', 'Sad 😢', 'Excited 🎉', 'Confused 🤔'] as const,
          },
        },
      } as const;

      type ReactionProperties = InferSchemaProperties<typeof reactionSchema>;

      expectTypeOf<ReactionProperties['Reaction']>().toEqualTypeOf<
        '👍' | '👎' | '❤️' | '😂' | '😮' | '😢' | null
      >();

      expectTypeOf<ReactionProperties['Moods']>().toEqualTypeOf<
        ('Happy 😊' | 'Sad 😢' | 'Excited 🎉' | 'Confused 🤔')[] | null
      >();
    });
  });
});
