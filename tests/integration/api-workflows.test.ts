/**
 * Integration tests for comprehensive API workflows
 *
 * Tests complete end-to-end scenarios using mocked Notion API
 * to verify all components work together correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Client } from '@notionhq/client';
import { NotionClient } from '../../src/client/notion-client.js';
import { createTypedSchema } from '../../src/schema/typed-schema.js';
import {
  createMockNotionClient,
  createMockPage,
  createMockDatabase,
  mockPropertyValues,
  mockResponses,
} from '../utils/notion-api-mock.js';
import '../utils/custom-matchers.js';

// Mock dependencies
vi.mock('@notionhq/client', () => ({
  Client: vi.fn(),
}));

vi.mock('../../src/config/environment.js', () => ({
  resolveDatabaseId: vi.fn().mockReturnValue('test-database-id'),
}));

vi.mock('../../src/conversion/transformer-factory.js', () => ({
  getTransformerFactory: vi.fn().mockReturnValue({
    getCachedTransformer: vi.fn().mockReturnValue({
      transform: vi.fn().mockImplementation((data: any) => ({
        ok: true,
        value: {
          id: data.id || 'transformed-id',
          title: 'Transformed Title',
          status: 'Active',
          count: 42,
        },
      })),
    }),
    getCacheStats: vi.fn().mockReturnValue({ size: 0 }),
    clearCache: vi.fn(),
  }),
}));

describe('API Workflow Integration Tests', () => {
  let client: NotionClient;
  let mockClient: ReturnType<typeof createMockNotionClient>;
  let testSchema: any;

  beforeEach(() => {
    mockClient = createMockNotionClient();

    // Mock the Client constructor to return our mock
    vi.mocked(Client).mockImplementation(
      () => mockClient as unknown as InstanceType<typeof Client>
    );

    client = new NotionClient({
      auth: 'test-token',
      retryDelayMs: 0, // No delay for tests
      maxRetries: 1,
    });

    testSchema = createTypedSchema({
      properties: {
        title: { type: 'title' },
        status: { type: 'select', options: ['Active', 'Inactive', 'Pending'] },
        priority: { type: 'select', options: ['High', 'Medium', 'Low'] },
        count: { type: 'number' },
        completed: { type: 'checkbox' },
        dueDate: { type: 'date' },
        tags: { type: 'multi_select', options: ['urgent', 'feature', 'bug'] },
        assignee: { type: 'people' },
        description: { type: 'rich_text' },
      },
      databaseId: 'test-database-id',
    });

    vi.clearAllMocks();
  });

  describe('Complete CRUD Workflow', () => {
    it('should successfully create, read, update, and query pages', async () => {
      // Setup mocks for each operation
      const createdPage = createMockPage({
        properties: {
          title: mockPropertyValues.title('New Task'),
          status: mockPropertyValues.select('Active'),
          count: mockPropertyValues.number(1),
        },
      });

      const updatedPage = createMockPage({
        id: createdPage.id,
        properties: {
          title: mockPropertyValues.title('Updated Task'),
          status: mockPropertyValues.select('Completed'),
          count: mockPropertyValues.number(2),
        },
      });

      // Mock API responses
      mockClient.pages.create.mockResolvedValueOnce(createdPage);
      mockClient.pages.retrieve.mockResolvedValueOnce(createdPage);
      mockClient.pages.update.mockResolvedValueOnce(updatedPage);
      mockClient.databases.query.mockResolvedValueOnce(
        mockResponses.singlePageQuery('Updated Task')
      );

      // 1. Create a page
      const createData = {
        title: 'New Task',
        status: 'Active' as const,
        count: 1,
        completed: false,
      };

      const createdResult = await client.create(testSchema, createData);
      expect(createdResult.id).toBe('transformed-id');
      expect(mockClient.pages.create).toHaveBeenCalledWith({
        parent: { database_id: 'test-database-id' },
        properties: expect.objectContaining({
          title: expect.any(Object),
          status: expect.any(Object),
          count: expect.any(Object),
          completed: expect.any(Object),
        }),
      });

      // 2. Read the created page
      const readResult = await client.getPage(createdPage.id, testSchema);
      expect(readResult.id).toBe('transformed-id');
      expect(mockClient.pages.retrieve).toHaveBeenCalledWith({
        page_id: createdPage.id,
      });

      // 3. Update the page
      const updateData = {
        title: 'Updated Task',
        status: 'Completed' as const,
        count: 2,
      };

      const updatedResult = await client.update(createdPage.id, testSchema, updateData);
      expect(updatedResult.id).toBe('transformed-id');
      expect(mockClient.pages.update).toHaveBeenCalledWith({
        page_id: createdPage.id,
        properties: expect.objectContaining({
          title: expect.any(Object),
          status: expect.any(Object),
          count: expect.any(Object),
        }),
      });

      // 4. Query to find the updated page
      const queryResult = await client.query(testSchema, {
        filter: {
          property: 'status',
          select: { equals: 'Completed' },
        } as any,
      });

      expect(queryResult.results).toHaveLength(1);
      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: 'test-database-id',
        filter: expect.any(Object),
        sorts: undefined,
        page_size: undefined,
        start_cursor: undefined,
      });
    });

    it('should handle errors gracefully during CRUD operations', async () => {
      // Mock API errors
      const createError = new Error('Creation failed') as any;
      createError.status = 400;
      createError.code = 'validation_error';

      mockClient.pages.create.mockRejectedValueOnce(createError);

      // Attempt to create with invalid data should fail gracefully
      const invalidData = { title: 'Test' };

      await expect(client.create(testSchema, invalidData)).rejects.toThrow();
    });
  });

  describe('Complex Query Scenarios', () => {
    it('should handle complex filtering with multiple conditions', async () => {
      const mockPages = [
        createMockPage({
          properties: {
            title: mockPropertyValues.title('High Priority Task'),
            status: mockPropertyValues.select('Active'),
            priority: mockPropertyValues.select('High'),
            completed: mockPropertyValues.checkbox(false),
          },
        }),
        createMockPage({
          properties: {
            title: mockPropertyValues.title('Low Priority Task'),
            status: mockPropertyValues.select('Active'),
            priority: mockPropertyValues.select('Low'),
            completed: mockPropertyValues.checkbox(false),
          },
        }),
      ];

      mockClient.databases.query.mockResolvedValueOnce(
        mockResponses.multiPageQuery(mockPages.length)
      );

      const result = await client.query(testSchema, {
        filter: {
          and: [
            { property: 'status', select: { equals: 'Active' } },
            { property: 'completed', checkbox: { equals: false } },
          ],
        } as any,
        sorts: [
          { property: 'priority', direction: 'ascending' },
          { property: 'title', direction: 'ascending' },
        ],
        page_size: 50,
      });

      expect(result.results).toHaveLength(3); // From mockResponses.multiPageQuery(3)
      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: 'test-database-id',
        filter: expect.objectContaining({
          and: expect.any(Array),
        }),
        sorts: [
          { property: 'priority', direction: 'ascending' },
          { property: 'title', direction: 'ascending' },
        ],
        page_size: 50,
        start_cursor: undefined,
      });
    });

    it('should handle pagination correctly', async () => {
      const firstPageResponse = {
        ...mockResponses.multiPageQuery(2),
        has_more: true,
        next_cursor: 'cursor-123',
      };

      const secondPageResponse = {
        ...mockResponses.multiPageQuery(1),
        has_more: false,
        next_cursor: null,
      };

      mockClient.databases.query
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      // First page
      const firstResult = await client.query(testSchema, { page_size: 2 });
      expect(firstResult.has_more).toBe(true);
      expect(firstResult.next_cursor).toBe('cursor-123');

      // Second page
      const secondResult = await client.query(testSchema, {
        page_size: 2,
        start_cursor: 'cursor-123',
      });
      expect(secondResult.has_more).toBe(false);
      expect(secondResult.next_cursor).toBeNull();
    });
  });

  describe('Schema Validation Workflows', () => {
    it('should validate schema against database and detect mismatches', async () => {
      const databaseWithMismatches = createMockDatabase({
        properties: {
          title: { type: 'title', title: {} },
          status: { type: 'multi_select' }, // Should be 'select'
          // Missing 'priority' property
          count: { type: 'rich_text' }, // Should be 'number'
          extraProperty: { type: 'checkbox' }, // Not in schema
        },
      });

      mockClient.databases.retrieve.mockResolvedValueOnce(databaseWithMismatches);

      const validationResult = await client.validateSchema(testSchema);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      expect(validationResult.missingProperties).toContain('priority');
      expect(validationResult.typeConflicts).toHaveLength(2); // status and count
      expect(validationResult.extraProperties).toContain('extraProperty');
    });

    it('should pass validation for matching schema', async () => {
      const matchingDatabase = createMockDatabase({
        properties: {
          title: { type: 'title', title: {} },
          status: { type: 'select', select: { options: [] } },
          priority: { type: 'select', select: { options: [] } },
          count: { type: 'number', number: {} },
          completed: { type: 'checkbox', checkbox: {} },
          dueDate: { type: 'date', date: {} },
          tags: { type: 'multi_select', multi_select: { options: [] } },
          assignee: { type: 'people', people: {} },
          description: { type: 'rich_text', rich_text: {} },
        },
      });

      mockClient.databases.retrieve.mockResolvedValueOnce(matchingDatabase);

      const validationResult = await client.validateSchema(testSchema);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      expect(validationResult.missingProperties).toHaveLength(0);
      expect(validationResult.typeConflicts).toHaveLength(0);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should retry on rate limit errors', async () => {
      const rateLimitError = new Error('Rate limited') as any;
      rateLimitError.status = 429;
      rateLimitError.code = 'rate_limited';

      mockClient.databases.query
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponses.emptyQuery());

      const result = await client.query(testSchema);
      expect(result.results).toHaveLength(0);
      expect(mockClient.databases.query).toHaveBeenCalledTimes(2);

      // Check that rate limit hit was recorded
      const metrics = client.getPerformanceMetrics();
      expect(metrics.rateLimitHits).toBe(1);
    });

    it('should handle network errors appropriately', async () => {
      const networkError = new Error('Network timeout') as any;
      networkError.code = 'NETWORK_ERROR';

      mockClient.databases.query.mockRejectedValueOnce(networkError);

      await expect(client.query(testSchema)).rejects.toThrow('Network timeout');
    });

    it('should handle transformation errors in strict mode', async () => {
      // Mock transformer to return error
      const mockTransformerFactory = await import('../../src/conversion/transformer-factory.js');
      const mockTransformer = {
        transform: vi.fn().mockReturnValue({
          ok: false,
          error: new Error('Transform failed'),
        }),
      };
      (mockTransformerFactory.getTransformerFactory as any).mockReturnValueOnce({
        getCachedTransformer: vi.fn().mockReturnValue(mockTransformer),
        getCacheStats: vi.fn().mockReturnValue({ size: 0 }),
      });

      const strictClient = new NotionClient({
        auth: 'test-token',
        conversionConfig: {
          strictTypeValidation: true,
          preserveRichTextFormatting: false,
          missingPropertyStrategy: 'error',
          performance: {
            enableCaching: true,
            cacheMaxSize: 100,
            enableMetrics: true,
          },
        },
      });

      mockClient.databases.query.mockResolvedValueOnce(mockResponses.singlePageQuery());

      await expect(strictClient.query(testSchema)).rejects.toThrow();
    });
  });

  describe('Performance and Metrics', () => {
    it('should track performance metrics across operations', async () => {
      // Perform multiple operations
      mockClient.pages.create.mockResolvedValue(createMockPage());
      mockClient.databases.query.mockResolvedValue(mockResponses.emptyQuery());
      mockClient.pages.retrieve.mockResolvedValue(createMockPage());

      await client.create(testSchema, { title: 'Test' });
      await client.query(testSchema);
      await client.getPage('page-id', testSchema);

      const metrics = client.getPerformanceMetrics();

      expect(metrics.apiRequestCount).toBe(3);
      expect(metrics.lastQueryDuration).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should clear metrics and caches when requested', () => {
      // Perform some operations first
      mockClient.databases.query.mockResolvedValue(mockResponses.emptyQuery());

      client.query(testSchema);
      client.clearCaches();

      const metrics = client.getPerformanceMetrics();
      expect(metrics.apiRequestCount).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle a typical task management workflow', async () => {
      // Scenario: Create a task, assign it, update status, add comments, complete

      // 1. Create initial task
      const taskData = {
        title: 'Implement user authentication',
        status: 'Active' as const,
        priority: 'High' as const,
        tags: ['feature', 'security'],
        dueDate: new Date('2024-02-01'),
        completed: false,
      };

      mockClient.pages.create.mockResolvedValueOnce(
        createMockPage({
          properties: {
            title: mockPropertyValues.title(taskData.title),
            status: mockPropertyValues.select(taskData.status),
          },
        })
      );

      const task = await client.create(testSchema, taskData);
      expect(task.id).toBeDefined();

      // 2. Update task with assignee
      mockClient.pages.update.mockResolvedValueOnce(
        createMockPage({
          properties: {
            assignee: mockPropertyValues.people(['user-1']),
          },
        })
      );

      await client.update(task.id, testSchema, {
        assignee: ['user-1'],
        status: 'In Progress' as const,
      });

      // 3. Query active high-priority tasks
      mockClient.databases.query.mockResolvedValueOnce(mockResponses.multiPageQuery(5));

      const activeTasks = await client.query(testSchema, {
        filter: {
          and: [
            { property: 'status', select: { equals: 'In Progress' } },
            { property: 'priority', select: { equals: 'High' } },
          ],
        } as any,
        sorts: [{ property: 'dueDate', direction: 'ascending' }],
      });

      expect(activeTasks.results.length).toBeGreaterThan(0);

      // 4. Complete the task
      mockClient.pages.update.mockResolvedValueOnce(
        createMockPage({
          properties: {
            status: mockPropertyValues.select('Completed'),
            completed: mockPropertyValues.checkbox(true),
          },
        })
      );

      await client.update(task.id, testSchema, {
        status: 'Completed' as const,
        completed: true,
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);
      expect(mockClient.pages.update).toHaveBeenCalledTimes(2);
      expect(mockClient.databases.query).toHaveBeenCalledTimes(1);
    });

    it('should handle bulk operations efficiently', async () => {
      // Create multiple pages
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        title: `Task ${i + 1}`,
        status: 'Active' as const,
        priority: i % 2 === 0 ? ('High' as const) : ('Medium' as const),
        count: i + 1,
      }));

      // Mock successful creation for all tasks
      mockClient.pages.create.mockImplementation(() => Promise.resolve(createMockPage()));

      const createdTasks = await Promise.all(tasks.map(task => client.create(testSchema, task)));

      expect(createdTasks).toHaveLength(10);
      expect(mockClient.pages.create).toHaveBeenCalledTimes(10);

      // Verify metrics tracked all operations
      const metrics = client.getPerformanceMetrics();
      expect(metrics.apiRequestCount).toBe(10);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty query results', async () => {
      mockClient.databases.query.mockResolvedValueOnce(mockResponses.emptyQuery());

      const result = await client.query(testSchema, {
        filter: {
          property: 'status',
          select: { equals: 'NonExistentStatus' },
        } as any,
      });

      expect(result.results).toHaveLength(0);
      expect(result.has_more).toBe(false);
      expect(result.next_cursor).toBeNull();
    });

    it('should handle large property values', async () => {
      const largeContent = 'x'.repeat(100000); // 100KB string

      const largePageData = {
        title: 'Large Content Test',
        description: largeContent,
      };

      mockClient.pages.create.mockResolvedValueOnce(
        createMockPage({
          properties: {
            description: mockPropertyValues.rich_text(largeContent),
          },
        })
      );

      const result = await client.create(testSchema, largePageData);
      expect(result.id).toBeDefined();
    });

    it('should handle special characters in property values', async () => {
      const specialCharsData = {
        title: 'Test with 🎉 emojis & special chars: <>[]{}()!@#$%^&*',
        description: 'Line 1\nLine 2\tTabbed\rCarriage Return"Quoted"',
        status: 'Active' as const,
      };

      mockClient.pages.create.mockResolvedValueOnce(createMockPage());

      const result = await client.create(testSchema, specialCharsData);
      expect(result.id).toBeDefined();
      expect(mockClient.pages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            title: expect.any(Object),
            description: expect.any(Object),
          }),
        })
      );
    });
  });
});
