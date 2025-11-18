/**
 * Integration tests for User Story 1: Basic Schema Workflow
 *
 * Tests the complete end-to-end workflow of:
 * 1. Creating a schema with basic properties
 * 2. Validating the schema structure
 * 3. Accessing properties with type safety
 * 4. Validating property values
 * 5. Error handling and edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  createTypedSchema,
  validateSchemaDefinition,
  isValidSchemaDefinition,
} from '../../src/schema/index.js';
import {
  SchemaValidationError,
  PropertyAccessError,
  PropertyValidationError,
} from '../../src/errors/index.js';
import type { SchemaDefinition } from '../../src/types/index.js';

describe('Integration Test: Basic Schema Workflow', () => {
  describe('Complete User Schema Workflow', () => {
    it('should complete full workflow for user management schema', () => {
      // Step 1: Define a user management schema
      const userSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          FullName: { type: 'title' as const },
          Age: { type: 'number' as const },
          IsActive: { type: 'checkbox' as const },
          LastUpdated: { type: 'date' as const },
          Email: { type: 'email' as const },
          ProfileUrl: { type: 'url' as const },
        },
      };

      // Step 2: Validate schema definition
      expect(() => validateSchemaDefinition(userSchema)).not.toThrow();
      expect(isValidSchemaDefinition(userSchema)).toBe(true);

      // Step 3: Create typed schema
      const typedSchema = createTypedSchema(userSchema);

      // Step 4: Verify schema structure
      expect(typedSchema.databaseId).toBe('12345678-1234-5678-9abc-123456789abc');
      expect(typedSchema.propertyNames).toEqual([
        'FullName',
        'Age',
        'IsActive',
        'LastUpdated',
        'Email',
        'ProfileUrl',
      ]);

      // Step 5: Verify property access works
      expect(typedSchema.hasProperty('FullName')).toBe(true);
      expect(typedSchema.hasProperty('NonExistent')).toBe(false);

      // Step 6: Get specific properties
      const nameProperty = typedSchema.getProperty('FullName');
      expect(nameProperty.type).toBe('title');

      const ageProperty = typedSchema.getProperty('Age');
      expect(ageProperty.type).toBe('number');

      const activeProperty = typedSchema.getProperty('IsActive');
      expect(activeProperty.type).toBe('checkbox');

      // Step 7: Verify title property detection
      const titleProperty = typedSchema.getTitleProperty();
      expect(titleProperty.name).toBe('FullName');
      expect(titleProperty.definition.type).toBe('title');

      // Step 8: Test property filtering
      const titleProperties = typedSchema.getPropertiesByType('title');
      expect(titleProperties).toHaveLength(1);
      expect(titleProperties[0]?.name).toBe('FullName');

      const numberProperties = typedSchema.getPropertiesByType('number');
      expect(numberProperties).toHaveLength(1);
      expect(numberProperties[0]?.name).toBe('Age');

      // Step 9: Test property value validation
      const validator = typedSchema.createPropertyValidator();

      // Valid values
      expect(validator('FullName', 'John Doe')).toBe(true);
      expect(validator('Age', 30)).toBe(true);
      expect(validator('IsActive', true)).toBe(true);
      expect(validator('Email', 'john@example.com')).toBe(true);

      // Null values (should be valid)
      expect(validator('FullName', null)).toBe(true);
      expect(validator('Age', null)).toBe(true);
      expect(validator('IsActive', null)).toBe(true);

      // Invalid values
      expect(validator('FullName', 123)).toBe(false);
      expect(validator('Age', 'thirty')).toBe(false);
      expect(validator('IsActive', 'yes')).toBe(false);

      // Step 10: Test performance metrics
      const metrics = typedSchema.getPerformanceMetrics();
      expect(metrics.activeSchemaCount).toBe(1);
      expect(metrics.schemaProcessingTime).toBeGreaterThanOrEqual(0);
      expect(metrics.lastQueryDuration).toBe(0);

      // Step 11: Test JSON serialization
      const json = typedSchema.toJSON();
      expect(json.databaseId).toBe(userSchema.databaseId);
      expect(json.properties).toEqual(userSchema.properties);
      expect(json.propertyCount).toBe(6);
    });
  });

  describe('Financial Schema Workflow', () => {
    it('should handle financial schema with number formatting', () => {
      const financialSchema = {
        databaseId: '87654321-4321-8765-cba9-987654321cba',
        properties: {
          ProductName: { type: 'title' as const },
          Price: { type: 'number' as const, format: 'dollar' as const },
          DiscountRate: { type: 'number' as const, format: 'percent' as const },
          Stock: { type: 'number' as const, format: 'number' as const },
          InStock: { type: 'checkbox' as const },
        },
      };

      // Create and validate schema
      expect(isValidSchemaDefinition(financialSchema)).toBe(true);
      const typedSchema = createTypedSchema(financialSchema);

      // Verify number formatting options are preserved
      const priceProperty = typedSchema.getProperty('Price');
      expect(priceProperty).toEqual({ type: 'number', format: 'dollar' });

      const discountProperty = typedSchema.getProperty('DiscountRate');
      expect(discountProperty).toEqual({ type: 'number', format: 'percent' });

      const stockProperty = typedSchema.getProperty('Stock');
      expect(stockProperty).toEqual({ type: 'number', format: 'number' });

      // Test number validation with different formats
      const validator = typedSchema.createPropertyValidator();
      expect(validator('Price', 99.99)).toBe(true);
      expect(validator('DiscountRate', 0.15)).toBe(true);
      expect(validator('Stock', 100)).toBe(true);

      // Format doesn't affect runtime validation
      expect(validator('Price', 'invalid')).toBe(false);
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle schema validation errors gracefully', () => {
      // Schema without title property
      const invalidSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Age: { type: 'number' as const },
          Active: { type: 'checkbox' as const },
        },
      };

      // Validation should fail
      expect(isValidSchemaDefinition(invalidSchema)).toBe(false);

      // Creating schema should throw
      expect(() => createTypedSchema(invalidSchema as any)).toThrow(SchemaValidationError);

      try {
        createTypedSchema(invalidSchema as any);
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError);
        const schemaError = error as SchemaValidationError;
        expect(schemaError.code).toBe('SCHEMA_VALIDATION_ERROR');
        expect(schemaError.context.property).toBe('schema');
      }
    });

    it('should handle property access errors', () => {
      const validSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
        },
      };

      const typedSchema = createTypedSchema(validSchema);

      // Valid property access should work
      expect(() => typedSchema.getProperty('Title')).not.toThrow();

      // Invalid property access should throw
      expect(() => typedSchema.getProperty('NonExistent' as any)).toThrow(PropertyAccessError);

      try {
        typedSchema.getProperty('NonExistent' as any);
      } catch (error) {
        expect(error).toBeInstanceOf(PropertyAccessError);
        const accessError = error as PropertyAccessError;
        expect(accessError.code).toBe('PROPERTY_ACCESS_ERROR');
        expect(accessError.context.property).toBe('NonExistent');
        expect(accessError.context.schema).toBe(validSchema.databaseId);
      }
    });

    it('should handle invalid database ID formats', () => {
      const invalidIdSchema = {
        databaseId: 'not-a-valid-uuid',
        properties: {
          Title: { type: 'title' as const },
        },
      };

      expect(isValidSchemaDefinition(invalidIdSchema)).toBe(false);
      expect(() => createTypedSchema(invalidIdSchema)).toThrow(SchemaValidationError);
    });

    it('should handle malformed property definitions', () => {
      const malformedSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          BadProperty: { type: 'unknown_type' } as any,
        },
      };

      expect(isValidSchemaDefinition(malformedSchema)).toBe(false);
      expect(() => createTypedSchema(malformedSchema)).toThrow(SchemaValidationError);
    });
  });

  describe('Edge Cases Workflow', () => {
    it('should handle minimal valid schema', () => {
      const minimalSchema = {
        databaseId: '00000000-1111-2222-3333-444444444444',
        properties: {
          OnlyTitle: { type: 'title' as const },
        },
      };

      expect(isValidSchemaDefinition(minimalSchema)).toBe(true);
      const typedSchema = createTypedSchema(minimalSchema);

      expect(typedSchema.propertyNames).toEqual(['OnlyTitle']);
      expect(typedSchema.getTitleProperty().name).toBe('OnlyTitle');

      // Should have exactly one property of each type we filter for
      expect(typedSchema.getPropertiesByType('title')).toHaveLength(1);
      expect(typedSchema.getPropertiesByType('number')).toHaveLength(0);
      expect(typedSchema.getPropertiesByType('checkbox')).toHaveLength(0);
    });

    it('should handle schema with maximum allowed properties', () => {
      // Create schema with 20 properties (the maximum)
      const properties: Record<string, any> = {
        Title: { type: 'title' },
      };

      for (let i = 1; i < 20; i++) {
        properties[`Property${i}`] = { type: 'number' };
      }

      const maxPropsSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties,
      };

      expect(isValidSchemaDefinition(maxPropsSchema)).toBe(true);
      const typedSchema = createTypedSchema(maxPropsSchema);

      expect(typedSchema.propertyNames).toHaveLength(20);
      expect(typedSchema.getPropertiesByType('title')).toHaveLength(1);
      expect(typedSchema.getPropertiesByType('number')).toHaveLength(19);
    });

    it('should handle property names with various valid formats', () => {
      const specialNamesSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          'Property Name': { type: 'number' as const }, // Space
          Property_123: { type: 'checkbox' as const }, // Underscore and numbers
          A: { type: 'date' as const }, // Single character
          VeryLongPropertyNameThatIsStillValid: { type: 'email' as const },
        },
      };

      expect(isValidSchemaDefinition(specialNamesSchema)).toBe(true);
      const typedSchema = createTypedSchema(specialNamesSchema);

      expect(typedSchema.hasProperty('Property Name')).toBe(true);
      expect(typedSchema.hasProperty('Property_123')).toBe(true);
      expect(typedSchema.hasProperty('A')).toBe(true);
      expect(typedSchema.hasProperty('VeryLongPropertyNameThatIsStillValid')).toBe(true);
    });
  });

  describe('Performance and Memory Workflow', () => {
    it('should handle multiple schema instances efficiently', () => {
      const schemas = [];
      const startTime = Date.now();

      // Create multiple schema instances
      for (let i = 0; i < 10; i++) {
        const schema = createTypedSchema({
          databaseId: `${i.toString().padStart(8, '0')}-1234-5678-9abc-123456789abc`,
          properties: {
            Title: { type: 'title' as const },
            Number: { type: 'number' as const },
            Flag: { type: 'checkbox' as const },
          },
        });
        schemas.push(schema);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should create schemas quickly
      expect(totalTime).toBeLessThan(100); // Less than 100ms for 10 schemas

      // Each schema should function independently
      for (const schema of schemas) {
        expect(schema.propertyNames).toEqual(['Title', 'Number', 'Flag']);
        expect(schema.hasProperty('Title')).toBe(true);

        const metrics = schema.getPerformanceMetrics();
        expect(metrics.activeSchemaCount).toBe(1); // Each tracks itself only
      }
    });

    it('should maintain consistent behavior across operations', () => {
      const schema = createTypedSchema({
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Name: { type: 'title' as const },
          Score: { type: 'number' as const },
          Active: { type: 'checkbox' as const },
        },
      });

      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        expect(schema.hasProperty('Name')).toBe(true);
        expect(schema.getProperty('Score').type).toBe('number');
        expect(schema.getTitleProperty().name).toBe('Name');
      }

      // Properties should still be accessible correctly
      expect(schema.propertyNames).toHaveLength(3);
      const validator = schema.createPropertyValidator();
      expect(validator('Score', 42)).toBe(true);
    });
  });
});
