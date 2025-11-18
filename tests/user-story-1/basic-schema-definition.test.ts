/**
 * User Story 1: Basic Schema Definition - Acceptance Tests
 *
 * Tests the core functionality for creating type-safe schemas with
 * basic property types (title, number, checkbox)
 */

import { describe, it, expect } from 'vitest';
import {
  TypedSchema,
  createTypedSchema,
  validateSchemaDefinition,
} from '../../src/schema/index.js';
import { SchemaValidationError, PropertyAccessError } from '../../src/errors/index.js';
import {
  basicUserSchema,
  minimalSchema,
  financialSchema,
  schemaWithoutTitle,
  schemaWithMultipleTitles,
} from '../fixtures/schemas.js';

describe('User Story 1: Basic Schema Definition', () => {
  describe('Scenario 1.1: Create a basic user schema with title, number, and checkbox', () => {
    it('should create a schema with title, number, and checkbox properties', () => {
      // Given: I want to create a user schema with basic properties
      const schema = createTypedSchema(basicUserSchema);

      // When: I examine the created schema
      // Then: It should have the correct structure
      expect(schema.databaseId).toBe('12345678-1234-5678-9abc-123456789abc');
      expect(schema.propertyNames).toEqual(['Name', 'Age', 'Active']);
      expect(schema.properties.Name).toEqual({ type: 'title' });
      expect(schema.properties.Age).toEqual({ type: 'number' });
      expect(schema.properties.Active).toEqual({ type: 'checkbox' });
    });

    it('should provide type-safe property access', () => {
      // Given: A created schema
      const schema = createTypedSchema(basicUserSchema);

      // When: I access properties
      const nameProperty = schema.getProperty('Name');
      const ageProperty = schema.getProperty('Age');
      const activeProperty = schema.getProperty('Active');

      // Then: Properties should have correct types
      expect(nameProperty.type).toBe('title');
      expect(ageProperty.type).toBe('number');
      expect(activeProperty.type).toBe('checkbox');
    });

    it('should validate property existence', () => {
      // Given: A created schema
      const schema = createTypedSchema(basicUserSchema);

      // When: I check for existing and non-existing properties
      // Then: hasProperty should return correct boolean values
      expect(schema.hasProperty('Name')).toBe(true);
      expect(schema.hasProperty('Age')).toBe(true);
      expect(schema.hasProperty('Active')).toBe(true);
      expect(schema.hasProperty('NonExistent')).toBe(false);
    });

    it('should throw error when accessing non-existent property', () => {
      // Given: A created schema
      const schema = createTypedSchema(basicUserSchema);

      // When/Then: Accessing non-existent property should throw PropertyAccessError
      expect(() => {
        schema.getProperty('NonExistent' as any);
      }).toThrow(PropertyAccessError);
    });
  });

  describe('Scenario 1.2: Create minimal schema with just title property', () => {
    it('should create schema with only title property', () => {
      // Given: I want to create a minimal schema
      const schema = createTypedSchema(minimalSchema);

      // When: I examine the schema
      // Then: It should have only the title property
      expect(schema.databaseId).toBe('87654321-4321-8765-cba9-987654321cba');
      expect(schema.propertyNames).toEqual(['Title']);
      expect(schema.properties.Title).toEqual({ type: 'title' });
    });

    it('should identify the title property correctly', () => {
      // Given: A minimal schema
      const schema = createTypedSchema(minimalSchema);

      // When: I get the title property
      const titleProperty = schema.getTitleProperty();

      // Then: It should return the correct title property
      expect(titleProperty.name).toBe('Title');
      expect(titleProperty.definition.type).toBe('title');
    });
  });

  describe('Scenario 1.3: Create schema with number formatting options', () => {
    it('should create schema with number format options', () => {
      // Given: I want to create a financial schema with number formatting
      const schema = createTypedSchema(financialSchema);

      // When: I examine number properties
      const priceProperty = schema.getProperty('Price');
      const discountProperty = schema.getProperty('Discount');
      const quantityProperty = schema.getProperty('Quantity');

      // Then: Number properties should have correct format options
      expect(priceProperty).toEqual({ type: 'number', format: 'dollar' });
      expect(discountProperty).toEqual({ type: 'number', format: 'percent' });
      expect(quantityProperty).toEqual({ type: 'number', format: 'number' });
    });

    it('should handle number properties without format', () => {
      // Given: A basic schema with unformatted number
      const schema = createTypedSchema(basicUserSchema);

      // When: I examine the number property
      const ageProperty = schema.getProperty('Age');

      // Then: Format should be undefined (default)
      expect(ageProperty).toEqual({ type: 'number' });
      expect('format' in ageProperty).toBe(false);
    });
  });

  describe('Scenario 1.4: Schema validation at creation time', () => {
    it('should validate schema structure successfully', () => {
      // Given: Valid schema definitions
      // When: I validate them
      // Then: They should pass validation without throwing
      expect(() => validateSchemaDefinition(basicUserSchema)).not.toThrow();
      expect(() => validateSchemaDefinition(minimalSchema)).not.toThrow();
      expect(() => validateSchemaDefinition(financialSchema)).not.toThrow();
    });

    it('should reject schema without title property', () => {
      // Given: A schema without title property
      // When/Then: Creating schema should throw SchemaValidationError
      expect(() => {
        createTypedSchema(schemaWithoutTitle as any);
      }).toThrow(SchemaValidationError);
    });

    it('should reject schema with multiple title properties', () => {
      // Given: A schema with multiple title properties
      // When/Then: Creating schema should throw SchemaValidationError
      expect(() => {
        createTypedSchema(schemaWithMultipleTitles as any);
      }).toThrow(SchemaValidationError);
    });

    it('should validate database ID format', () => {
      // Given: Schema with invalid database ID
      const invalidSchema = {
        databaseId: 'not-a-valid-uuid',
        properties: {
          Title: { type: 'title' as const },
        },
      };

      // When/Then: Validation should fail
      expect(() => {
        createTypedSchema(invalidSchema);
      }).toThrow(SchemaValidationError);
    });
  });

  describe('Scenario 1.5: Property filtering and categorization', () => {
    it('should filter properties by type', () => {
      // Given: A schema with multiple property types
      const schema = createTypedSchema(basicUserSchema);

      // When: I filter properties by type
      const titleProperties = schema.getPropertiesByType('title');
      const numberProperties = schema.getPropertiesByType('number');
      const checkboxProperties = schema.getPropertiesByType('checkbox');

      // Then: Each filter should return correct properties
      expect(titleProperties).toHaveLength(1);
      expect(titleProperties[0]?.name).toBe('Name');

      expect(numberProperties).toHaveLength(1);
      expect(numberProperties[0]?.name).toBe('Age');

      expect(checkboxProperties).toHaveLength(1);
      expect(checkboxProperties[0]?.name).toBe('Active');
    });

    it('should return empty array for non-existent property types', () => {
      // Given: A basic schema
      const schema = createTypedSchema(basicUserSchema);

      // When: I filter for property types not in the schema
      const selectProperties = schema.getPropertiesByType('select');

      // Then: Should return empty array
      expect(selectProperties).toHaveLength(0);
    });
  });

  describe('Scenario 1.6: Performance and metrics tracking', () => {
    it('should track schema creation time', () => {
      // Given: I create a schema
      const before = Date.now();
      const schema = createTypedSchema(basicUserSchema);
      const after = Date.now();

      // When: I get performance metrics
      const metrics = schema.getPerformanceMetrics();

      // Then: Creation time should be tracked
      expect(metrics.schemaProcessingTime).toBeGreaterThanOrEqual(0);
      expect(metrics.schemaProcessingTime).toBeLessThan(after - before + 100); // Allow some tolerance
      expect(metrics.activeSchemaCount).toBe(1);
      expect(metrics.lastQueryDuration).toBe(0); // No queries yet
    });

    it('should provide JSON representation', () => {
      // Given: A created schema
      const schema = createTypedSchema(basicUserSchema);

      // When: I convert to JSON
      const json = schema.toJSON();

      // Then: JSON should contain essential information
      expect(json.databaseId).toBe(basicUserSchema.databaseId);
      expect(json.properties).toEqual(basicUserSchema.properties);
      expect(json.propertyCount).toBe(3);
      expect(json.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Scenario 1.7: Property value validation', () => {
    it('should create property validator function', () => {
      // Given: A schema with various property types
      const schema = createTypedSchema(basicUserSchema);
      const validator = schema.createPropertyValidator();

      // When: I validate property values
      // Then: Valid values should pass
      expect(validator('Name', 'John Doe')).toBe(true);
      expect(validator('Age', 25)).toBe(true);
      expect(validator('Active', true)).toBe(true);
      expect(validator('Active', false)).toBe(true);

      // And: Null values should pass (nullable by default)
      expect(validator('Name', null)).toBe(true);
      expect(validator('Age', null)).toBe(true);
      expect(validator('Active', null)).toBe(true);
    });

    it('should reject invalid property values', () => {
      // Given: A schema and validator
      const schema = createTypedSchema(basicUserSchema);
      const validator = schema.createPropertyValidator();

      // When: I validate invalid values
      // Then: They should be rejected
      expect(validator('Name', 123)).toBe(false);
      expect(validator('Age', 'not a number')).toBe(false);
      expect(validator('Active', 'not a boolean')).toBe(false);
    });
  });
});
