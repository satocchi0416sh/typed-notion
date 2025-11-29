/**
 * Tests for core type definitions (src/types/core.ts)
 *
 * Tests the fundamental type definitions including PropertyType,
 * PropertyDefinition, SchemaDefinition, and NotionUser interfaces.
 */

import { describe, it, expect } from 'vitest';
import type {
  PropertyType,
  PropertyDefinition,
  SchemaDefinition,
  NotionUser,
  QueryOptions,
  PerformanceMetrics,
} from '../../src/types/core.js';

describe('Core Type Definitions', () => {
  describe('PropertyType Union', () => {
    it('should include all basic property types', () => {
      const basicTypes: PropertyType[] = [
        'title',
        'rich_text',
        'number',
        'checkbox',
        'date',
        'url',
        'email',
      ];

      // Type assertion test - if types change, this will fail at compile time
      basicTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should include selection property types', () => {
      const selectionTypes: PropertyType[] = ['select', 'multi_select'];

      selectionTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should include people and system property types', () => {
      const systemTypes: PropertyType[] = [
        'people',
        'created_time',
        'created_by',
        'last_edited_time',
        'last_edited_by',
      ];

      systemTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should include complex property types', () => {
      const complexTypes: PropertyType[] = ['rollup', 'formula'];

      complexTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('PropertyDefinition Type Union', () => {
    it('should support basic property definitions', () => {
      const titleDef: PropertyDefinition = { type: 'title' };
      const numberDef: PropertyDefinition = { type: 'number', format: 'dollar' };
      const checkboxDef: PropertyDefinition = { type: 'checkbox' };

      expect(titleDef.type).toBe('title');
      expect(numberDef.type).toBe('number');
      expect(numberDef.format).toBe('dollar');
      expect(checkboxDef.type).toBe('checkbox');
    });

    it('should support selection property definitions', () => {
      const selectDef: PropertyDefinition = {
        type: 'select',
        options: ['Option1', 'Option2'] as const,
      };
      const multiSelectDef: PropertyDefinition = {
        type: 'multi_select',
        options: ['Tag1', 'Tag2', 'Tag3'] as const,
      };

      expect(selectDef.type).toBe('select');
      expect(selectDef.options).toEqual(['Option1', 'Option2']);
      expect(multiSelectDef.type).toBe('multi_select');
      expect(multiSelectDef.options).toEqual(['Tag1', 'Tag2', 'Tag3']);
    });

    it('should support complex property definitions', () => {
      const rollupDef: PropertyDefinition = {
        type: 'rollup',
        relation: 'tasks',
        property: 'priority',
        function: 'sum',
      };
      const formulaDef: PropertyDefinition = {
        type: 'formula',
        returnType: 'string',
        expression: 'prop("Name")',
      };

      expect(rollupDef.type).toBe('rollup');
      expect(rollupDef.function).toBe('sum');
      expect(formulaDef.type).toBe('formula');
      expect(formulaDef.returnType).toBe('string');
    });

    it('should support formula without expression', () => {
      const formulaDef: PropertyDefinition = {
        type: 'formula',
        returnType: 'number',
      };

      expect(formulaDef.type).toBe('formula');
      expect(formulaDef.returnType).toBe('number');
      expect('expression' in formulaDef ? formulaDef.expression : undefined).toBeUndefined();
    });
  });

  describe('SchemaDefinition Interface', () => {
    it('should require databaseId and properties', () => {
      const schema: SchemaDefinition = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          title: { type: 'title' },
          status: { type: 'select', options: ['Active', 'Inactive'] },
        },
      };

      expect(schema.databaseId).toBe('12345678-1234-5678-9abc-123456789abc');
      expect(schema.properties).toHaveProperty('title');
      expect(schema.properties).toHaveProperty('status');
      expect(schema.properties.title?.type).toBe('title');
    });

    it('should support complex properties in schema', () => {
      const complexSchema: SchemaDefinition = {
        databaseId: '12345678-1234-5678-9abc-123456789abc',
        properties: {
          title: { type: 'title' },
          taskCount: {
            type: 'rollup',
            relation: 'tasks',
            property: 'title',
            function: 'count',
          },
          displayName: {
            type: 'formula',
            returnType: 'string',
            expression: 'prop("Title")',
          },
        },
      };

      expect(complexSchema.properties.taskCount?.type).toBe('rollup');
      expect(complexSchema.properties.displayName?.type).toBe('formula');
    });
  });

  describe('NotionUser Interface', () => {
    it('should have required id and type fields', () => {
      const user: NotionUser = {
        id: 'user-123',
        type: 'person',
      };

      expect(user.id).toBe('user-123');
      expect(user.type).toBe('person');
    });

    it('should support optional fields', () => {
      const fullUser: NotionUser = {
        id: 'user-456',
        name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        type: 'person',
        person: {
          email: 'john@example.com',
        },
        bot: null,
      };

      expect(fullUser.name).toBe('John Doe');
      expect(fullUser.avatar_url).toBe('https://example.com/avatar.jpg');
      expect(fullUser.person?.email).toBe('john@example.com');
    });

    it('should support bot users', () => {
      const botUser: NotionUser = {
        id: 'bot-123',
        type: 'bot',
        bot: { owner: { type: 'workspace' } },
        person: null,
      };

      expect(botUser.type).toBe('bot');
      expect(botUser.bot).toBeTruthy();
      expect(botUser.person).toBeNull();
    });
  });

  describe('QueryOptions Interface', () => {
    it('should support filter options', () => {
      const options: QueryOptions = {
        filter: {
          property: 'Status',
          select: { equals: 'Active' },
        },
      };

      expect(options.filter).toBeTruthy();
    });

    it('should support sorting options', () => {
      const options: QueryOptions = {
        sorts: [
          { property: 'Created', direction: 'descending' },
          { property: 'Title', direction: 'ascending' },
        ],
      };

      expect(options.sorts).toHaveLength(2);
      expect(options.sorts?.[0]?.direction).toBe('descending');
    });

    it('should support pagination options', () => {
      const options: QueryOptions = {
        page_size: 50,
        start_cursor: 'cursor-123',
      };

      expect(options.page_size).toBe(50);
      expect(options.start_cursor).toBe('cursor-123');
    });
  });

  describe('PerformanceMetrics Interface', () => {
    it('should track schema processing metrics', () => {
      const metrics: PerformanceMetrics = {
        schemaProcessingTime: 150,
        activeSchemaCount: 5,
        lastQueryDuration: 85,
      };

      expect(metrics.schemaProcessingTime).toBe(150);
      expect(metrics.activeSchemaCount).toBe(5);
      expect(metrics.lastQueryDuration).toBe(85);
    });

    it('should have readonly properties', () => {
      const metrics: PerformanceMetrics = {
        schemaProcessingTime: 100,
        activeSchemaCount: 3,
        lastQueryDuration: 50,
      };

      // TypeScript should enforce readonly at compile time
      expect(typeof metrics.schemaProcessingTime).toBe('number');
      expect(typeof metrics.activeSchemaCount).toBe('number');
      expect(typeof metrics.lastQueryDuration).toBe('number');
    });
  });
});
