/**
 * Performance benchmarks for query operations
 *
 * Tests the performance characteristics of the NotionClient
 * and related components under various load scenarios.
 */

import { bench, describe } from 'vitest';
import { NotionClient } from '../../src/client/notion-client.js';
import { createTypedSchema } from '../../src/schema/typed-schema.js';
import {
  FilterBuilder,
  FilterValidator,
  FilterConverter,
  NotionFilter,
} from '../../src/client/filters.js';
import {
  TitleExtractor,
  RichTextExtractor,
  NumberExtractor,
  CheckboxExtractor,
  SelectExtractor,
  MultiSelectExtractor,
} from '../../src/conversion/property-extractors.js';
import {
  createMockNotionClient,
  createMockPage,
  mockPropertyValues,
  generateTestArray,
} from '../utils/test-data-generators.js';
import { measureAsyncPerformance, measureSyncPerformance } from '../utils/custom-matchers.js';

// Mock setup
const mockClient = createMockNotionClient();
const testSchema = createTypedSchema({
  databaseId: 'test-db',
  properties: {
    title: { type: 'title' },
    status: { type: 'select', options: ['Active', 'Inactive'] as const },
    count: { type: 'number' },
    tags: { type: 'multi_select', options: ['feature', 'bug', 'enhancement'] as const },
    completed: { type: 'checkbox' },
  },
} as const);

