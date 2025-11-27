/**
 * Test data generators for creating mock Notion API responses
 *
 * Provides utilities for generating realistic test data that matches
 * the structure of Notion API responses and property values.
 */

import { vi } from 'vitest';
import type {
  NotionPropertyValue,
  NotionUser,
  RichTextObject,
} from '../../src/conversion/index.js';

// Mock Notion Client
export function createMockNotionClient(): {
  databases: {
    query: typeof vi.fn;
    retrieve: typeof vi.fn;
  };
  pages: {
    create: typeof vi.fn;
    update: typeof vi.fn;
    retrieve: typeof vi.fn;
  };
  users: {
    retrieve: typeof vi.fn;
    list: typeof vi.fn;
  };
} {
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
    users: {
      retrieve: vi.fn(),
      list: vi.fn(),
    },
  };
}

// Mock Page Generator
export function createMockPage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `page_${Math.random().toString(36).substr(2, 9)}`,
    created_time: new Date().toISOString(),
    last_edited_time: new Date().toISOString(),
    created_by: {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      type: 'person' as const,
      person: {
        email: 'test@example.com',
      },
    },
    last_edited_by: {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      type: 'person' as const,
      person: {
        email: 'test@example.com',
      },
    },
    cover: null,
    icon: null,
    parent: {
      type: 'database_id' as const,
      database_id: 'test_database_id',
    },
    archived: false,
    in_trash: false,
    properties: {
      title: {
        id: 'title',
        type: 'title' as const,
        title: [
          {
            type: 'text' as const,
            text: {
              content: 'Test Page',
              link: null,
            },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default' as const,
            },
            plain_text: 'Test Page',
            href: null,
          },
        ],
      },
    },
    url: `https://notion.so/page_${Math.random().toString(36).substr(2, 9)}`,
    public_url: null,
    ...overrides,
  };
}

// Mock Property Values
export const mockPropertyValues = {
  title: (content: string): NotionPropertyValue => ({
    id: 'title',
    type: 'title',
    title: [
      {
        type: 'text',
        text: {
          content,
          link: null,
        },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: content,
        href: null,
      },
    ],
  }),

  rich_text: (content: string): NotionPropertyValue => ({
    id: 'description',
    type: 'rich_text',
    rich_text: [
      {
        type: 'text',
        text: {
          content,
          link: null,
        },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: content,
        href: null,
      },
    ],
  }),

  number: (value: number | null): NotionPropertyValue => ({
    id: 'count',
    type: 'number',
    number: value,
  }),

  checkbox: (checked: boolean): NotionPropertyValue => ({
    id: 'completed',
    type: 'checkbox',
    checkbox: checked,
  }),

  select: (option: string | null): NotionPropertyValue => ({
    id: 'status',
    type: 'select',
    select: option
      ? {
          id: `option_${option.toLowerCase()}`,
          name: option,
          color: 'default',
        }
      : null,
  }),

  multi_select: (options: string[]): NotionPropertyValue => ({
    id: 'tags',
    type: 'multi_select',
    multi_select: options.map(option => ({
      id: `option_${option.toLowerCase()}`,
      name: option,
      color: 'default',
    })),
  }),

  date: (start: string, end?: string | null): NotionPropertyValue => ({
    id: 'due_date',
    type: 'date',
    date: {
      start,
      end: end || null,
      time_zone: null,
    },
  }),

  people: (users: NotionUser[]): NotionPropertyValue => ({
    id: 'assignees',
    type: 'people',
    people: users,
  }),

  url: (url: string | null): NotionPropertyValue => ({
    id: 'website',
    type: 'url',
    url,
  }),

  email: (email: string | null): NotionPropertyValue => ({
    id: 'contact',
    type: 'email',
    email,
  }),

  created_time: (timestamp: string): NotionPropertyValue => ({
    id: 'created_time',
    type: 'created_time',
    created_time: timestamp,
  }),

  last_edited_time: (timestamp: string): NotionPropertyValue => ({
    id: 'last_edited_time',
    type: 'last_edited_time',
    last_edited_time: timestamp,
  }),

  created_by: (user: NotionUser): NotionPropertyValue => ({
    id: 'created_by',
    type: 'created_by',
    created_by: user,
  }),

  last_edited_by: (user: NotionUser): NotionPropertyValue => ({
    id: 'last_edited_by',
    type: 'last_edited_by',
    last_edited_by: user,
  }),
};

