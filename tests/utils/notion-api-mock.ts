/**
 * Mock Notion API responses for testing
 *
 * Provides realistic mock data that matches Notion's API response structure
 * for comprehensive testing without actual API calls.
 */

import { vi } from 'vitest';

export interface MockNotionUser {
  id: string;
  type: 'person' | 'bot';
  name: string;
  avatar_url: string | null;
  person?: {
    email: string;
  };
  bot?: {
    owner: {
      type: 'workspace' | 'user';
    };
  };
}

export interface MockNotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: MockNotionUser;
  last_edited_by: MockNotionUser;
  cover: null;
  icon: null;
  parent: {
    type: 'database_id';
    database_id: string;
  };
  archived: boolean;
  properties: Record<string, unknown>;
  url: string;
}

export interface MockNotionDatabase {
  id: string;
  created_time: string;
  last_edited_time: string;
  title: Array<{
    text: { content: string };
  }>;
  description: Array<{
    text: { content: string };
  }>;
  properties: Record<string, unknown>;
  parent: {
    type: 'page_id';
    page_id: string;
  };
  url: string;
  archived: boolean;
}

export const mockUsers: Record<string, MockNotionUser> = {
  'user-1': {
    id: 'user-1',
    type: 'person',
    name: 'John Doe',
    avatar_url: 'https://example.com/john.jpg',
    person: {
      email: 'john@example.com',
    },
  },
  'user-2': {
    id: 'user-2',
    type: 'person',
    name: 'Jane Smith',
    avatar_url: 'https://example.com/jane.jpg',
    person: {
      email: 'jane@example.com',
    },
  },
  'bot-1': {
    id: 'bot-1',
    type: 'bot',
    name: 'Integration Bot',
    avatar_url: null,
    bot: {
      owner: {
        type: 'workspace',
      },
    },
  },
};

export function createMockPage(overrides: Partial<MockNotionPage> = {}): MockNotionPage {
  return {
    id: `page-${Math.random().toString(36).substring(7)}`,
    created_time: '2024-01-15T10:00:00.000Z',
    last_edited_time: '2024-01-15T15:30:00.000Z',
    created_by: mockUsers['user-1']!,
    last_edited_by: mockUsers['user-1']!,
    cover: null,
    icon: null,
    parent: {
      type: 'database_id',
      database_id: 'test-database-id',
    },
    archived: false,
    properties: {
      title: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: { content: 'Test Page' },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
          },
        ],
      },
    },
    url: 'https://www.notion.so/test-page',
    ...overrides,
  };
}

export function createMockDatabase(
  overrides: Partial<MockNotionDatabase> = {}
): MockNotionDatabase {
  return {
    id: `database-${Math.random().toString(36).substring(7)}`,
    created_time: '2024-01-01T00:00:00.000Z',
    last_edited_time: '2024-01-15T12:00:00.000Z',
    title: [
      {
        text: { content: 'Test Database' },
      },
    ],
    description: [],
    properties: {
      title: {
        id: 'title',
        name: 'Name',
        type: 'title',
        title: {},
      },
      status: {
        id: 'status',
        name: 'Status',
        type: 'select',
        select: {
          options: [
            {
              id: 'opt-1',
              name: 'Active',
              color: 'green',
            },
            {
              id: 'opt-2',
              name: 'Inactive',
              color: 'red',
            },
          ],
        },
      },
    },
    parent: {
      type: 'page_id',
      page_id: 'parent-page-id',
    },
    url: 'https://www.notion.so/test-database',
    archived: false,
    ...overrides,
  };
}