describe('Query Performance Benchmarks', () => {
  describe('NotionClient Query Operations', () => {
    bench('Query with simple filter - 100 results', async () => {
      const pages = generateTestArray(() => createMockPage(), 100);
      mockClient.databases.query.mockResolvedValueOnce({
        results: pages,
        next_cursor: null,
        has_more: false,
        type: 'page_or_database',
        page_or_database: {},
      });

      const client = new NotionClient({ auth: 'test' });
      await client.query(testSchema, {
        filter: {
          property: 'status',
          select: { equals: 'Active' },
        },
      });
    });

    bench('Query with complex filter - 1000 results', async () => {
      const pages = generateTestArray(() => createMockPage(), 1000);
      mockClient.databases.query.mockResolvedValueOnce({
        results: pages,
        next_cursor: null,
        has_more: false,
        type: 'page_or_database',
        page_or_database: {},
      });

      const client = new NotionClient({ auth: 'test' });
      await client.query(testSchema, {
        filter: {
          and: [
            {
              property: 'status',
              select: { equals: 'Active' },
            },
            {
              property: 'completed',
              checkbox: { equals: false },
            },
            {
              or: [
                {
                  property: 'tags',
                  multi_select: { contains: 'feature' },
                },
                {
                  property: 'tags',
                  multi_select: { contains: 'bug' },
                },
              ],
            },
          ],
        },
        sorts: [
          { property: 'count', direction: 'descending' },
          { property: 'title', direction: 'ascending' },
        ],
      });
    });

    bench('Bulk create operations - 50 pages', async () => {
      mockClient.pages.create.mockImplementation(() => Promise.resolve(createMockPage()));

      const client = new NotionClient({ auth: 'test' });
      const createPromises = Array.from({ length: 50 }, (_, i) =>
        client.create(testSchema, {
          title: `Page ${i}`,
          status: 'Active',
          count: i,
        })
      );

      await Promise.all(createPromises);
    });

    bench('Sequential vs Parallel operations', async () => {
      mockClient.pages.create.mockImplementation(() => Promise.resolve(createMockPage()));
      mockClient.databases.query.mockImplementation(() =>
        Promise.resolve({
          results: generateTestArray(() => createMockPage(), 10),
          next_cursor: null,
          has_more: false,
          type: 'page_or_database',
          page_or_database: {},
        })
      );

      const client = new NotionClient({ auth: 'test' });

      // Mixed operations in parallel
      await Promise.all([
        client.create(testSchema, { title: 'Task 1', status: 'Active' }),
        client.query(testSchema),
        client.create(testSchema, { title: 'Task 2', status: 'Inactive' }),
        client.query(testSchema, {
          filter: {
            property: 'status',
            select: { equals: 'Active' },
          },
        }),
      ]);
    });
  });

  describe('Filter System Performance', () => {
    bench('FilterBuilder - Simple chain (10 conditions)', () => {
      const builder = new FilterBuilder({ definition: testSchema.definition });

      let filter = builder;
      for (let i = 0; i < 10; i++) {
        filter = filter.where('count', { greater_than: i });
      }

      filter.build();
    });

    bench('FilterBuilder - Complex nested filters', () => {
      const builder = new FilterBuilder({ definition: testSchema.definition });

      builder
        .where('status', { equals: 'Active' })
        .and({
          or: [
            {
              property: 'tags',
              multi_select: { contains: 'feature' },
            },
            {
              property: 'tags',
              multi_select: { contains: 'bug' },
            },
          ],
        })
        .and({
          and: [
            {
              property: 'count',
              number: { greater_than: 5 },
            },
            {
              property: 'completed',
              checkbox: { equals: false },
            },
          ],
        })
        .build();
    });

    bench('Filter validation - 100 filters', () => {
      const validator = new FilterValidator({ definition: testSchema.definition });

      const filters = generateTestArray(
        () => ({
          property: 'status',
          select: { equals: 'Active' },
        }),
        100
      );

      filters.forEach(_filter =>
        validator.validate({
          property: 'status',
          select: { equals: 'Active' },
        })
      );
    });

    bench('Filter conversion - 100 filters', () => {
      const converter = new FilterConverter<typeof testSchema.definition>();

      const filters = generateTestArray(
        () => ({
          property: 'status',
          select: { equals: 'Active' },
        }),
        100
      );

      filters.forEach(_filter =>
        converter.toNotionFilter({
          property: 'status',
          select: { equals: 'Active' },
        } as NotionFilter<typeof testSchema.definition>)
      );
    });
  });

  describe('Property Extraction Performance', () => {
    bench('Extract title from 1000 pages', () => {
      const extractor = new TitleExtractor();

      const properties = generateTestArray(
        () => mockPropertyValues.title(`Title ${Math.random()}`),
        1000
      );

      properties.forEach(prop => extractor.extract(prop));
    });

    bench('Extract rich text with large content', () => {
      const extractor = new RichTextExtractor();

      const largeContent = 'x'.repeat(50000); // 50KB of text
      const property = mockPropertyValues.rich_text(largeContent);

      extractor.extract(property);
    });

    bench('Extract multi-select with many options', () => {
      const extractor = new MultiSelectExtractor();

      const manyOptions = Array.from({ length: 1000 }, (_, i) => `option-${i}`);
      const property = mockPropertyValues.multi_select(manyOptions);

      extractor.extract(property);
    });

    bench('Mixed property extraction - realistic page', () => {
      const extractors = {
        title: new TitleExtractor(),
        richText: new RichTextExtractor(),
        number: new NumberExtractor(),
        checkbox: new CheckboxExtractor(),
        select: new SelectExtractor(),
        multiSelect: new MultiSelectExtractor(),
      };

      const properties = {
        title: mockPropertyValues.title('Complex Page Title'),
        description: mockPropertyValues.rich_text(
          'Long description with multiple paragraphs...'.repeat(100)
        ),
        count: mockPropertyValues.number(42),
        completed: mockPropertyValues.checkbox(true),
        status: mockPropertyValues.select('Active'),
        tags: mockPropertyValues.multi_select(['feature', 'urgent', 'backend']),
      };

      Object.entries(properties).forEach(([name, prop]) => {
        const extractor = extractors[name as keyof typeof extractors];
        if (extractor) {
          extractor.extract(prop);
        }
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    bench('Memory usage - Large dataset processing', () => {
      const pages = generateTestArray(
        () => ({
          id: `page-${Math.random()}`,
          properties: {
            title: mockPropertyValues.title(`Title ${Math.random()}`),
            description: mockPropertyValues.rich_text('Description '.repeat(100)),
            tags: mockPropertyValues.multi_select(['tag1', 'tag2', 'tag3']),
          },
        }),
        10000
      );

      // Simulate processing large dataset
      const processed = pages.map(page => ({
        ...page,
        processed: true,
        timestamp: Date.now(),
      }));

      // Force memory usage calculation
      JSON.stringify(processed);
    });

    bench('Schema validation caching', () => {
      const schemas = generateTestArray(
        () =>
          createTypedSchema({
            databaseId: `db-${Math.random()}`,
            properties: {
              [`prop_${Math.random()}`]: { type: 'title' },
              [`select_${Math.random()}`]: { type: 'select', options: ['a', 'b', 'c'] as const },
            },
          } as const),
        100
      );

      // Simulate repeated validation calls (should hit cache)
      schemas.forEach(schema => {
        for (let i = 0; i < 5; i++) {
          schema.validate({ title: `Test ${i}` });
        }
      });
    });
  });

  describe('Rate Limiting and Retry Performance', () => {
    bench('Rate limiting queue - 100 concurrent requests', async () => {
      const client = new NotionClient({
        auth: 'test',
        retryDelayMs: 1, // Minimal delay for benchmarking
      });

      mockClient.databases.query.mockImplementation(() =>
        Promise.resolve({
          results: [],
          next_cursor: null,
          has_more: false,
          type: 'page_or_database',
          page_or_database: {},
        })
      );

      const requests = Array.from({ length: 100 }, () => client.query(testSchema));

      await Promise.all(requests);
    });

    bench('Error recovery - simulated failures', async () => {
      const client = new NotionClient({
        auth: 'test',
        retryDelayMs: 1,
        maxRetries: 2,
      });

      let callCount = 0;
      mockClient.databases.query.mockImplementation(() => {
        callCount++;
        if (callCount <= 5) {
          // Simulate rate limit errors for first few calls
          const error = new Error('Rate limited') as Error & { status?: number; code?: string };
          error.status = 429;
          error.code = 'rate_limited';
          return Promise.reject(error);
        }
        return Promise.resolve({
          results: [],
          next_cursor: null,
          has_more: false,
          type: 'page_or_database',
          page_or_database: {},
        });
      });

      try {
        await client.query(testSchema);
      } catch {
        // Expected to fail after retries
      }
    });
  });
});

// Performance regression test
describe('Performance Regression Tests', () => {
  const PERFORMANCE_TARGETS = {
    simpleQuery: 100, // ms
    complexQuery: 500, // ms
    filterBuilding: 10, // ms
    propertyExtraction: 50, // ms
  };

  bench('Regression: Simple query performance', async () => {
    const client = new NotionClient({ auth: 'test' });
    mockClient.databases.query.mockResolvedValueOnce({
      results: generateTestArray(() => createMockPage(), 10),
      next_cursor: null,
      has_more: false,
      type: 'page_or_database',
      page_or_database: {},
    });

    const { durationMs } = await measureAsyncPerformance(
      () => client.query(testSchema),
      PERFORMANCE_TARGETS.simpleQuery
    );

    // Log warning if performance degrades
    if (durationMs > PERFORMANCE_TARGETS.simpleQuery * 0.9) {
      // Simple query performance degraded: ${durationMs}ms (target: ${PERFORMANCE_TARGETS.simpleQuery}ms)
    }
  });

  bench('Regression: Filter building performance', () => {
    const { durationMs } = measureSyncPerformance(() => {
      const builder = new FilterBuilder({ definition: testSchema.definition });
      return builder
        .where('status', { equals: 'Active' })
        .where('count', { greater_than: 10 })
        .where('completed', { equals: false })
        .build();
    }, PERFORMANCE_TARGETS.filterBuilding);

    if (durationMs > PERFORMANCE_TARGETS.filterBuilding * 0.9) {
      // Filter building performance degraded: ${durationMs}ms (target: ${PERFORMANCE_TARGETS.filterBuilding}ms)
    }
  });
});
