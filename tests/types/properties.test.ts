/**
 * Tests for property type definitions and type guards (src/types/properties.ts)
 *
 * Consolidated tests from properties-*.test.ts files covering:
 * - Type guard functions and property categorization
 * - Complex property type definitions (rollup and formula)
 * - Basic property validation and behavior
 * - Contact property validation
 * - Selection property validation with literal type preservation
 */

import { describe, it, expect } from 'vitest';
import {
  isRollupProperty,
  isFormulaProperty,
  isComplexProperty,
  isBasicProperty,
  isTextProperty,
  isSelectionProperty,
  isContactProperty,
  isDateProperty,
  getPropertyCategory,
} from '../../src/types/properties.js';
import {
  validatePropertyStructure,
  validatePropertyValue,
  validateSelectionOptions,
} from '../../src/schema/validator.js';
import { PropertyValidationError, SelectionValidationError } from '../../src/errors/index.js';
import type { RollupProperty, FormulaProperty } from '../../src/types/properties.js';
import type { PropertyDefinition, NotionUser } from '../../src/types/core.js';

describe('Property Type Definitions and Guards', () => {
  describe('Basic Property Types', () => {
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

        expect(() => validatePropertyValue(123, definition, 'Name')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(true, definition, 'Name')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue([], definition, 'Name')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue({}, definition, 'Name')).toThrow(
          PropertyValidationError
        );
      });

      it('should provide specific error details for title properties', () => {
        const definition: PropertyDefinition = { type: 'title' };

        try {
          validatePropertyValue(123, definition, 'Name');
        } catch (error) {
          expect(error).toBeInstanceOf(PropertyValidationError);
          const propError = error as PropertyValidationError;
          expect(propError.context?.property).toBe('Name');
          expect(propError.context?.value).toBe(123);
          expect(propError.context?.expectedType).toBe('string');
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
        expect(() => validatePropertyValue(NaN, definition, 'Age')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(true, definition, 'Age')).toThrow(
          PropertyValidationError
        );
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
        expect(() => validatePropertyValue(1, definition, 'Active')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(0, definition, 'Active')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue([], definition, 'Active')).toThrow(
          PropertyValidationError
        );
      });
    });

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
        expect(() =>
          validatePropertyValue('Complex **bold** and *italic* text', definition, 'Description')
        ).not.toThrow();
        expect(() => validatePropertyValue('', definition, 'Description')).not.toThrow();
        expect(() => validatePropertyValue(null, definition, 'Description')).not.toThrow();
        expect(() => validatePropertyValue(undefined, definition, 'Description')).not.toThrow();
      });

      it('should reject invalid rich_text property values', () => {
        const definition: PropertyDefinition = { type: 'rich_text' };

        expect(() => validatePropertyValue(123, definition, 'Description')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(true, definition, 'Description')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue([], definition, 'Description')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue({}, definition, 'Description')).toThrow(
          PropertyValidationError
        );
      });
    });
  });

  describe('Contact Properties', () => {
    describe('Date Property', () => {
      it('should validate date property definition', () => {
        const definition: PropertyDefinition = { type: 'date' };
        const errors = validatePropertyStructure('DueDate', definition);
        expect(errors).toHaveLength(0);
      });

      it('should validate date property values', () => {
        const definition: PropertyDefinition = { type: 'date' };

        // Valid values
        expect(() => validatePropertyValue(new Date(), definition, 'DueDate')).not.toThrow();
        expect(() =>
          validatePropertyValue(new Date('2024-01-01'), definition, 'DueDate')
        ).not.toThrow();
        expect(() => validatePropertyValue(null, definition, 'DueDate')).not.toThrow();
        expect(() => validatePropertyValue(undefined, definition, 'DueDate')).not.toThrow();
      });

      it('should reject invalid date property values', () => {
        const definition: PropertyDefinition = { type: 'date' };

        expect(() => validatePropertyValue('2024-01-01', definition, 'DueDate')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(123456789, definition, 'DueDate')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue({}, definition, 'DueDate')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue([], definition, 'DueDate')).toThrow(
          PropertyValidationError
        );
      });
    });

    describe('Email Property', () => {
      it('should validate email property definition', () => {
        const definition: PropertyDefinition = { type: 'email' };
        const errors = validatePropertyStructure('ContactEmail', definition);
        expect(errors).toHaveLength(0);
      });

      it('should validate email property values', () => {
        const definition: PropertyDefinition = { type: 'email' };

        // Valid email formats
        expect(() =>
          validatePropertyValue('user@example.com', definition, 'ContactEmail')
        ).not.toThrow();
        expect(() =>
          validatePropertyValue('test.email+tag@domain.org', definition, 'ContactEmail')
        ).not.toThrow();
        expect(() =>
          validatePropertyValue('user@subdomain.example.com', definition, 'ContactEmail')
        ).not.toThrow();
        expect(() => validatePropertyValue(null, definition, 'ContactEmail')).not.toThrow();
        expect(() => validatePropertyValue(undefined, definition, 'ContactEmail')).not.toThrow();
      });

      it('should reject invalid email property values', () => {
        const definition: PropertyDefinition = { type: 'email' };

        expect(() => validatePropertyValue('invalid-email', definition, 'ContactEmail')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue('user@', definition, 'ContactEmail')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(123, definition, 'ContactEmail')).toThrow(
          PropertyValidationError
        );
      });
    });

    describe('URL Property', () => {
      it('should validate URL property definition', () => {
        const definition: PropertyDefinition = { type: 'url' };
        const errors = validatePropertyStructure('WebsiteURL', definition);
        expect(errors).toHaveLength(0);
      });

      it('should validate URL property values', () => {
        const definition: PropertyDefinition = { type: 'url' };

        // Valid URL formats
        expect(() =>
          validatePropertyValue('https://example.com', definition, 'WebsiteURL')
        ).not.toThrow();
        expect(() =>
          validatePropertyValue('http://example.com', definition, 'WebsiteURL')
        ).not.toThrow();
        expect(() => validatePropertyValue(null, definition, 'WebsiteURL')).not.toThrow();
        expect(() => validatePropertyValue(undefined, definition, 'WebsiteURL')).not.toThrow();
      });

      it('should reject invalid URL property values', () => {
        const definition: PropertyDefinition = { type: 'url' };

        expect(() => validatePropertyValue('not-a-url', definition, 'WebsiteURL')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue('ftp://example.com', definition, 'WebsiteURL')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(123, definition, 'WebsiteURL')).toThrow(
          PropertyValidationError
        );
      });
    });

    describe('People Property', () => {
      it('should validate people property definition', () => {
        const definition: PropertyDefinition = { type: 'people' };
        const errors = validatePropertyStructure('Assignees', definition);
        expect(errors).toHaveLength(0);
      });

      it('should validate people property values', () => {
        const definition: PropertyDefinition = { type: 'people' };

        const validUser: NotionUser = {
          id: 'user-123',
          name: 'John Doe',
          avatar_url: 'https://example.com/avatar.jpg',
          type: 'person',
          person: { email: 'john@example.com' },
          bot: null,
        };

        // Valid values
        expect(() => validatePropertyValue([], definition, 'Assignees')).not.toThrow();
        expect(() => validatePropertyValue([validUser], definition, 'Assignees')).not.toThrow();
        expect(() => validatePropertyValue(null, definition, 'Assignees')).not.toThrow();
        expect(() => validatePropertyValue(undefined, definition, 'Assignees')).not.toThrow();
      });

      it('should reject invalid people property values', () => {
        const definition: PropertyDefinition = { type: 'people' };

        expect(() => validatePropertyValue('not-an-array', definition, 'Assignees')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(123, definition, 'Assignees')).toThrow(
          PropertyValidationError
        );
      });
    });
  });

  describe('Selection Properties', () => {
    describe('Select Property', () => {
      it('should validate select property definition with options', () => {
        const definition: PropertyDefinition = {
          type: 'select',
          options: ['Option 1', 'Option 2', 'Option 3'],
        };
        const errors = validatePropertyStructure('Status', definition);
        expect(errors).toHaveLength(0);
      });

      it('should validate select property values', () => {
        const definition: PropertyDefinition = {
          type: 'select',
          options: ['Todo', 'In Progress', 'Done'],
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
          options: ['Todo', 'In Progress', 'Done'],
        };

        expect(() => validatePropertyValue('Invalid Option', definition, 'Status')).toThrow(
          SelectionValidationError
        );
        expect(() => validatePropertyValue(123, definition, 'Status')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(['Todo'], definition, 'Status')).toThrow(
          PropertyValidationError
        );
      });
    });

    describe('Multi-Select Property', () => {
      it('should validate multi_select property definition with options', () => {
        const definition: PropertyDefinition = {
          type: 'multi_select',
          options: ['Tag1', 'Tag2', 'Tag3', 'Tag4'],
        };
        const errors = validatePropertyStructure('Tags', definition);
        expect(errors).toHaveLength(0);
      });

      it('should validate multi_select property values', () => {
        const definition: PropertyDefinition = {
          type: 'multi_select',
          options: ['Bug', 'Feature', 'Enhancement', 'Documentation'],
        };

        // Valid values
        expect(() => validatePropertyValue([], definition, 'Tags')).not.toThrow();
        expect(() => validatePropertyValue(['Bug'], definition, 'Tags')).not.toThrow();
        expect(() => validatePropertyValue(['Bug', 'Feature'], definition, 'Tags')).not.toThrow();
        expect(() => validatePropertyValue(null, definition, 'Tags')).not.toThrow();
        expect(() => validatePropertyValue(undefined, definition, 'Tags')).not.toThrow();
      });

      it('should reject invalid multi_select property values', () => {
        const definition: PropertyDefinition = {
          type: 'multi_select',
          options: ['Bug', 'Feature', 'Enhancement', 'Documentation'],
        };

        expect(() => validatePropertyValue(['Invalid Tag'], definition, 'Tags')).toThrow(
          SelectionValidationError
        );
        expect(() => validatePropertyValue(['Bug', 'Invalid Tag'], definition, 'Tags')).toThrow(
          SelectionValidationError
        );
        expect(() => validatePropertyValue('Bug', definition, 'Tags')).toThrow(
          PropertyValidationError
        );
        expect(() => validatePropertyValue(123, definition, 'Tags')).toThrow(
          PropertyValidationError
        );
      });
    });

    describe('Selection Options Validation', () => {
      it('should accept valid selection options', () => {
        const validOptions = [
          ['Option1', 'Option2', 'Option3'],
          ['A', 'B', 'C', 'D'],
          ['Status: Active', 'Status: Inactive'],
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

      it('should reject selection options with duplicates', () => {
        const optionsWithDuplicates = ['Option1', 'Option2', 'Option1', 'Option3'];
        const errors = validateSelectionOptions(optionsWithDuplicates, 'Status');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('must be unique');
      });
    });
  });
  describe('Complex Property Type Guards', () => {
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

    describe('isRollupProperty', () => {
      it('should return true for rollup properties', () => {
        const testRollup = {
          type: 'rollup' as const,
          relation: 'tasks',
          property: 'priority',
          function: 'count' as const,
        };
        expect(isRollupProperty(testRollup)).toBe(true);
        expect(isRollupProperty(rollupProperty)).toBe(true);
      });

      it('should return false for non-rollup properties', () => {
        expect(isRollupProperty(formulaProperty)).toBe(false);
        expect(isRollupProperty(basicProperty)).toBe(false);
        expect(isRollupProperty({ type: 'number' as const })).toBe(false);
      });
    });

    describe('isFormulaProperty', () => {
      it('should return true for formula properties', () => {
        const testFormula = {
          type: 'formula' as const,
          returnType: 'number' as const,
        };
        expect(isFormulaProperty(testFormula)).toBe(true);
        expect(isFormulaProperty(formulaProperty)).toBe(true);
      });

      it('should return true for formula properties with expression', () => {
        const formulaWithExpression = {
          type: 'formula' as const,
          returnType: 'string' as const,
          expression: 'prop("First Name") + " " + prop("Last Name")',
        };
        expect(isFormulaProperty(formulaWithExpression)).toBe(true);
      });

      it('should return false for non-formula properties', () => {
        expect(isFormulaProperty(rollupProperty)).toBe(false);
        expect(isFormulaProperty(basicProperty)).toBe(false);
        expect(isFormulaProperty({ type: 'checkbox' as const })).toBe(false);
      });
    });

    describe('isComplexProperty', () => {
      it('should return true for rollup properties', () => {
        expect(isComplexProperty(rollupProperty)).toBe(true);
      });

      it('should return true for formula properties', () => {
        expect(isComplexProperty(formulaProperty)).toBe(true);
      });

      it('should return false for basic properties', () => {
        expect(isComplexProperty(basicProperty)).toBe(false);
        expect(isComplexProperty({ type: 'number' as const })).toBe(false);
        expect(
          isComplexProperty({
            type: 'select' as const,
            options: ['Option 1'] as const,
          })
        ).toBe(false);
      });
    });
  });

  describe('Property Category Functions', () => {
    describe('isBasicProperty', () => {
      it('should identify basic properties correctly', () => {
        expect(isBasicProperty({ type: 'title' })).toBe(true);
        expect(isBasicProperty({ type: 'number' })).toBe(true);
        expect(isBasicProperty({ type: 'checkbox' })).toBe(true);
        expect(isBasicProperty({ type: 'rich_text' })).toBe(false);
      });
    });

    describe('isTextProperty', () => {
      it('should identify text properties correctly', () => {
        expect(isTextProperty({ type: 'title' })).toBe(true);
        expect(isTextProperty({ type: 'rich_text' })).toBe(true);
        expect(isTextProperty({ type: 'number' })).toBe(false);
      });
    });

    describe('isSelectionProperty', () => {
      it('should identify selection properties correctly', () => {
        expect(
          isSelectionProperty({
            type: 'select',
            options: ['Option1'],
          })
        ).toBe(true);
        expect(
          isSelectionProperty({
            type: 'multi_select',
            options: ['Tag1', 'Tag2'],
          })
        ).toBe(true);
        expect(isSelectionProperty({ type: 'title' })).toBe(false);
      });
    });

    describe('isContactProperty', () => {
      it('should identify contact properties correctly', () => {
        expect(isContactProperty({ type: 'email' })).toBe(true);
        expect(isContactProperty({ type: 'url' })).toBe(true);
        expect(isContactProperty({ type: 'people' })).toBe(true);
        expect(isContactProperty({ type: 'title' })).toBe(false);
      });
    });

    describe('isDateProperty', () => {
      it('should identify date properties correctly', () => {
        expect(isDateProperty({ type: 'date' })).toBe(true);
        expect(isDateProperty({ type: 'title' })).toBe(false);
      });
    });

    describe('getPropertyCategory', () => {
      it('should categorize properties correctly', () => {
        expect(getPropertyCategory({ type: 'title' })).toBe('basic');
        expect(getPropertyCategory({ type: 'rich_text' })).toBe('text');
        expect(
          getPropertyCategory({
            type: 'select',
            options: ['A'],
          })
        ).toBe('selection');
        expect(getPropertyCategory({ type: 'email' })).toBe('contact');
        expect(getPropertyCategory({ type: 'date' })).toBe('date');
        expect(
          getPropertyCategory({
            type: 'rollup',
            relation: 'tasks',
            property: 'title',
            function: 'count',
          })
        ).toBe('complex');
        expect(
          getPropertyCategory({
            type: 'formula',
            returnType: 'string',
          })
        ).toBe('complex');
      });
    });
  });

  describe('Complex Property Definitions', () => {
    it('should create rollup properties with all function types', () => {
      const functions = ['count', 'sum', 'average', 'min', 'max', 'earliest', 'latest'] as const;

      functions.forEach(func => {
        const rollup: RollupProperty = {
          type: 'rollup',
          relation: 'related_table',
          property: 'target_field',
          function: func,
        };

        expect(rollup.type).toBe('rollup');
        expect(rollup.function).toBe(func);
      });
    });

    it('should create formula properties with different return types', () => {
      const returnTypes = ['string', 'number', 'boolean', 'date'] as const;

      returnTypes.forEach(returnType => {
        const formula: FormulaProperty = {
          type: 'formula',
          returnType,
          expression: 'test_expression',
        };

        expect(formula.type).toBe('formula');
        expect(formula.returnType).toBe(returnType);
      });
    });

    it('should support formula properties without expressions', () => {
      const formula: FormulaProperty = {
        type: 'formula',
        returnType: 'number',
      };

      expect(formula.type).toBe('formula');
      expect(formula.returnType).toBe('number');
      expect(formula.expression).toBeUndefined();
    });

    it('should support formula properties with union types', () => {
      const unionFormula: FormulaProperty = {
        type: 'formula',
        returnType: {
          kind: 'union',
          types: ['string', 'number'],
        },
      };

      expect(unionFormula.returnType).toEqual({
        kind: 'union',
        types: ['string', 'number'],
      });
    });
  });
});