// Mock User Generator
export function createMockUser(overrides: Partial<NotionUser> = {}): NotionUser {
  return {
    object: 'user',
    id: `user_${Math.random().toString(36).substr(2, 9)}`,
    type: 'person',
    person: {
      email: 'test@example.com',
    },
    name: 'Test User',
    avatar_url: null,
    ...overrides,
  };
}

// Rich Text Generator
export function createRichText(
  content: string,
  annotations: Partial<RichTextObject['annotations']> = {}
): RichTextObject {
  return {
    type: 'text',
    text: {
      content,
      link: null,
    },
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: 'default',
      ...annotations,
    },
    plain_text: content,
    href: null,
  };
}

// Database Mock Generator
export function createMockDatabase(
  properties: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: `db_${Math.random().toString(36).substr(2, 9)}`,
    created_time: new Date().toISOString(),
    last_edited_time: new Date().toISOString(),
    title: [createRichText('Test Database')],
    description: [],
    icon: null,
    cover: null,
    properties: {
      title: {
        id: 'title',
        name: 'Name',
        type: 'title',
        title: {},
      },
      ...properties,
    },
    parent: {
      type: 'page_id',
      page_id: 'parent_page_id',
    },
    url: `https://notion.so/db_${Math.random().toString(36).substr(2, 9)}`,
    archived: false,
    in_trash: false,
    is_inline: false,
    public_url: null,
  };
}

// Test Array Generator
export function generateTestArray<T>(generator: () => T, count: number = 100): T[] {
  return Array.from({ length: count }, generator);
}

// Random String Generator
export function generateRandomString(length: number = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

// Random Date Generator
export function generateRandomDate(start?: Date, end?: Date): string {
  const startTime = start?.getTime() ?? Date.now() - 365 * 24 * 60 * 60 * 1000; // 1 year ago
  const endTime = end?.getTime() ?? Date.now();

  return new Date(startTime + Math.random() * (endTime - startTime)).toISOString();
}

// Error Generators for testing error handling
export function createNotionError(
  status: number,
  code: string,
  message: string
): Error & { status?: number; code?: string; headers?: Record<string, unknown> } {
  const error = new Error(message) as Error & {
    status?: number;
    code?: string;
    headers?: Record<string, unknown>;
  };
  error.status = status;
  error.code = code;
  error.headers = {};
  return error;
}

export function createRateLimitError(): Error & { status?: number; code?: string } {
  return createNotionError(429, 'rate_limited', 'Request was rate limited.');
}

export function createValidationError(): Error & { status?: number; code?: string } {
  return createNotionError(400, 'validation_error', 'The request body does not match the schema.');
}

export function createNotFoundError(): Error & { status?: number; code?: string } {
  return createNotionError(404, 'object_not_found', 'Could not find database with ID.');
}

export function createUnauthorizedError(): Error & { status?: number; code?: string } {
  return createNotionError(401, 'unauthorized', 'Unauthorized access.');
}

// Performance Testing Helpers
export function createLargeDataset(size: number): Array<{
  id: string;
  data: string;
  nested: { array: string[]; object: Record<string, string> };
}> {
  return generateTestArray(
    () => ({
      id: generateRandomString(),
      data: generateRandomString(1000), // 1KB per item
      nested: {
        array: generateTestArray(() => generateRandomString(), 10),
        object: Object.fromEntries(
          generateTestArray(() => [generateRandomString(5), generateRandomString()], 5)
        ),
      },
    }),
    size
  );
}

// Mock API Response Generators
export function createQueryResponse(
  pages: unknown[] = [],
  hasMore: boolean = false,
  nextCursor?: string
): {
  results: unknown[];
  next_cursor: string | null;
  has_more: boolean;
  type: 'page_or_database';
  page_or_database: {};
} {
  return {
    results: pages,
    next_cursor: hasMore ? nextCursor || 'next_cursor' : null,
    has_more: hasMore,
    type: 'page_or_database' as const,
    page_or_database: {},
  };
}

export function createCreateResponse(
  pageData: Record<string, unknown> = {}
): Record<string, unknown> {
  return createMockPage(pageData);
}

export function createUpdateResponse(
  pageData: Record<string, unknown> = {}
): Record<string, unknown> {
  return createMockPage(pageData);
}

export function createRetrieveResponse(
  pageData: Record<string, unknown> = {}
): Record<string, unknown> {
  return createMockPage(pageData);
}
