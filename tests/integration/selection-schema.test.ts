/**
 * Integration tests for User Story 2: Text and Selection Schema Workflow
 * 
 * Tests the complete end-to-end workflow for schemas with:
 * 1. Rich text properties
 * 2. Select properties with literal type preservation
 * 3. Multi-select properties with literal type preservation
 * 4. Mixed property type schemas
 * 5. Validation and error handling
 */

import { describe, it, expect } from 'vitest';
import { 
  createTypedSchema, 
  validateSchemaDefinition,
  isValidSchemaDefinition 
} from '../../src/schema/index.js';
import { 
  SchemaValidationError, 
  PropertyAccessError, 
  PropertyValidationError,
  SelectionValidationError 
} from '../../src/errors/index.js';
import type { SchemaDefinition } from '../../src/types/index.js';

describe('Integration Test: Text and Selection Schema Workflow', () => {
  describe('Task Management Schema Workflow', () => {
    it('should complete full workflow for task management with rich text and selections', () => {
      // Step 1: Define a task management schema with text and selection properties
      const taskSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Description: { type: 'rich_text' as const },
          Status: { 
            type: 'select' as const, 
            options: ['Backlog', 'Todo', 'In Progress', 'Review', 'Done'] as const 
          },
          Priority: { 
            type: 'select' as const, 
            options: ['Low', 'Medium', 'High', 'Critical'] as const 
          },
          Tags: { 
            type: 'multi_select' as const,
            options: ['Bug', 'Feature', 'Enhancement', 'Documentation', 'Testing'] as const
          },
          Assignees: { 
            type: 'multi_select' as const,
            options: ['Alice', 'Bob', 'Charlie', 'Diana'] as const
          }
        }
      };

      // Step 2: Validate schema definition
      expect(() => validateSchemaDefinition(taskSchema)).not.toThrow();
      expect(isValidSchemaDefinition(taskSchema)).toBe(true);

      // Step 3: Create typed schema
      const typedSchema = createTypedSchema(taskSchema);
      
      // Step 4: Verify schema structure includes all property types
      expect(typedSchema.databaseId).toBe('12345678-1234-5678-9abc-123456789abc');
      expect(typedSchema.propertyNames).toEqual([
        'Title', 'Description', 'Status', 'Priority', 'Tags', 'Assignees'
      ]);

      // Step 5: Verify text and selection properties are accessible
      expect(typedSchema.hasProperty('Description')).toBe(true);
      expect(typedSchema.hasProperty('Status')).toBe(true);
      expect(typedSchema.hasProperty('Tags')).toBe(true);
      
      // Step 6: Get specific property definitions
      const descriptionProperty = typedSchema.getProperty('Description');
      expect(descriptionProperty.type).toBe('rich_text');

      const statusProperty = typedSchema.getProperty('Status');
      expect(statusProperty.type).toBe('select');
      expect(statusProperty.options).toEqual(['Backlog', 'Todo', 'In Progress', 'Review', 'Done']);

      const tagsProperty = typedSchema.getProperty('Tags');
      expect(tagsProperty.type).toBe('multi_select');
      expect(tagsProperty.options).toEqual(['Bug', 'Feature', 'Enhancement', 'Documentation', 'Testing']);

      // Step 7: Test property filtering by type
      const selectProperties = typedSchema.getPropertiesByType('select');
      expect(selectProperties).toHaveLength(2);
      expect(selectProperties.map(p => p.name)).toEqual(['Status', 'Priority']);

      const multiSelectProperties = typedSchema.getPropertiesByType('multi_select');
      expect(multiSelectProperties).toHaveLength(2);
      expect(multiSelectProperties.map(p => p.name)).toEqual(['Tags', 'Assignees']);

      const richTextProperties = typedSchema.getPropertiesByType('rich_text');
      expect(richTextProperties).toHaveLength(1);
      expect(richTextProperties[0]?.name).toBe('Description');

      // Step 8: Test property value validation with literal types
      const validator = typedSchema.createPropertyValidator();
      
      // Rich text validation
      expect(validator('Description', 'Detailed task description with **formatting**')).toBe(true);
      expect(validator('Description', '')).toBe(true);
      expect(validator('Description', null)).toBe(true);
      expect(validator('Description', 123)).toBe(false);

      // Select validation with literal options
      expect(validator('Status', 'Todo')).toBe(true);
      expect(validator('Status', 'In Progress')).toBe(true);
      expect(validator('Status', 'Done')).toBe(true);
      expect(validator('Status', 'Invalid Status')).toBe(false);
      expect(validator('Status', null)).toBe(true);

      // Multi-select validation with literal options
      expect(validator('Tags', ['Bug'])).toBe(true);
      expect(validator('Tags', ['Bug', 'Feature'])).toBe(true);
      expect(validator('Tags', [])).toBe(true);
      expect(validator('Tags', ['Bug', 'Invalid Tag'])).toBe(false);
      expect(validator('Tags', null)).toBe(true);

      // Step 9: Test performance metrics
      const metrics = typedSchema.getPerformanceMetrics();
      expect(metrics.activeSchemaCount).toBe(1);
      expect(metrics.schemaProcessingTime).toBeGreaterThanOrEqual(0);

      // Step 10: Test JSON serialization includes all properties
      const json = typedSchema.toJSON();
      expect(json.databaseId).toBe(taskSchema.databaseId);
      expect(json.properties).toEqual(taskSchema.properties);
      expect(json.propertyCount).toBe(6);
    });
  });

  describe('Blog Management Schema Workflow', () => {
    it('should handle blog content schema with complex text and selection properties', () => {
      const blogSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Content: { type: 'rich_text' as const },
          Summary: { type: 'rich_text' as const },
          Status: { 
            type: 'select' as const, 
            options: ['Draft', 'Review', 'Published', 'Archived'] as const 
          },
          Categories: { 
            type: 'multi_select' as const,
            options: ['Technology', 'Business', 'Lifestyle', 'Health', 'Education', 'Travel'] as const
          },
          PublishingPlatforms: { 
            type: 'multi_select' as const,
            options: ['Website', 'Medium', 'LinkedIn', 'Twitter', 'Newsletter'] as const
          },
          WordCount: { type: 'number' as const },
          IsFeatured: { type: 'checkbox' as const }
        }
      };

      // Create and validate schema
      expect(isValidSchemaDefinition(blogSchema)).toBe(true);
      const typedSchema = createTypedSchema(blogSchema);

      // Test rich text properties
      expect(typedSchema.getPropertiesByType('rich_text')).toHaveLength(2);
      const textProperties = typedSchema.getPropertiesByType('rich_text');
      expect(textProperties.map(p => p.name)).toEqual(['Content', 'Summary']);

      // Test complex selection workflows
      const validator = typedSchema.createPropertyValidator();
      
      // Complex multi-category selection
      expect(validator('Categories', ['Technology', 'Business'])).toBe(true);
      expect(validator('Categories', ['Technology', 'Health', 'Education'])).toBe(true);
      expect(validator('PublishingPlatforms', ['Website', 'Medium', 'LinkedIn'])).toBe(true);
      
      // Invalid selections should fail
      expect(validator('Categories', ['InvalidCategory'])).toBe(false);
      expect(validator('PublishingPlatforms', ['InvalidPlatform'])).toBe(false);

      // Mixed property type validation
      expect(validator('Content', 'Long form blog content with detailed explanations')).toBe(true);
      expect(validator('Status', 'Published')).toBe(true);
      expect(validator('WordCount', 1500)).toBe(true);
      expect(validator('IsFeatured', true)).toBe(true);
    });
  });

  describe('E-commerce Product Schema Workflow', () => {
    it('should handle product catalog schema with varied selection options', () => {
      const productSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          ProductName: { type: 'title' as const },
          Description: { type: 'rich_text' as const },
          Category: { 
            type: 'select' as const, 
            options: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports & Outdoors'] as const 
          },
          Subcategory: { 
            type: 'select' as const, 
            options: ['Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Cameras'] as const 
          },
          Tags: { 
            type: 'multi_select' as const,
            options: ['New Arrival', 'Best Seller', 'Sale', 'Limited Edition', 'Eco-Friendly'] as const
          },
          Availability: { 
            type: 'select' as const, 
            options: ['In Stock', 'Out of Stock', 'Pre-Order', 'Discontinued'] as const 
          },
          Price: { type: 'number' as const, format: 'dollar' as const },
          IsActive: { type: 'checkbox' as const }
        }
      };

      // Test schema with multiple select properties
      const typedSchema = createTypedSchema(productSchema);
      
      // Verify multiple select properties work correctly
      const selectProperties = typedSchema.getPropertiesByType('select');
      expect(selectProperties).toHaveLength(3);
      expect(selectProperties.map(p => p.name).sort()).toEqual(['Availability', 'Category', 'Subcategory']);

      // Test selection validation across multiple select fields
      const validator = typedSchema.createPropertyValidator();
      expect(validator('Category', 'Electronics')).toBe(true);
      expect(validator('Subcategory', 'Smartphones')).toBe(true);
      expect(validator('Availability', 'In Stock')).toBe(true);
      expect(validator('Tags', ['New Arrival', 'Best Seller'])).toBe(true);

      // Test cross-field validation independence
      expect(validator('Category', 'Electronics')).toBe(true);
      expect(validator('Category', 'Smartphones')).toBe(false); // Wrong field for this value
    });
  });

  describe('Error Handling for Selection Properties', () => {
    it('should handle selection validation errors gracefully', () => {
      const schema = createTypedSchema({
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Status: { 
            type: 'select' as const, 
            options: ['Active', 'Inactive'] as const 
          },
          Tags: { 
            type: 'multi_select' as const,
            options: ['Important', 'Urgent'] as const
          }
        }
      });

      // Test selection validation errors
      const validator = schema.createPropertyValidator();
      
      // Invalid select options should be caught
      expect(validator('Status', 'InvalidStatus')).toBe(false);
      expect(validator('Tags', ['InvalidTag'])).toBe(false);
      expect(validator('Tags', ['Important', 'InvalidTag'])).toBe(false);
    });

    it('should handle malformed selection properties in schema creation', () => {
      // Schema with empty selection options
      const schemaWithEmptyOptions = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Status: { type: 'select' as const, options: [] }
        }
      };

      expect(isValidSchemaDefinition(schemaWithEmptyOptions)).toBe(false);
      expect(() => createTypedSchema(schemaWithEmptyOptions as any)).toThrow(SchemaValidationError);

      // Schema with duplicate selection options
      const schemaWithDuplicates = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Status: { type: 'select' as const, options: ['Todo', 'Done', 'Todo'] }
        }
      };

      expect(isValidSchemaDefinition(schemaWithDuplicates)).toBe(false);
      expect(() => createTypedSchema(schemaWithDuplicates as any)).toThrow(SchemaValidationError);
    });

    it('should handle missing selection options', () => {
      const malformedSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Status: { type: 'select' as const } // Missing options
        }
      };

      expect(isValidSchemaDefinition(malformedSchema)).toBe(false);
      expect(() => createTypedSchema(malformedSchema as any)).toThrow(SchemaValidationError);
    });
  });

  describe('Performance and Scalability for Selection Properties', () => {
    it('should handle schemas with many selection options efficiently', () => {
      // Create schema with many options
      const manyOptions = Array.from({ length: 100 }, (_, i) => `Option${i + 1}`);
      const manySelectOptions = Array.from({ length: 50 }, (_, i) => `Tag${i + 1}`);

      const largeSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Description: { type: 'rich_text' as const },
          LargeSelect: { type: 'select' as const, options: manyOptions as readonly string[] },
          LargeMultiSelect: { type: 'multi_select' as const, options: manySelectOptions as readonly string[] }
        }
      };

      const startTime = Date.now();
      const typedSchema = createTypedSchema(largeSchema);
      const endTime = Date.now();

      // Should create large schemas quickly
      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms

      // Validation should work with many options
      const validator = typedSchema.createPropertyValidator();
      expect(validator('LargeSelect', 'Option1')).toBe(true);
      expect(validator('LargeSelect', 'Option100')).toBe(true);
      expect(validator('LargeSelect', 'InvalidOption')).toBe(false);
      
      expect(validator('LargeMultiSelect', ['Tag1', 'Tag25', 'Tag50'])).toBe(true);
      expect(validator('LargeMultiSelect', ['InvalidTag'])).toBe(false);
    });

    it('should maintain consistent performance across multiple operations', () => {
      const schema = createTypedSchema({
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          Title: { type: 'title' as const },
          Status: { 
            type: 'select' as const, 
            options: ['Todo', 'Doing', 'Done'] as const 
          },
          Tags: { 
            type: 'multi_select' as const,
            options: ['Frontend', 'Backend', 'Mobile', 'Web', 'API'] as const
          }
        }
      });

      const validator = schema.createPropertyValidator();
      
      // Perform many validation operations
      for (let i = 0; i < 1000; i++) {
        expect(validator('Status', 'Todo')).toBe(true);
        expect(validator('Tags', ['Frontend', 'Backend'])).toBe(true);
        expect(schema.hasProperty('Status')).toBe(true);
        expect(schema.getProperty('Tags').type).toBe('multi_select');
      }

      // Schema should remain responsive
      const metrics = schema.getPerformanceMetrics();
      expect(metrics.schemaProcessingTime).toBeLessThan(1000); // Less than 1 second total
    });
  });

  describe('Real-world Selection Schema Scenarios', () => {
    it('should handle CRM contact schema with realistic selection options', () => {
      const crmSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          ContactName: { type: 'title' as const },
          Notes: { type: 'rich_text' as const },
          Status: { 
            type: 'select' as const, 
            options: ['Lead', 'Prospect', 'Customer', 'Inactive'] as const 
          },
          Source: { 
            type: 'select' as const, 
            options: ['Website', 'Referral', 'Social Media', 'Email Campaign', 'Trade Show'] as const 
          },
          Industries: { 
            type: 'multi_select' as const,
            options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing'] as const
          },
          InteractionTypes: { 
            type: 'multi_select' as const,
            options: ['Phone Call', 'Email', 'Meeting', 'Demo', 'Proposal', 'Contract'] as const
          },
          Revenue: { type: 'number' as const, format: 'dollar' as const }
        }
      };

      const typedSchema = createTypedSchema(crmSchema);
      const validator = typedSchema.createPropertyValidator();

      // Realistic CRM workflow validation
      expect(validator('Status', 'Lead')).toBe(true);
      expect(validator('Source', 'Website')).toBe(true);
      expect(validator('Industries', ['Technology', 'Healthcare'])).toBe(true);
      expect(validator('InteractionTypes', ['Phone Call', 'Email', 'Meeting'])).toBe(true);
      
      // Business rule validation
      expect(validator('Status', 'InvalidStatus')).toBe(false);
      expect(validator('Industries', ['NonexistentIndustry'])).toBe(false);
    });

    it('should handle project management schema with complex hierarchical selections', () => {
      const projectSchema = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          ProjectName: { type: 'title' as const },
          Description: { type: 'rich_text' as const },
          Status: { 
            type: 'select' as const, 
            options: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'] as const 
          },
          Priority: { 
            type: 'select' as const, 
            options: ['P0 - Critical', 'P1 - High', 'P2 - Medium', 'P3 - Low'] as const 
          },
          TechnologyStack: { 
            type: 'multi_select' as const,
            options: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Redis', 'AWS'] as const
          },
          TeamRoles: { 
            type: 'multi_select' as const,
            options: ['Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Designer', 'Product Manager'] as const
          }
        }
      };

      const typedSchema = createTypedSchema(projectSchema);
      
      // Test hierarchical option naming
      const validator = typedSchema.createPropertyValidator();
      expect(validator('Priority', 'P0 - Critical')).toBe(true);
      expect(validator('Priority', 'P1 - High')).toBe(true);
      expect(validator('TechnologyStack', ['React', 'TypeScript', 'Node.js'])).toBe(true);
      expect(validator('TeamRoles', ['Frontend Developer', 'Backend Developer', 'Designer'])).toBe(true);

      // Verify schema structure
      const priorityProperty = typedSchema.getProperty('Priority');
      expect(priorityProperty.options).toContain('P0 - Critical');
      expect(priorityProperty.options).toContain('P3 - Low');
    });
  });
});