// Property value generators
export const mockPropertyValues = {
  title: (content: string = 'Default Title') => ({
    title: [
      {
        type: 'text',
        text: { content },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
      },
    ],
  }),

  rich_text: (content: string = 'Default rich text') => ({
    rich_text: [
      {
        type: 'text',
        text: { content },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
      },
    ],
  }),

  number: (value: number | null = 42) => ({
    number: value,
  }),

  checkbox: (checked: boolean = false) => ({
    checkbox: checked,
  }),

  date: (start: string = '2024-01-15', end?: string, timezone?: string) => ({
    date: {
      start,
      end: end || null,
      time_zone: timezone || null,
    },
  }),

  select: (name: string = 'Active', color: string = 'green') => ({
    select: {
      id: `opt-${Math.random().toString(36).substring(7)}`,
      name,
      color,
    },
  }),

  multi_select: (names: string[] = ['feature', 'urgent']) => ({
    multi_select: names.map((name, index) => ({
      id: `opt-${index}`,
      name,
      color: 'default',
    })),
  }),

  people: (userIds: string[] = ['user-1']) => ({
    people: userIds.map(id => mockUsers[id]).filter(Boolean),
  }),

  created_time: (time: string = '2024-01-15T10:00:00.000Z') => ({
    created_time: time,
  }),

  last_edited_time: (time: string = '2024-01-15T15:30:00.000Z') => ({
    last_edited_time: time,
  }),

  created_by: (userId: string = 'user-1') => ({
    created_by: mockUsers[userId],
  }),

  last_edited_by: (userId: string = 'user-1') => ({
    last_edited_by: mockUsers[userId],
  }),

  url: (url: string | null = 'https://example.com') => ({
    url,
  }),

  email: (email: string | null = 'test@example.com') => ({
    email,
  }),
};

// Query response generators
export function createMockQueryResponse(pages: MockNotionPage[] = [], hasMore: boolean = false) {
  return {
    object: 'list',
    results: pages,
    next_cursor: hasMore ? `cursor-${Math.random().toString(36).substring(7)}` : null,
    has_more: hasMore,
    type: 'page_or_database' as const,
    page_or_database: {},
    request_id: `req-${Math.random().toString(36).substring(7)}`,
  };
}

// Error response generators
export function createMockNotionError(status: number, code: string, message: string) {
  const error = new Error(message) as Error & { status?: number; code?: string };
  error.status = status;
  error.code = code;
  return error;
}

export function createMockRateLimitError() {
  return createMockNotionError(429, 'rate_limited', 'Rate limit exceeded');
}

export function createMockValidationError() {
  return createMockNotionError(400, 'validation_error', 'Invalid request data');
}

export function createMockUnauthorizedError() {
  return createMockNotionError(401, 'unauthorized', 'Unauthorized access');
}

export function createMockNotFoundError() {
  return createMockNotionError(404, 'object_not_found', 'Object not found');
}

// Mock client factory
export function createMockNotionClient() {
  return {
    databases: {
      query: vi.fn(),
      retrieve: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pages: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
    },
    blocks: {
      children: {
        list: vi.fn(),
        append: vi.fn(),
      },
    },
    users: {
      list: vi.fn(),
      retrieve: vi.fn(),
      me: vi.fn(),
    },
  };
}

// Response builders for common scenarios
export const mockResponses = {
  emptyQuery: () => createMockQueryResponse([]),

  singlePageQuery: (title: string = 'Test Page') =>
    createMockQueryResponse([
      createMockPage({
        properties: {
          title: mockPropertyValues.title(title),
          status: mockPropertyValues.select('Active'),
        },
      }),
    ]),

  multiPageQuery: (count: number = 3) =>
    createMockQueryResponse(
      Array.from({ length: count }, (_, i) =>
        createMockPage({
          properties: {
            title: mockPropertyValues.title(`Page ${i + 1}`),
            status: mockPropertyValues.select(i % 2 === 0 ? 'Active' : 'Inactive'),
          },
        })
      )
    ),

  paginatedQuery: () =>
    createMockQueryResponse(
      [createMockPage()],
      true // has_more = true
    ),

  basicDatabase: () => createMockDatabase(),

  complexDatabase: () =>
    createMockDatabase({
      properties: {
        title: { type: 'title', title: {} },
        status: {
          type: 'select',
          select: {
            options: [
              { id: '1', name: 'Active', color: 'green' },
              { id: '2', name: 'Inactive', color: 'red' },
            ],
          },
        },
        count: { type: 'number', number: {} },
        completed: { type: 'checkbox', checkbox: {} },
        dueDate: { type: 'date', date: {} },
        tags: {
          type: 'multi_select',
          multi_select: {
            options: [
              { id: 'a', name: 'urgent', color: 'red' },
              { id: 'b', name: 'feature', color: 'blue' },
            ],
          },
        },
      },
    }),
};
