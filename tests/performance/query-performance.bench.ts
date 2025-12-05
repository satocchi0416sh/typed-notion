/**
 * Performance benchmarks for query operations
 *
 * Tests the performance characteristics of the NotionClient
 * and related components under various load scenarios.
 */

import { bench, describe, vi } from 'vitest';
import { NotionClient } from '../../src/client/notion-client.js';
import { createTypedSchema } from '../../src/schema/typed-schema.js';
import {
  FilterBuilder,
  FilterValidator,
  FilterConverter,
  type NotionFilter,
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
const mockQuery = mockClient.databases.query as ReturnType<typeof vi.fn>;
const mockPageCreate = mockClient.pages.create as ReturnType<typeof vi.fn>;
const testSchema = createTypedSchema({
  properties: {
    Title: { type: 'title' },
    Status: { type: 'select', options: ['Active', 'Inactive'] as const },
    Count: { type: 'number' },
    Tags: { type: 'multi_select', options: ['feature', 'bug', 'enhancement'] as const },
    Completed: { type: 'checkbox' },
  },
  databaseId: '12345678-1234-5678-9abc-123456789abc',
} as const);

describe('Query Performance Benchmarks', () => {
  describe('NotionClient Query Operations', () => {
    bench('Query with simple filter - 100 results', async () => {
      const pages = generateTestArray(() => createMockPage(), 100);
      mockQuery.mockResolvedValueOnce({
        results: pages,
        next_cursor: null,
        has_more: false,
        type: 'page_or_database',
        page_or_database: {},
      });

      const client = new NotionClient({ auth: 'test' });
      await client.query(testSchema, {
        filter: {
          property: 'Status',
          select: { equals: 'Active' },
        },
      });
    });

    bench('Query with complex filter - 1000 results', async () => {
      const pages = generateTestArray(() => createMockPage(), 1000);
      mockQuery.mockResolvedValueOnce({
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
              property: 'Status',
              select: { equals: 'Active' },
            },
            {
              property: 'Completed',
              checkbox: { equals: false },
            },
            {
              or: [
                {
                  property: 'Tags',
                  multi_select: { contains: 'feature' },
                },
                {
                  property: 'Tags',
                  multi_select: { contains: 'bug' },
                },
              ],
            },
          ],
        },
        sorts: [
          { property: 'Count', direction: 'descending' },
          { property: 'Title', direction: 'ascending' },
        ],
      });
    });

    bench('Bulk create operations - 50 pages', async () => {
      mockPageCreate.mockImplementation(() => Promise.resolve(createMockPage()));

      const client = new NotionClient({ auth: 'test' });
      const createPromises = Array.from({ length: 50 }, (_, i) =>
        client.create(testSchema, {
          Title: `Page ${i}`,
          Status: 'Active',
          Count: i,
        })
      );

      await Promise.all(createPromises);
    });

    bench('Sequential vs Parallel operations', async () => {
      mockPageCreate.mockImplementation(() => Promise.resolve(createMockPage()));
      mockQuery.mockImplementation(() =>
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
        client.create(testSchema, { Title: 'Task 1', Status: 'Active' }),
        client.query(testSchema),
        client.create(testSchema, { Title: 'Task 2', Status: 'Inactive' }),
        client.query(testSchema, {
          filter: {
            property: 'Status',
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
        filter = filter.where('Count', { greater_than: i });
      }

      filter.build();
    });

    bench('FilterBuilder - Complex nested filters', () => {
      const builder = new FilterBuilder({ definition: testSchema.definition });

      builder
        .where('Status', { equals: 'Active' })
        .and({
          or: [
            {
              property: 'Tags',
              multi_select: { contains: 'feature' },
            },
            {
              property: 'Tags',
              multi_select: { contains: 'bug' },
            },
          ],
        })
        .and({
          and: [
            {
              property: 'Count',
              number: { greater_than: 5 },
            },
            {
              property: 'Completed',
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
          property: 'Status',
          select: { equals: 'Active' },
        }),
        100
      );

      filters.forEach(_filter =>
        validator.validate({
          property: 'Status',
          select: { equals: 'Active' },
        })
      );
    });

    bench('Filter conversion - 100 filters', () => {
      const converter = new FilterConverter<typeof testSchema.definition>();

      const filters = generateTestArray(
        () => ({
          property: 'Status',
          select: { equals: 'Active' },
        }),
        100
      );

      filters.forEach(_filter =>
        converter.toNotionFilter({
          property: 'Status',
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
        Title: mockPropertyValues.title('Complex Page Title'),
        description: mockPropertyValues.rich_text(
          'Long description with multiple paragraphs...'.repeat(100)
        ),
        Count: mockPropertyValues.number(42),
        Completed: mockPropertyValues.checkbox(true),
        Status: mockPropertyValues.select('Active'),
        Tags: mockPropertyValues.multi_select(['feature', 'urgent', 'backend']),
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
            databaseId: '12345678-1234-5678-9abc-123456789abc',
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
          schema.validate({ Title: `Test ${i}` });
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

      mockQuery.mockImplementation(() =>
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
      mockQuery.mockImplementation(() => {
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
    mockQuery.mockResolvedValueOnce({
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
        .where('Status', { equals: 'Active' })
        .where('Count', { greater_than: 10 })
        .where('Completed', { equals: false })
        .build();
    }, PERFORMANCE_TARGETS.filterBuilding);

    if (durationMs > PERFORMANCE_TARGETS.filterBuilding * 0.9) {
      // Filter building performance degraded: ${durationMs}ms (target: ${PERFORMANCE_TARGETS.filterBuilding}ms)
    }
  });
});
