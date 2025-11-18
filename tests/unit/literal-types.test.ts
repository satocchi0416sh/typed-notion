/**
 * Literal type preservation tests for User Story 2
 *
 * Verifies that TypeScript correctly preserves literal types for:
 * - Select options as literal union types
 * - Multi-select options as literal union arrays
 * - Type inference from schema definitions
 * - Compile-time type checking of literal values
 */

import { describe, it } from 'vitest';
import { expectTypeOf } from 'expect-type';
import type { InferPropertyType, InferSchemaProperties } from '../../src/types/index.js';
import { createTypedSchema } from '../../src/schema/index.js';

describe('Literal Type Preservation Tests: User Story 2', () => {
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
        'Option with spaces' | 'Option_with_underscores' | 'Option-with-dashes' | 'Option123' | null
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

    it('should handle priority-based multi_select options', () => {
      type PriorityMultiSelectProperty = {
        type: 'multi_select';
        options: readonly ['High', 'Medium', 'Low', 'Critical'];
      };
      type InferredType = InferPropertyType<PriorityMultiSelectProperty>;

      expectTypeOf<InferredType>().toEqualTypeOf<
        ('High' | 'Medium' | 'Low' | 'Critical')[] | null
      >();
    });
  });

  describe('Schema-Level Literal Type Preservation', () => {
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

    it('should preserve literal types with mixed property types', () => {
      const complexSchema = {
        databaseId: 'complex-schema-uuid-1234',
        properties: {
          Title: { type: 'title' },
          Content: { type: 'rich_text' },
          Stage: {
            type: 'select',
            options: ['Planning', 'Development', 'Review', 'Deployment', 'Complete'] as const,
          },
          Skills: {
            type: 'multi_select',
            options: ['TypeScript', 'React', 'Node.js', 'Database', 'Testing', 'DevOps'] as const,
          },
          DueDate: { type: 'date' },
          Budget: { type: 'number', format: 'dollar' },
          IsUrgent: { type: 'checkbox' },
        },
      } as const;

      type InferredProperties = InferSchemaProperties<typeof complexSchema>;

      expectTypeOf<InferredProperties['Title']>().toEqualTypeOf<string | null>();
      expectTypeOf<InferredProperties['Content']>().toEqualTypeOf<string | null>();
      expectTypeOf<InferredProperties['Stage']>().toEqualTypeOf<
        'Planning' | 'Development' | 'Review' | 'Deployment' | 'Complete' | null
      >();
      expectTypeOf<InferredProperties['Skills']>().toEqualTypeOf<
        ('TypeScript' | 'React' | 'Node.js' | 'Database' | 'Testing' | 'DevOps')[] | null
      >();
      expectTypeOf<InferredProperties['DueDate']>().toEqualTypeOf<Date | null>();
      expectTypeOf<InferredProperties['Budget']>().toEqualTypeOf<number | null>();
      expectTypeOf<InferredProperties['IsUrgent']>().toEqualTypeOf<boolean | null>();
    });
  });

  describe('TypedSchema Literal Type Integration', () => {
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
      const statusResult = validator('Status', 'Draft'); // Should be valid
      expectTypeOf(statusResult).toEqualTypeOf<boolean>();

      const categoryResult = validator('Categories', ['Tutorial', 'News']); // Should be valid
      expectTypeOf(categoryResult).toEqualTypeOf<boolean>();
    });
  });

  describe('Literal Type Error Prevention', () => {
    it('should catch invalid literal values at compile time', () => {
      const taskSchema = {
        databaseId: 'task-uuid',
        properties: {
          Title: { type: 'title' },
          Status: {
            type: 'select',
            options: ['Todo', 'Doing', 'Done'] as const,
          },
        },
      } as const;

      type TaskProperties = InferSchemaProperties<typeof taskSchema>;

      // Valid literal assignment
      const validStatus: TaskProperties['Status'] = 'Todo';
      expectTypeOf<TaskProperties['Status']>().toEqualTypeOf<'Todo' | 'Doing' | 'Done' | null>();

      // These would cause TypeScript compilation errors (commented to prevent test failure):
      // const invalidStatus: TaskProperties['Status'] = 'Invalid'; // TS Error
      // const wrongType: TaskProperties['Status'] = 123; // TS Error
    });

    it('should enforce multi-select literal type constraints', () => {
      const schema = {
        databaseId: 'schema-uuid',
        properties: {
          Title: { type: 'title' },
          Tags: {
            type: 'multi_select',
            options: ['Important', 'Urgent', 'Optional'] as const,
          },
        },
      } as const;

      type SchemaProperties = InferSchemaProperties<typeof schema>;

      // Valid multi-select assignments
      const validTags1: SchemaProperties['Tags'] = ['Important'];
      const validTags2: SchemaProperties['Tags'] = ['Important', 'Urgent'];
      const validTags3: SchemaProperties['Tags'] = [];
      const validTags4: SchemaProperties['Tags'] = null;

      expectTypeOf<SchemaProperties['Tags']>().toEqualTypeOf<
        ('Important' | 'Urgent' | 'Optional')[] | null
      >();

      // These would cause TypeScript compilation errors:
      // const invalidTags: SchemaProperties['Tags'] = ['Invalid']; // TS Error
      // const wrongStructure: SchemaProperties['Tags'] = 'Important'; // TS Error
    });
  });

  describe('Advanced Literal Type Scenarios', () => {
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

    it('should preserve nested literal type structure', () => {
      const nestedSchema = {
        databaseId: 'nested-uuid',
        properties: {
          Title: { type: 'title' },
          Environment: {
            type: 'select',
            options: ['development', 'staging', 'production'] as const,
          },
          Services: {
            type: 'multi_select',
            options: ['api.service', 'web.frontend', 'worker.background', 'db.postgres'] as const,
          },
        },
      } as const;

      type NestedProperties = InferSchemaProperties<typeof nestedSchema>;

      // Should maintain exact literal types with dots and special characters
      expectTypeOf<NestedProperties['Environment']>().toEqualTypeOf<
        'development' | 'staging' | 'production' | null
      >();

      expectTypeOf<NestedProperties['Services']>().toEqualTypeOf<
        ('api.service' | 'web.frontend' | 'worker.background' | 'db.postgres')[] | null
      >();
    });
  });

  describe('Type Inference Edge Cases', () => {
    it('should handle empty arrays while preserving literal type structure', () => {
      // Even with no initial options, the type structure should be maintained
      const dynamicSchema = {
        databaseId: 'dynamic-uuid',
        properties: {
          Title: { type: 'title' },
          DynamicSelect: {
            type: 'select',
            options: [] as const,
          },
        },
      } as const;

      type DynamicProperties = InferSchemaProperties<typeof dynamicSchema>;

      // Should infer as never | null for empty options array
      expectTypeOf<DynamicProperties['DynamicSelect']>().toEqualTypeOf<never | null>();
    });

    it('should maintain literal types through property filtering', () => {
      const fullSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Priority: {
            type: 'select',
            options: ['P0', 'P1', 'P2', 'P3'] as const,
          },
          Labels: {
            type: 'multi_select',
            options: ['frontend', 'backend', 'mobile', 'desktop'] as const,
          },
          IsComplete: { type: 'checkbox' },
        },
      } as const;

      const schema = createTypedSchema(fullSchema);

      // Filtered properties should maintain their literal types
      const selectProperties = schema.getPropertiesByType('select');
      expectTypeOf(selectProperties[0]?.definition.type).toEqualTypeOf<'select'>();
      expectTypeOf(selectProperties[0]?.definition).toHaveProperty('options');

      const multiSelectProperties = schema.getPropertiesByType('multi_select');
      expectTypeOf(multiSelectProperties[0]?.definition.type).toEqualTypeOf<'multi_select'>();
      expectTypeOf(multiSelectProperties[0]?.definition).toHaveProperty('options');
    });
  });
});
