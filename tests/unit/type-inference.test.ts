/**
 * Type inference tests using expect-type for User Story 1
 * 
 * Verifies that TypeScript correctly infers types at compile-time:
 * - Property type inference from schema definitions
 * - Schema property mapping with proper typing
 * - Literal type preservation for basic properties
 */

import { describe, it } from 'vitest';
import { expectTypeOf } from 'expect-type';
import type { 
  InferPropertyType, 
  InferSchemaProperties,
  PropertyDefinition,
  SchemaDefinition
} from '../../src/types/index.js';
import { createTypedSchema } from '../../src/schema/index.js';
import { 
  basicUserSchema, 
  minimalSchema, 
  financialSchema 
} from '../fixtures/schemas.js';

describe('Type Inference Tests: User Story 1', () => {
  describe('Property Type Inference', () => {
    it('should infer title property type correctly', () => {
      type TitleProperty = { type: 'title' };
      type InferredType = InferPropertyType<TitleProperty>;
      
      expectTypeOf<InferredType>().toEqualTypeOf<string | null>();
    });

    it('should infer number property type correctly', () => {
      type NumberProperty = { type: 'number' };
      type InferredType = InferPropertyType<NumberProperty>;
      
      expectTypeOf<InferredType>().toEqualTypeOf<number | null>();
    });

    it('should infer number property with format correctly', () => {
      type NumberWithFormat = { type: 'number'; format: 'dollar' };
      type InferredType = InferPropertyType<NumberWithFormat>;
      
      expectTypeOf<InferredType>().toEqualTypeOf<number | null>();
    });

    it('should infer checkbox property type correctly', () => {
      type CheckboxProperty = { type: 'checkbox' };
      type InferredType = InferPropertyType<CheckboxProperty>;
      
      expectTypeOf<InferredType>().toEqualTypeOf<boolean | null>();
    });

    it('should handle all basic property types', () => {
      // Title
      type Title = InferPropertyType<{ type: 'title' }>;
      expectTypeOf<Title>().toEqualTypeOf<string | null>();

      // Rich text
      type RichText = InferPropertyType<{ type: 'rich_text' }>;
      expectTypeOf<RichText>().toEqualTypeOf<string | null>();

      // Number
      type Number = InferPropertyType<{ type: 'number' }>;
      expectTypeOf<Number>().toEqualTypeOf<number | null>();

      // Checkbox
      type Checkbox = InferPropertyType<{ type: 'checkbox' }>;
      expectTypeOf<Checkbox>().toEqualTypeOf<boolean | null>();

      // Date
      type DateProp = InferPropertyType<{ type: 'date' }>;
      expectTypeOf<DateProp>().toEqualTypeOf<Date | null>();

      // URL
      type URL = InferPropertyType<{ type: 'url' }>;
      expectTypeOf<URL>().toEqualTypeOf<string | null>();

      // Email
      type Email = InferPropertyType<{ type: 'email' }>;
      expectTypeOf<Email>().toEqualTypeOf<string | null>();
    });
  });

  describe('Schema Properties Inference', () => {
    it('should infer basic user schema properties correctly', () => {
      type InferredProperties = InferSchemaProperties<typeof basicUserSchema>;
      
      type ExpectedProperties = {
        Name: string | null;
        Age: number | null;
        Active: boolean | null;
      };

      expectTypeOf<InferredProperties>().toEqualTypeOf<ExpectedProperties>();
    });

    it('should infer minimal schema properties correctly', () => {
      type InferredProperties = InferSchemaProperties<typeof minimalSchema>;
      
      type ExpectedProperties = {
        Title: string | null;
      };

      expectTypeOf<InferredProperties>().toEqualTypeOf<ExpectedProperties>();
    });

    it('should infer financial schema properties with formatting correctly', () => {
      type InferredProperties = InferSchemaProperties<typeof financialSchema>;
      
      type ExpectedProperties = {
        Name: string | null;
        Price: number | null;
        Discount: number | null;
        Quantity: number | null;
      };

      expectTypeOf<InferredProperties>().toEqualTypeOf<ExpectedProperties>();
    });

    it('should preserve property names as literal types', () => {
      type BasicUserProperties = InferSchemaProperties<typeof basicUserSchema>;
      
      // Property names should be literal string types, not generic string
      expectTypeOf<keyof BasicUserProperties>().toEqualTypeOf<'Name' | 'Age' | 'Active'>();
    });
  });

  describe('TypedSchema Class Type Inference', () => {
    it('should infer schema types correctly from createTypedSchema', () => {
      const schema = createTypedSchema(basicUserSchema);
      
      // Schema should have correct generic type parameter
      expectTypeOf(schema).toMatchTypeOf<{ 
        databaseId: string;
        properties: typeof basicUserSchema.properties;
      }>();
      
      // Property getters should return correct types
      expectTypeOf(schema.getProperty('Name')).toEqualTypeOf<{ type: 'title' }>();
      expectTypeOf(schema.getProperty('Age')).toEqualTypeOf<{ type: 'number' }>();
      expectTypeOf(schema.getProperty('Active')).toEqualTypeOf<{ type: 'checkbox' }>();
    });

    it('should provide type-safe property access', () => {
      const schema = createTypedSchema(basicUserSchema);
      
      // Valid property access should be allowed
      expectTypeOf(schema.getProperty('Name')).toMatchTypeOf<PropertyDefinition>();
      expectTypeOf(schema.getProperty('Age')).toMatchTypeOf<PropertyDefinition>();
      expectTypeOf(schema.getProperty('Active')).toMatchTypeOf<PropertyDefinition>();
      
      // Property names should be type-checked
      expectTypeOf<Parameters<typeof schema.getProperty>[0]>()
        .toEqualTypeOf<'Name' | 'Age' | 'Active'>();
    });

    it('should infer property validator types correctly', () => {
      const schema = createTypedSchema(basicUserSchema);
      const validator = schema.createPropertyValidator();
      
      // Validator should accept schema property names
      expectTypeOf<Parameters<typeof validator>[0]>()
        .toEqualTypeOf<'Name' | 'Age' | 'Active'>();
      
      // Return type should be type guard
      const result = validator('Name', 'test');
      expectTypeOf(result).toEqualTypeOf<boolean>();
    });
  });

  describe('Property Definition Type Constraints', () => {
    it('should enforce proper property definition structure', () => {
      // Valid property definitions
      expectTypeOf<{ type: 'title' }>().toMatchTypeOf<PropertyDefinition>();
      expectTypeOf<{ type: 'number' }>().toMatchTypeOf<PropertyDefinition>();
      expectTypeOf<{ type: 'number'; format: 'dollar' }>().toMatchTypeOf<PropertyDefinition>();
      expectTypeOf<{ type: 'checkbox' }>().toMatchTypeOf<PropertyDefinition>();
      
      // Format should be constrained for number properties
      type NumberFormat = Extract<PropertyDefinition, { type: 'number' }>['format'];
      expectTypeOf<NumberFormat>().toEqualTypeOf<'number' | 'percent' | 'dollar' | undefined>();
    });

    it('should enforce schema definition structure', () => {
      type ValidSchema = {
        databaseId: string;
        properties: {
          Title: { type: 'title' };
          Count: { type: 'number' };
        };
      };

      expectTypeOf<ValidSchema>().toMatchTypeOf<SchemaDefinition>();
    });

    it('should handle readonly property constraints', () => {
      // Schema properties should be readonly
      type Schema = typeof basicUserSchema;
      expectTypeOf<Schema['properties']>().toMatchTypeOf<Readonly<Record<string, PropertyDefinition>>>();
      
      // Individual properties should be readonly
      type NameProperty = Schema['properties']['Name'];
      expectTypeOf<NameProperty>().toMatchTypeOf<Readonly<{ type: 'title' }>>();
    });
  });

  describe('Utility Type Functions', () => {
    it('should infer correct types for type guard functions', () => {
      // Type guards should return boolean
      expectTypeOf<ReturnType<typeof createTypedSchema>>().toMatchTypeOf<{
        hasProperty(name: string): boolean;
      }>();
    });

    it('should preserve const assertions in schemas', () => {
      // Const assertions should preserve literal types
      const constSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Status: { type: 'title' }
        }
      } as const;

      type InferredConstSchema = InferSchemaProperties<typeof constSchema>;
      expectTypeOf<InferredConstSchema>().toEqualTypeOf<{
        Status: string | null;
      }>();
    });
  });

  describe('Error Type Safety', () => {
    it('should catch type errors at compile time', () => {
      const schema = createTypedSchema(basicUserSchema);
      
      // These should cause TypeScript errors (commented out to prevent compilation errors)
      // schema.getProperty('NonExistentProperty'); // TS Error: Argument not assignable
      // schema.getProperty(123); // TS Error: Argument not assignable
      
      // But these should be valid
      expectTypeOf(schema.getProperty).parameter(0).toEqualTypeOf<'Name' | 'Age' | 'Active'>();
    });

    it('should provide proper return types for property access', () => {
      const schema = createTypedSchema(basicUserSchema);
      
      // Properties should have specific types
      const nameProperty = schema.getProperty('Name');
      expectTypeOf(nameProperty.type).toEqualTypeOf<'title'>();
      
      const ageProperty = schema.getProperty('Age');  
      expectTypeOf(ageProperty.type).toEqualTypeOf<'number'>();
      
      const activeProperty = schema.getProperty('Active');
      expectTypeOf(activeProperty.type).toEqualTypeOf<'checkbox'>();
    });
  });

  describe('Complex Schema Type Inference', () => {
    it('should handle schemas with all basic property types', () => {
      const complexSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' },
          Description: { type: 'rich_text' },
          Age: { type: 'number' },
          Price: { type: 'number', format: 'dollar' },
          Active: { type: 'checkbox' },
          Birthday: { type: 'date' },
          Website: { type: 'url' },
          Email: { type: 'email' }
        }
      } as const;

      type InferredComplex = InferSchemaProperties<typeof complexSchema>;
      
      expectTypeOf<InferredComplex>().toEqualTypeOf<{
        Title: string | null;
        Description: string | null;
        Age: number | null;
        Price: number | null;
        Active: boolean | null;
        Birthday: Date | null;
        Website: string | null;
        Email: string | null;
      }>();
    });

    it('should maintain type safety with deep property access', () => {
      const schema = createTypedSchema(basicUserSchema);
      
      // Deep property access should maintain types
      const titleProperty = schema.getTitleProperty();
      expectTypeOf(titleProperty.name).toEqualTypeOf<'Name' | 'Age' | 'Active'>();
      expectTypeOf(titleProperty.definition.type).toEqualTypeOf<'title'>();
    });
  });
});