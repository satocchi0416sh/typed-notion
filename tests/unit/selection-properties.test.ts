/**
 * Unit tests for text and selection properties in User Story 2
 * 
 * Tests individual property type behavior:
 * - Rich text properties
 * - Select properties with literal type preservation
 * - Multi-select properties with literal type preservation
 * - Selection option validation
 */

import { describe, it, expect } from 'vitest';
import { 
  validatePropertyStructure, 
  validatePropertyValue,
  validateSelectionOptions,
  validateSchemaStructure
} from '../../src/schema/validator.js';
import { PropertyValidationError, SelectionValidationError } from '../../src/errors/index.js';
import type { PropertyDefinition } from '../../src/types/core.js';

describe('Unit Tests: Text and Selection Properties', () => {
  describe('Rich Text Property', () => {
    it('should validate rich_text property definition', () => {
      const definition: PropertyDefinition = { type: 'rich_text' };
      const errors = validatePropertyStructure('Description', definition);
      expect(errors).toHaveLength(0);
    });

    it('should validate rich_text property values', () => {
      const definition: PropertyDefinition = { type: 'rich_text' };
      
      // Valid values
      expect(() => validatePropertyValue('Simple text', definition, 'Description')).not.toThrow();
      expect(() => validatePropertyValue('Complex **bold** and *italic* text', definition, 'Description')).not.toThrow();
      expect(() => validatePropertyValue('', definition, 'Description')).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'Description')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'Description')).not.toThrow();
    });

    it('should reject invalid rich_text property values', () => {
      const definition: PropertyDefinition = { type: 'rich_text' };
      
      expect(() => validatePropertyValue(123, definition, 'Description'))
        .toThrow(PropertyValidationError);
      expect(() => validatePropertyValue(true, definition, 'Description'))
        .toThrow(PropertyValidationError);
      expect(() => validatePropertyValue([], definition, 'Description'))
        .toThrow(PropertyValidationError);
      expect(() => validatePropertyValue({}, definition, 'Description'))
        .toThrow(PropertyValidationError);
    });

    it('should provide specific error details for rich_text properties', () => {
      const definition: PropertyDefinition = { type: 'rich_text' };
      
      try {
        validatePropertyValue(123, definition, 'Description');
      } catch (error) {
        expect(error).toBeInstanceOf(PropertyValidationError);
        const propError = error as PropertyValidationError;
        expect(propError.context.property).toBe('Description');
        expect(propError.context.value).toBe(123);
        expect(propError.context.expectedType).toBe('string');
      }
    });
  });

  describe('Select Property', () => {
    it('should validate select property definition with options', () => {
      const definition: PropertyDefinition = { 
        type: 'select', 
        options: ['Option 1', 'Option 2', 'Option 3'] 
      };
      const errors = validatePropertyStructure('Status', definition);
      expect(errors).toHaveLength(0);
    });

    it('should reject select property without options', () => {
      const definition = { type: 'select' } as any;
      const errors = validatePropertyStructure('Status', definition);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('options array');
    });

    it('should validate select property values', () => {
      const definition: PropertyDefinition = { 
        type: 'select', 
        options: ['Todo', 'In Progress', 'Done'] 
      };
      
      // Valid values
      expect(() => validatePropertyValue('Todo', definition, 'Status')).not.toThrow();
      expect(() => validatePropertyValue('In Progress', definition, 'Status')).not.toThrow();
      expect(() => validatePropertyValue('Done', definition, 'Status')).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'Status')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'Status')).not.toThrow();
    });

    it('should reject invalid select property values', () => {
      const definition: PropertyDefinition = { 
        type: 'select', 
        options: ['Todo', 'In Progress', 'Done'] 
      };
      
      expect(() => validatePropertyValue('Invalid Option', definition, 'Status'))
        .toThrow(SelectionValidationError);
      expect(() => validatePropertyValue(123, definition, 'Status'))
        .toThrow(PropertyValidationError);
      expect(() => validatePropertyValue(['Todo'], definition, 'Status'))
        .toThrow(PropertyValidationError);
    });

    it('should provide specific error details for select properties', () => {
      const definition: PropertyDefinition = { 
        type: 'select', 
        options: ['Todo', 'In Progress', 'Done'] 
      };
      
      try {
        validatePropertyValue('Invalid Option', definition, 'Status');
      } catch (error) {
        expect(error).toBeInstanceOf(SelectionValidationError);
        const selectionError = error as SelectionValidationError;
        expect(selectionError.context.property).toBe('Status');
        expect(selectionError.context.value).toBe('Invalid Option');
        expect(selectionError.context.validOptions).toEqual(['Todo', 'In Progress', 'Done']);
      }
    });
  });

  describe('Multi-Select Property', () => {
    it('should validate multi_select property definition with options', () => {
      const definition: PropertyDefinition = { 
        type: 'multi_select', 
        options: ['Tag1', 'Tag2', 'Tag3', 'Tag4'] 
      };
      const errors = validatePropertyStructure('Tags', definition);
      expect(errors).toHaveLength(0);
    });

    it('should reject multi_select property without options', () => {
      const definition = { type: 'multi_select' } as any;
      const errors = validatePropertyStructure('Tags', definition);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('options array');
    });

    it('should validate multi_select property values', () => {
      const definition: PropertyDefinition = { 
        type: 'multi_select', 
        options: ['Bug', 'Feature', 'Enhancement', 'Documentation'] 
      };
      
      // Valid values
      expect(() => validatePropertyValue([], definition, 'Tags')).not.toThrow();
      expect(() => validatePropertyValue(['Bug'], definition, 'Tags')).not.toThrow();
      expect(() => validatePropertyValue(['Bug', 'Feature'], definition, 'Tags')).not.toThrow();
      expect(() => validatePropertyValue(['Bug', 'Feature', 'Enhancement'], definition, 'Tags')).not.toThrow();
      expect(() => validatePropertyValue(null, definition, 'Tags')).not.toThrow();
      expect(() => validatePropertyValue(undefined, definition, 'Tags')).not.toThrow();
    });

    it('should reject invalid multi_select property values', () => {
      const definition: PropertyDefinition = { 
        type: 'multi_select', 
        options: ['Bug', 'Feature', 'Enhancement', 'Documentation'] 
      };
      
      expect(() => validatePropertyValue(['Invalid Tag'], definition, 'Tags'))
        .toThrow(SelectionValidationError);
      expect(() => validatePropertyValue(['Bug', 'Invalid Tag'], definition, 'Tags'))
        .toThrow(SelectionValidationError);
      expect(() => validatePropertyValue('Bug', definition, 'Tags'))
        .toThrow(PropertyValidationError);
      expect(() => validatePropertyValue(123, definition, 'Tags'))
        .toThrow(PropertyValidationError);
    });

    it('should handle mixed valid/invalid multi_select values', () => {
      const definition: PropertyDefinition = { 
        type: 'multi_select', 
        options: ['Bug', 'Feature', 'Enhancement', 'Documentation'] 
      };
      
      // First invalid value should be reported
      try {
        validatePropertyValue(['Bug', 'InvalidTag', 'Feature'], definition, 'Tags');
      } catch (error) {
        expect(error).toBeInstanceOf(SelectionValidationError);
        const selectionError = error as SelectionValidationError;
        expect(selectionError.context.value).toBe('InvalidTag');
      }
    });
  });

  describe('Selection Options Validation', () => {
    it('should accept valid selection options', () => {
      const validOptions = [
        ['Option1', 'Option2', 'Option3'],
        ['A', 'B', 'C', 'D'],
        ['Status: Active', 'Status: Inactive'],
        ['Very Long Option Name That Is Still Valid']
      ];

      validOptions.forEach((options, index) => {
        const errors = validateSelectionOptions(options, `Property${index}`);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject empty selection options', () => {
      const errors = validateSelectionOptions([], 'Status');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('cannot be empty');
    });

    it('should reject non-array selection options', () => {
      const invalidOptions = ['not an array', 123, {}, null, undefined];
      
      invalidOptions.forEach(options => {
        const errors = validateSelectionOptions(options, 'Status');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('must be an array');
      });
    });

    it('should reject selection options with non-string values', () => {
      const optionsWithNumbers = ['Valid', 123, 'Also Valid'];
      const errors = validateSelectionOptions(optionsWithNumbers, 'Status');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('must be strings');
    });

    it('should reject selection options with empty strings', () => {
      const optionsWithEmpty = ['Valid', '', '   ', 'Also Valid'];
      const errors = validateSelectionOptions(optionsWithEmpty, 'Status');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('empty strings');
    });

    it('should reject selection options with duplicates', () => {
      const optionsWithDuplicates = ['Option1', 'Option2', 'Option1', 'Option3'];
      const errors = validateSelectionOptions(optionsWithDuplicates, 'Status');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('must be unique');
    });

    it('should validate complex selection option scenarios', () => {
      const complexOptions = [
        'Option With Spaces',
        'Option_With_Underscores',
        'Option-With-Dashes',
        'Option123WithNumbers',
        'OptionWithSpecialChars!@#$%',
        'Very Long Option Name That Should Still Be Valid Because Length Is Not Restricted'
      ];
      
      const errors = validateSelectionOptions(complexOptions, 'ComplexField');
      expect(errors).toHaveLength(0);
    });
  });

  describe('Schema Validation with Text and Selection Properties', () => {
    it('should validate schema with text and selection properties', () => {
      const schema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Description: { type: 'rich_text' },
          Status: { 
            type: 'select', 
            options: ['Todo', 'In Progress', 'Done'] 
          },
          Tags: { 
            type: 'multi_select',
            options: ['Bug', 'Feature', 'Enhancement', 'Documentation'] 
          }
        }
      };

      const result = validateSchemaStructure(schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject schema with invalid selection properties', () => {
      const schemaWithEmptySelect = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Status: { type: 'select', options: [] }
        }
      };

      const result = validateSchemaStructure(schemaWithEmptySelect);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('empty'))).toBe(true);
    });

    it('should reject schema with duplicate selection options', () => {
      const schemaWithDuplicates = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Status: { type: 'select', options: ['Todo', 'Done', 'Todo'] }
        }
      };

      const result = validateSchemaStructure(schemaWithDuplicates);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('unique'))).toBe(true);
    });

    it('should handle mixed text and selection property schemas', () => {
      const blogSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Content: { type: 'rich_text' },
          Status: { 
            type: 'select', 
            options: ['Draft', 'Review', 'Published', 'Archived'] 
          },
          Categories: { 
            type: 'multi_select',
            options: ['Technology', 'Business', 'Lifestyle', 'Health', 'Education'] 
          },
          IsHighlighted: { type: 'checkbox' },
          ViewCount: { type: 'number' }
        }
      };

      const result = validateSchemaStructure(blogSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should enforce selection option limits and constraints', () => {
      // Test with many options (should still be valid)
      const manyOptions = Array.from({ length: 50 }, (_, i) => `Option${i + 1}`);
      const schemaWithManyOptions = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          ManyOptions: { type: 'select', options: manyOptions }
        }
      };

      const result = validateSchemaStructure(schemaWithManyOptions);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Property Type Integration', () => {
    it('should distinguish between text and selection property types', () => {
      const textProperty: PropertyDefinition = { type: 'rich_text' };
      const selectProperty: PropertyDefinition = { type: 'select', options: ['A', 'B'] };
      const multiSelectProperty: PropertyDefinition = { type: 'multi_select', options: ['X', 'Y'] };

      // Text properties accept any string
      expect(() => validatePropertyValue('Any text content', textProperty, 'Text')).not.toThrow();
      
      // Select properties only accept predefined options
      expect(() => validatePropertyValue('A', selectProperty, 'Select')).not.toThrow();
      expect(() => validatePropertyValue('C', selectProperty, 'Select')).toThrow(SelectionValidationError);
      
      // Multi-select properties only accept arrays of predefined options
      expect(() => validatePropertyValue(['X'], multiSelectProperty, 'MultiSelect')).not.toThrow();
      expect(() => validatePropertyValue(['Z'], multiSelectProperty, 'MultiSelect')).toThrow(SelectionValidationError);
    });

    it('should handle edge cases in text and selection properties', () => {
      const definition: PropertyDefinition = { type: 'rich_text' };
      
      // Edge cases for text
      expect(() => validatePropertyValue('', definition, 'EmptyText')).not.toThrow();
      expect(() => validatePropertyValue('   ', definition, 'WhitespaceText')).not.toThrow();
      expect(() => validatePropertyValue('Text with\nnewlines\nand\ttabs', definition, 'MultilineText')).not.toThrow();
      
      // Unicode and special characters
      expect(() => validatePropertyValue('Text with émojis 🎉 and ünîcödé', definition, 'UnicodeText')).not.toThrow();
    });
  });
});