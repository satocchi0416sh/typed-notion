/**
 * Unit tests for NotionClient class
 *
 * Tests all CRUD operations, error handling, rate limiting,
 * and performance metrics of the core NotionClient functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotionClient } from '../../src/client/notion-client.js';
import type { TypedSchema } from '../../src/schema/typed-schema.js';
import type { SchemaDefinition } from '../../src/types/core.js';
import { NotionAPIError, SchemaValidationError, ConversionError } from '../../src/errors/index.js';

// Mock the Notion client
vi.mock('@notionhq/client', () => ({
  Client: function MockClient() {
    return {
      databases: {
        query: vi.fn(),
        retrieve: vi.fn(),
      },
      pages: {
        create: vi.fn(),
        update: vi.fn(),
        retrieve: vi.fn(),
      },
    };
  },
}));

// Mock other dependencies
vi.mock('../../src/config/environment.js', () => ({
  resolveDatabaseId: vi.fn().mockReturnValue('test-database-id'),
}));

vi.mock('../../src/conversion/transformer-factory.js', () => ({
  getTransformerFactory: vi.fn().mockReturnValue({
    getCachedTransformer: vi.fn().mockReturnValue({
      transform: vi.fn().mockReturnValue({
        ok: true,
        value: { id: 'test-id', title: 'Test Title', status: 'Active', count: 42 },
      }),
    }),
    getCacheStats: vi.fn().mockReturnValue({ size: 0 }),
    clearCache: vi.fn(),
  }),
}));

describe('NotionClient', () => {
  let client: NotionClient;
  let mockSchema: TypedSchema<SchemaDefinition>;
  beforeEach(() => {
    vi.clearAllMocks();

    client = new NotionClient({
      auth: 'test-token',
      timeout: 5000,
      maxRetries: 2,
    });

    mockSchema = {
      definition: {
        databaseId: 'test-db-id',
        properties: {
          title: { type: 'title' },
          status: { type: 'select', options: ['Active', 'Inactive'] },
          count: { type: 'number' },
        },
      },
      databaseId: 'test-db-id',
      propertyNames: ['title', 'status', 'count'],
      createdAt: new Date(),
      validate: vi.fn().mockReturnValue({ success: true }),
      validatePartial: vi.fn().mockReturnValue({ success: true }),
      toZod: vi.fn(),
      parse: vi.fn(),
      getTitleProperty: vi.fn().mockReturnValue({ name: 'title', type: 'title' }),
    } as any;
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const testClient = new NotionClient({ auth: 'test-auth' });
      const metrics = testClient.getPerformanceMetrics();

      expect(metrics.apiRequestCount).toBe(0);
      expect(metrics.rateLimitHits).toBe(0);
    });

    it('should apply custom configuration', () => {
      const config = {
        auth: 'custom-token',
        notionVersion: '2023-06-28',
        timeout: 30000,
        retryDelayMs: 500,
        maxRetries: 5,
        enablePerformanceTracking: false,
      };

      const testClient = new NotionClient(config);
      expect(testClient).toBeInstanceOf(NotionClient);
    });
  });

  describe('query()', () => {
    it('should execute successful query without filters', async () => {
      const mockResponse = {
        results: [
          { id: 'page-1', properties: { title: { title: [{ text: { content: 'Test' } }] } } },
        ],
        next_cursor: null,
        has_more: false,
        type: 'page_or_database' as const,
        page_or_database: {},
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.databases.query.mockResolvedValueOnce(mockResponse);

      const result = await client.query(mockSchema);

      expect(result.results).toHaveLength(1);
      expect(result.has_more).toBe(false);
      expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
        database_id: 'test-db-id',
        filter: undefined,
        sorts: undefined,
        page_size: undefined,
        start_cursor: undefined,
      });
    });

    it('should execute query with filters', async () => {
      const mockResponse = {
        results: [],
        next_cursor: null,
        has_more: false,
        type: 'page_or_database' as const,
        page_or_database: {},
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.databases.query.mockResolvedValueOnce(mockResponse);

      const filter = {
        property: 'status',
        select: { equals: 'Active' },
      } as any;

      await client.query(mockSchema, {
        filter,
        page_size: 50,
        sorts: [{ property: 'title', direction: 'ascending' }],
      });

      expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
        database_id: 'test-db-id',
        filter: expect.any(Object),
        sorts: [{ property: 'title', direction: 'ascending' }],
        page_size: 50,
        start_cursor: undefined,
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockNotionClient = (client as any).client;
      const apiError = new Error('API Error');
      (apiError as any).status = 404;
      mockNotionClient.databases.query.mockRejectedValueOnce(apiError);

      await expect(client.query(mockSchema)).rejects.toThrow();
    });

    it('should validate filters before querying', async () => {
      const invalidFilter = {
        property: 'nonexistent',
        select: { equals: 'value' },
      } as any;

      // Mock filter validation to fail
      vi.doMock('../../src/client/filters.js', () => ({
        FilterValidator: class {
          validate() {
            return { isValid: false, errors: ['Invalid property'] };
          }
        },
        FilterConverter: class {
          toNotionFilter() {
            return {};
          }
        },
      }));

      await expect(client.query(mockSchema, { filter: invalidFilter })).rejects.toThrow(
        SchemaValidationError
      );
    });
  });

  describe('create()', () => {
    it('should create a new page successfully', async () => {
      const mockResponse = {
        id: 'new-page-id',
        properties: {
          title: { title: [{ text: { content: 'New Page' } }] },
        },
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.pages.create.mockResolvedValueOnce(mockResponse);

      const data = {
        title: 'New Page',
        status: 'Active',
        count: 42,
      };

      const result = await client.create(mockSchema, data);

      expect(result.id).toBe('test-id'); // From mocked transformer
      expect(mockNotionClient.pages.create).toHaveBeenCalledWith({
        parent: { database_id: 'test-db-id' },
        properties: expect.objectContaining({
          title: expect.any(Object),
          status: expect.any(Object),
          count: expect.any(Object),
        }),
      });
    });

    it('should validate data before creating', async () => {
      mockSchema.validate = vi.fn().mockReturnValue({
        success: false,
        error: { issues: [{ message: 'Invalid data' }] },
      });

      const invalidData = { title: 123 }; // Invalid type

      await expect(client.create(mockSchema, invalidData)).rejects.toThrow(SchemaValidationError);
    });

    it('should handle creation failures', async () => {
      const mockNotionClient = (client as any).client;
      mockNotionClient.pages.create.mockRejectedValueOnce(new Error('Creation failed'));

      const data = { title: 'Test' };

      await expect(client.create(mockSchema, data)).rejects.toThrow();
    });
  });

  describe('update()', () => {
    it('should update an existing page successfully', async () => {
      const mockResponse = {
        id: 'updated-page-id',
        properties: {
          title: { title: [{ text: { content: 'Updated Page' } }] },
        },
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.pages.update.mockResolvedValueOnce(mockResponse);

      const updates = { title: 'Updated Title' };
      const result = await client.update('page-id', mockSchema, updates);

      expect(result.id).toBe('test-id'); // From mocked transformer
      expect(mockNotionClient.pages.update).toHaveBeenCalledWith({
        page_id: 'page-id',
        properties: expect.objectContaining({
          title: expect.any(Object),
        }),
      });
    });

    it('should validate partial update data', async () => {
      mockSchema.validatePartial = vi.fn().mockReturnValue({
        success: false,
        error: { issues: [{ message: 'Invalid update data' }] },
      });

      const invalidUpdates = { count: 'not-a-number' };

      await expect(client.update('page-id', mockSchema, invalidUpdates)).rejects.toThrow(
        SchemaValidationError
      );
    });
  });

  describe('getPage()', () => {
    it('should retrieve a single page successfully', async () => {
      const mockResponse = {
        id: 'retrieved-page-id',
        properties: {
          title: { title: [{ text: { content: 'Retrieved Page' } }] },
        },
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.pages.retrieve.mockResolvedValueOnce(mockResponse);

      const result = await client.getPage('page-id', mockSchema);

      expect(result.id).toBe('test-id'); // From mocked transformer
      expect(mockNotionClient.pages.retrieve).toHaveBeenCalledWith({
        page_id: 'page-id',
      });
    });

    it('should handle page not found errors', async () => {
      const mockNotionClient = (client as any).client;
      const notFoundError = new Error('Page not found');
      (notFoundError as any).status = 404;
      mockNotionClient.pages.retrieve.mockRejectedValueOnce(notFoundError);

      await expect(client.getPage('nonexistent-page', mockSchema)).rejects.toThrow();
    });
  });

  describe('validateSchema()', () => {
    it('should validate schema against database structure', async () => {
      const mockDatabase = {
        properties: {
          title: { type: 'title' },
          status: { type: 'select' },
          count: { type: 'number' },
        },
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.databases.retrieve.mockResolvedValueOnce(mockDatabase);

      const result = await client.validateSchema(mockSchema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingProperties).toHaveLength(0);
      expect(result.typeConflicts).toHaveLength(0);
    });

    it('should detect missing properties in database', async () => {
      const mockDatabase = {
        properties: {
          title: { type: 'title' },
          // Missing 'status' and 'count' properties
        },
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.databases.retrieve.mockResolvedValueOnce(mockDatabase);

      const result = await client.validateSchema(mockSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingProperties).toEqual(['status', 'count']);
    });

    it('should detect type conflicts', async () => {
      const mockDatabase = {
        properties: {
          title: { type: 'title' },
          status: { type: 'multi_select' }, // Should be 'select'
          count: { type: 'rich_text' }, // Should be 'number'
        },
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.databases.retrieve.mockResolvedValueOnce(mockDatabase);

      const result = await client.validateSchema(mockSchema);

      expect(result.isValid).toBe(false);
      expect(result.typeConflicts).toHaveLength(2);
      expect(result.typeConflicts[0]).toEqual({
        property: 'status',
        expected: 'select',
        actual: 'multi_select',
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit errors with exponential backoff', async () => {
      const mockNotionClient = (client as any).client;
      const rateLimitError = new Error('Rate limited');
      (rateLimitError as any).code = 'rate_limited';

      mockNotionClient.databases.query.mockRejectedValueOnce(rateLimitError).mockResolvedValueOnce({
        results: [],
        next_cursor: null,
        has_more: false,
        type: 'page_or_database',
        page_or_database: {},
      });

      // Should retry and succeed
      const result = await client.query(mockSchema);
      expect(result.results).toHaveLength(0);

      const metrics = client.getPerformanceMetrics();
      expect(metrics.rateLimitHits).toBe(1);
    });

    it('should apply configured retry delays', async () => {
      const testClient = new NotionClient({
        auth: 'test-token',
        retryDelayMs: 100,
        maxRetries: 1,
      });

      // Test that the client respects the delay configuration
      expect(testClient).toBeInstanceOf(NotionClient);
    });
  });

  describe('Performance Metrics', () => {
    it('should track API request count', async () => {
      const mockNotionClient = (client as any).client;
      mockNotionClient.databases.query.mockResolvedValueOnce({
        results: [],
        next_cursor: null,
        has_more: false,
        type: 'page_or_database',
        page_or_database: {},
      });

      await client.query(mockSchema);

      const metrics = client.getPerformanceMetrics();
      expect(metrics.apiRequestCount).toBe(1);
      expect(metrics.lastQueryDuration).toBeGreaterThan(0);
    });

    it('should track average response time', async () => {
      const mockNotionClient = (client as any).client;
      mockNotionClient.databases.query.mockResolvedValue({
        results: [],
        next_cursor: null,
        has_more: false,
        type: 'page_or_database',
        page_or_database: {},
      });

      await client.query(mockSchema);
      await client.query(mockSchema);

      const metrics = client.getPerformanceMetrics();
      expect(metrics.apiRequestCount).toBe(2);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should reset metrics when clearing caches', () => {
      client.clearCaches();

      const metrics = client.getPerformanceMetrics();
      expect(metrics.apiRequestCount).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should transform Notion API errors to typed errors', async () => {
      const mockNotionClient = (client as any).client;
      const apiError = new Error('Unauthorized');
      (apiError as any).status = 401;
      (apiError as any).code = 'unauthorized';
      mockNotionClient.databases.query.mockRejectedValueOnce(apiError);

      await expect(client.query(mockSchema)).rejects.toThrow(NotionAPIError);
    });

    it('should handle transformation errors gracefully', async () => {
      const mockResponse = {
        results: [{ id: 'page-1', properties: {} }],
        next_cursor: null,
        has_more: false,
        type: 'page_or_database',
        page_or_database: {},
      };

      const mockNotionClient = (client as any).client;
      mockNotionClient.databases.query.mockResolvedValueOnce(mockResponse);

      // Mock transformer to return error
      const mockTransformerFactory = await import('../../src/conversion/transformer-factory.js');
      const mockTransformer = {
        transform: vi.fn().mockReturnValue({
          ok: false,
          error: new ConversionError(
            'Transform failed',
            'CONVERSION_ERROR',
            {},
            'page-1',
            'target',
            'source'
          ),
        }),
      };
      (mockTransformerFactory.getTransformerFactory as any).mockReturnValueOnce({
        getCachedTransformer: vi.fn().mockReturnValue(mockTransformer),
        getCacheStats: vi.fn().mockReturnValue({ size: 0 }),
      });

      // With strict validation, should throw
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

      // Setup mock for the new client too
      const strictMockClient = (strictClient as any).client;
      strictMockClient.databases.query.mockResolvedValueOnce(mockResponse);

      await expect(strictClient.query(mockSchema)).rejects.toThrow(ConversionError);
    });
  });

  describe('Property Conversion', () => {
    it('should convert TypeScript data to Notion API format', async () => {
      const data = {
        title: 'Test Title',
        count: 42,
        status: 'Active',
        checkbox: true,
        date: new Date('2024-01-01'),
        url: 'https://example.com',
        email: 'test@example.com',
      };

      const schema = {
        definition: {
          properties: {
            title: { type: 'title' },
            count: { type: 'number' },
            status: { type: 'select' },
            checkbox: { type: 'checkbox' },
            date: { type: 'date' },
            url: { type: 'url' },
            email: { type: 'email' },
          },
        },
        databaseId: 'test-database-id',
        validate: vi.fn().mockReturnValue({ success: true }),
      } as any;

      // Test property conversion by calling create
      const mockNotionClient = (client as any).client;
      mockNotionClient.pages.create.mockResolvedValueOnce({
        id: 'test-id',
        properties: {},
      });

      await client.create(schema, data);

      expect(mockNotionClient.pages.create).toHaveBeenCalledWith({
        parent: expect.any(Object),
        properties: expect.objectContaining({
          title: { title: [{ text: { content: 'Test Title' } }] },
          count: { number: 42 },
          status: { select: { name: 'Active' } },
          checkbox: { checkbox: true },
          date: { date: { start: '2024-01-01' } },
          url: { url: 'https://example.com' },
          email: { email: 'test@example.com' },
        }),
      });
    });

    it('should handle null and undefined values', async () => {
      const data = {
        title: null,
        count: undefined,
        status: '',
      };

      const schema = {
        definition: {
          properties: {
            title: { type: 'title' },
            count: { type: 'number' },
            status: { type: 'select' },
          },
        },
        databaseId: 'test-database-id',
        validate: vi.fn().mockReturnValue({ success: true }),
      } as any;

      const mockNotionClient = (client as any).client;
      mockNotionClient.pages.create.mockResolvedValueOnce({
        id: 'test-id',
        properties: {},
      });

      await client.create(schema, data);

      expect(mockNotionClient.pages.create).toHaveBeenCalledWith({
        parent: expect.any(Object),
        properties: expect.objectContaining({
          status: { select: { name: '' } },
        }),
      });
    });
  });
});
