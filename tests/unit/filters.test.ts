/**
 * Unit tests for Filter system
 *
 * Tests FilterBuilder, FilterValidator, and FilterConverter classes
 * for type-safe filter construction and validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FilterBuilder,
  FilterValidator,
  FilterConverter,
  createFilterBuilder,
  createFilterValidator,
  createFilterConverter,
} from '../../src/client/filters.js';
import type { SchemaDefinition } from '../../src/types/core.js';

// Mock the property types validation functions
vi.mock('../../src/schema/property-types.js', () => ({
  isValidOperator: vi.fn().mockReturnValue(true),
}));

describe('Filter System', () => {
  let mockSchema: { definition: SchemaDefinition };

  beforeEach(() => {
    mockSchema = {
      definition: {
        databaseId: 'test-database-id',
        properties: {
          title: { type: 'title' },
          status: { type: 'select', options: ['Active', 'Inactive', 'Pending'] },
          priority: { type: 'select', options: ['High', 'Medium', 'Low'] },
          count: { type: 'number' },
          completed: { type: 'checkbox' },
          dueDate: { type: 'date' },
          tags: { type: 'multi_select', options: ['urgent', 'feature', 'bug'] },
          email: { type: 'email' },
          url: { type: 'url' },
          description: { type: 'rich_text' },
        },
      },
    };
  });

  describe('FilterBuilder', () => {
    let builder: FilterBuilder<SchemaDefinition>;

    beforeEach(() => {
      builder = new FilterBuilder(mockSchema);
    });

    describe('Basic Filter Construction', () => {
      it('should create simple property filters', () => {
        const filter = builder.where('status', { equals: 'Active' }).build();

        expect(filter).toEqual({
          property: 'status',
          select: { equals: 'Active' },
        });
      });

      it('should create number filters', () => {
        const filter = builder.where('count', { greater_than: 5 }).build();

        expect(filter).toEqual({
          property: 'count',
          number: { greater_than: 5 },
        });
      });

      it('should create checkbox filters', () => {
        const filter = builder.where('completed', { equals: true }).build();

        expect(filter).toEqual({
          property: 'completed',
          checkbox: { equals: true },
        });
      });

      it('should create date filters', () => {
        const filter = builder.where('dueDate', { before: '2024-12-31' }).build();

        expect(filter).toEqual({
          property: 'dueDate',
          date: { before: '2024-12-31' },
        });
      });

      it('should create text-based filters', () => {
        const filter = builder.where('title', { contains: 'test' }).build();

        expect(filter).toEqual({
          property: 'title',
          title: { contains: 'test' },
        });
      });

      it('should create multi-select filters', () => {
        const filter = builder.where('tags', { contains: 'urgent' }).build();

        expect(filter).toEqual({
          property: 'tags',
          multi_select: { contains: 'urgent' },
        });
      });
    });

    describe('Compound Filters - AND Logic', () => {
      it('should combine multiple filters with AND logic', () => {
        const filter = builder
          .where('status', { equals: 'Active' })
          .where('priority', { equals: 'High' })
          .build();

        expect(filter).toEqual({
          and: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'priority', select: { equals: 'High' } },
          ],
        });
      });

      it('should handle complex AND combinations', () => {
        const filter = builder
          .where('status', { equals: 'Active' })
          .where('count', { greater_than: 10 })
          .where('completed', { equals: false })
          .build();

        expect(filter).toEqual({
          and: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'count', number: { greater_than: 10 } },
            { property: 'completed', checkbox: { equals: false } },
          ],
        });
      });
    });

    describe('Compound Filters - OR Logic', () => {
      it('should combine two filters with OR logic', () => {
        const filter = builder
          .where('status', { equals: 'Active' })
          .or({ property: 'priority', select: { equals: 'High' } } as any)
          .build();

        expect(filter).toEqual({
          or: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'priority', select: { equals: 'High' } },
          ],
        });
      });

      it('should handle complex OR combinations', () => {
        const complexFilter = builder
          .where('status', { equals: 'Active' })
          .where('priority', { equals: 'High' })
          .or({ property: 'tags', multi_select: { contains: 'urgent' } } as any)
          .build();

        expect(complexFilter).toEqual({
          or: [
            {
              and: [
                { property: 'status', select: { equals: 'Active' } },
                { property: 'priority', select: { equals: 'High' } },
              ],
            },
            { property: 'tags', multi_select: { contains: 'urgent' } },
          ],
        });
      });
    });

    describe('Builder State Management', () => {
      it('should return undefined for empty filter', () => {
        const filter = builder.build();
        expect(filter).toBeUndefined();
      });

      it('should return single filter when only one condition', () => {
        const filter = builder.where('status', { equals: 'Active' }).build();

        expect(filter).not.toHaveProperty('and');
        expect(filter).toEqual({
          property: 'status',
          select: { equals: 'Active' },
        });
      });

      it('should clear filters when requested', () => {
        builder.where('status', { equals: 'Active' }).where('count', { greater_than: 5 });

        expect(builder.getFilterCount()).toBe(2);

        builder.clear();
        expect(builder.getFilterCount()).toBe(0);
        expect(builder.build()).toBeUndefined();
      });

      it('should track filter count correctly', () => {
        expect(builder.getFilterCount()).toBe(0);

        builder.where('status', { equals: 'Active' });
        expect(builder.getFilterCount()).toBe(1);

        builder.where('priority', { equals: 'High' });
        expect(builder.getFilterCount()).toBe(2);
      });
    });

    describe('Method Chaining', () => {
      it('should support fluent interface', () => {
        const result = builder
          .where('status', { equals: 'Active' })
          .and({ property: 'priority', select: { equals: 'High' } } as any)
          .clear()
          .where('completed', { equals: true });

        expect(result).toBe(builder);
        expect(builder.getFilterCount()).toBe(1);
      });
    });
  });

  describe('FilterValidator', () => {
    let validator: FilterValidator<SchemaDefinition>;

    beforeEach(() => {
      validator = new FilterValidator(mockSchema);
    });

    describe('Valid Filter Validation', () => {
      it('should validate simple property filters', () => {
        const filter = {
          property: 'status',
          select: { equals: 'Active' },
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate compound AND filters', () => {
        const filter = {
          and: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'count', number: { greater_than: 5 } },
          ],
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate compound OR filters', () => {
        const filter = {
          or: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'priority', select: { equals: 'High' } },
          ],
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Invalid Filter Detection', () => {
      it('should reject filters with nonexistent properties', () => {
        const filter = {
          property: 'nonexistent',
          select: { equals: 'Active' },
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Property 'nonexistent' does not exist in schema");
      });

      it('should reject filters missing property field', () => {
        const filter = {
          select: { equals: 'Active' },
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Filter must have a property field');
      });

      it('should reject filters missing property type condition', () => {
        const filter = {
          property: 'status',
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Filter must specify condition for property type 'select'");
      });

      it('should reject empty AND filters', () => {
        const filter = {
          and: [],
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('AND filter must contain at least one condition');
      });

      it('should reject empty OR filters', () => {
        const filter = {
          or: [],
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('OR filter must contain at least one condition');
      });
    });

    describe('Select Options Validation', () => {
      it('should warn about invalid select options', () => {
        const filter = {
          property: 'status',
          select: { equals: 'InvalidStatus' },
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(true); // Still valid, but with warning
        expect(result.warnings).toContain(
          "Value 'InvalidStatus' is not in the defined options for property 'status': [Active, Inactive, Pending]"
        );
      });

      it('should warn about invalid multi-select options', () => {
        const filter = {
          property: 'tags',
          multi_select: { contains: 'invalid-tag' },
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(true); // Still valid, but with warning
        expect(result.warnings).toContain(
          "Value 'invalid-tag' is not in the defined options for property 'tags': [urgent, feature, bug]"
        );
      });

      it('should not warn for empty value operators', () => {
        const filter = {
          property: 'status',
          select: { is_empty: true },
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });
    });

    describe('Nested Filter Validation', () => {
      it('should validate deeply nested filters', () => {
        const filter = {
          and: [
            {
              or: [
                { property: 'status', select: { equals: 'Active' } },
                { property: 'priority', select: { equals: 'High' } },
              ],
            },
            { property: 'completed', checkbox: { equals: false } },
          ],
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should catch errors in nested filters', () => {
        const filter = {
          and: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'invalid', select: { equals: 'value' } },
          ],
        } as any;

        const result = validator.validate(filter);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Property 'invalid' does not exist in schema");
      });
    });

    describe('Error Recovery', () => {
      it('should handle validation exceptions gracefully', () => {
        // Create a malformed filter that might cause exceptions
        const malformedFilter = {
          property: 'status',
          select: null,
        } as any;

        const result = validator.validate(malformedFilter);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('FilterConverter', () => {
    let converter: FilterConverter<SchemaDefinition>;

    beforeEach(() => {
      converter = new FilterConverter<SchemaDefinition>();
    });

    describe('Simple Filter Conversion', () => {
      it('should convert simple property filters', () => {
        const filter = {
          property: 'status',
          select: { equals: 'Active' },
        } as any;

        const result = converter.toNotionFilter(filter);
        expect(result).toEqual({
          property: 'status',
          select: { equals: 'Active' },
        });
      });

      it('should convert number filters', () => {
        const filter = {
          property: 'count',
          number: { greater_than: 10, less_than: 100 },
        } as any;

        const result = converter.toNotionFilter(filter);
        expect(result).toEqual({
          property: 'count',
          number: { greater_than: 10, less_than: 100 },
        });
      });

      it('should convert checkbox filters', () => {
        const filter = {
          property: 'completed',
          checkbox: { equals: true },
        } as any;

        const result = converter.toNotionFilter(filter);
        expect(result).toEqual({
          property: 'completed',
          checkbox: { equals: true },
        });
      });
    });

    describe('Compound Filter Conversion', () => {
      it('should convert AND filters', () => {
        const filter = {
          and: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'priority', select: { equals: 'High' } },
          ],
        } as any;

        const result = converter.toNotionFilter(filter);
        expect(result).toEqual({
          and: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'priority', select: { equals: 'High' } },
          ],
        });
      });

      it('should convert OR filters', () => {
        const filter = {
          or: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'status', select: { equals: 'Pending' } },
          ],
        } as any;

        const result = converter.toNotionFilter(filter);
        expect(result).toEqual({
          or: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'status', select: { equals: 'Pending' } },
          ],
        });
      });
    });

    describe('Nested Filter Conversion', () => {
      it('should convert deeply nested filters', () => {
        const filter = {
          and: [
            {
              or: [
                { property: 'status', select: { equals: 'Active' } },
                { property: 'priority', select: { equals: 'High' } },
              ],
            },
            { property: 'completed', checkbox: { equals: false } },
          ],
        } as any;

        const result = converter.toNotionFilter(filter);
        expect(result).toEqual({
          and: [
            {
              or: [
                { property: 'status', select: { equals: 'Active' } },
                { property: 'priority', select: { equals: 'High' } },
              ],
            },
            { property: 'completed', checkbox: { equals: false } },
          ],
        });
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid filter structure', () => {
        const invalidFilter = {
          property: 'status',
          // Missing property type condition
        } as any;

        expect(() => converter.toNotionFilter(invalidFilter)).toThrow(
          'Invalid filter: missing property type'
        );
      });
    });
  });

  describe('Factory Functions', () => {
    it('should create FilterBuilder with factory function', () => {
      const builder = createFilterBuilder(mockSchema);
      expect(builder).toBeInstanceOf(FilterBuilder);
      expect(builder.getFilterCount()).toBe(0);
    });

    it('should create FilterValidator with factory function', () => {
      const validator = createFilterValidator(mockSchema);
      expect(validator).toBeInstanceOf(FilterValidator);
    });

    it('should create FilterConverter with factory function', () => {
      const converter = createFilterConverter<SchemaDefinition>();
      expect(converter).toBeInstanceOf(FilterConverter);
    });
  });

  describe('Integration Tests', () => {
    it('should work together in typical workflow', () => {
      // Build filter
      const builder = createFilterBuilder(mockSchema);
      const filter = builder
        .where('status', { equals: 'Active' })
        .where('priority', { equals: 'High' })
        .build();

      // Validate filter
      const validator = createFilterValidator(mockSchema);
      const validation = validator.validate(filter!);
      expect(validation.isValid).toBe(true);

      // Convert filter
      const converter = createFilterConverter<SchemaDefinition>();
      const notionFilter = converter.toNotionFilter(filter!);

      expect(notionFilter).toEqual({
        and: [
          { property: 'status', select: { equals: 'Active' } },
          { property: 'priority', select: { equals: 'High' } },
        ],
      });
    });

    it('should handle complex real-world scenarios', () => {
      const builder = createFilterBuilder(mockSchema);
      const filter = builder
        .where('status', { equals: 'Active' })
        .where('tags', { contains: 'urgent' })
        .or({
          and: [
            { property: 'priority', select: { equals: 'High' } },
            { property: 'dueDate', date: { before: '2024-12-31' } },
          ],
        } as any)
        .build();

      const validator = createFilterValidator(mockSchema);
      const validation = validator.validate(filter!);
      expect(validation.isValid).toBe(true);

      const converter = createFilterConverter<SchemaDefinition>();
      const notionFilter = converter.toNotionFilter(filter!);

      // Should create a complex nested structure
      expect(notionFilter).toHaveProperty('or');
      expect(notionFilter.or).toHaveLength(2);
    });
  });
});
