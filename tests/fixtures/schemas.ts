/**
 * Shared test fixtures for MVP Property Types
 * 
 * Provides reusable schema definitions and test data for all test files
 * Based on user stories and acceptance scenarios
 */

import type { SchemaDefinition, PropertyDefinition, NotionUser } from '../../src/types/core.js';

// ============================================================================
// BASIC SCHEMA FIXTURES (User Story 1)
// ============================================================================

/**
 * Basic schema with title, number, and checkbox properties
 * Used for User Story 1 testing: Basic Schema Definition
 */
export const basicUserSchema = {
  databaseId: '12345678-1234-5678-9abc-123456789abc',
  properties: {
    Name: { type: 'title' },
    Age: { type: 'number' },
    Active: { type: 'checkbox' }
  }
} as const satisfies SchemaDefinition;

/**
 * Minimal valid schema (just title property)
 */
export const minimalSchema = {
  databaseId: '87654321-4321-8765-cba9-987654321cba',
  properties: {
    Title: { type: 'title' }
  }
} as const satisfies SchemaDefinition;

/**
 * Schema with number formatting options
 */
export const financialSchema = {
  databaseId: '11111111-2222-3333-4444-555555555555',
  properties: {
    Name: { type: 'title' },
    Price: { type: 'number', format: 'dollar' },
    Discount: { type: 'number', format: 'percent' },
    Quantity: { type: 'number', format: 'number' }
  }
} as const satisfies SchemaDefinition;

// ============================================================================
// TEXT AND SELECTION SCHEMA FIXTURES (User Story 2)
// ============================================================================

/**
 * Schema with text and selection properties
 * Used for User Story 2 testing: Text and Selection Properties
 */
export const taskSchema = {
  databaseId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  properties: {
    Title: { type: 'title' },
    Description: { type: 'rich_text' },
    Status: { 
      type: 'select', 
      options: ['Todo', 'In Progress', 'Done'] as const 
    },
    Tags: { 
      type: 'multi_select',
      options: ['Bug', 'Feature', 'Enhancement', 'Documentation'] as const
    }
  }
} as const satisfies SchemaDefinition;

/**
 * Schema with comprehensive selection options
 */
export const projectSchema = {
  databaseId: 'ffffffff-eeee-dddd-cccc-bbbbbbbbbbbb',
  properties: {
    Name: { type: 'title' },
    Priority: { 
      type: 'select',
      options: ['Low', 'Medium', 'High', 'Critical'] as const
    },
    Categories: {
      type: 'multi_select',
      options: ['Frontend', 'Backend', 'DevOps', 'Design', 'Testing'] as const
    },
    Notes: { type: 'rich_text' }
  }
} as const satisfies SchemaDefinition;

// ============================================================================
// CONTACT AND DATE SCHEMA FIXTURES (User Story 3)
// ============================================================================

/**
 * Schema with date and contact properties
 * Used for User Story 3 testing: Date and Contact Properties
 */
export const contactSchema = {
  databaseId: '99999999-8888-7777-6666-555555555555',
  properties: {
    Name: { type: 'title' },
    Email: { type: 'email' },
    Website: { type: 'url' },
    JoinedAt: { type: 'date' },
    TeamMembers: { type: 'people' }
  }
} as const satisfies SchemaDefinition;

/**
 * Event schema with comprehensive date and contact properties
 */
export const eventSchema = {
  databaseId: '00000000-1111-2222-3333-444444444444',
  properties: {
    EventName: { type: 'title' },
    StartDate: { type: 'date' },
    EndDate: { type: 'date' },
    Organizers: { type: 'people' },
    RegistrationUrl: { type: 'url' },
    ContactEmail: { type: 'email' },
    Description: { type: 'rich_text' },
    IsActive: { type: 'checkbox' }
  }
} as const satisfies SchemaDefinition;

// ============================================================================
// INVALID SCHEMA FIXTURES (For Error Testing)
// ============================================================================

/**
 * Schema without title property (should fail validation)
 */
export const schemaWithoutTitle = {
  databaseId: 'invalid1-1111-1111-1111-111111111111',
  properties: {
    Description: { type: 'rich_text' },
    Count: { type: 'number' }
  }
};

/**
 * Schema with multiple title properties (should fail validation)
 */
export const schemaWithMultipleTitles = {
  databaseId: 'invalid2-2222-2222-2222-222222222222',
  properties: {
    Title1: { type: 'title' },
    Title2: { type: 'title' },
    Description: { type: 'rich_text' }
  }
};

/**
 * Schema with empty select options (should fail validation)
 */
export const schemaWithEmptySelect = {
  databaseId: 'invalid3-3333-3333-3333-333333333333',
  properties: {
    Name: { type: 'title' },
    Status: { type: 'select', options: [] }
  }
};

/**
 * Schema with invalid database ID format
 */
export const schemaWithInvalidId = {
  databaseId: 'not-a-valid-uuid',
  properties: {
    Name: { type: 'title' }
  }
};

// ============================================================================
// NOTION USER FIXTURES
// ============================================================================

/**
 * Sample Notion users for people property testing
 */
export const sampleUsers: NotionUser[] = [
  {
    id: 'user-1111-1111-1111-111111111111',
    name: 'Alice Johnson',
    avatar_url: 'https://example.com/avatar1.jpg',
    type: 'person'
  },
  {
    id: 'user-2222-2222-2222-222222222222',
    name: 'Bob Smith',
    avatar_url: 'https://example.com/avatar2.jpg',
    type: 'person'
  },
  {
    id: 'bot-3333-3333-3333-333333333333',
    name: 'AutoBot',
    type: 'bot'
  }
];

/**
 * Sample user without optional fields
 */
export const minimalUser: NotionUser = {
  id: 'user-minimal-1111-1111-111111111111',
  type: 'person'
};

// ============================================================================
// QUERY RESULT FIXTURES
// ============================================================================

/**
 * Sample query results for basic schema
 */
export const basicUserResults = [
  {
    id: 'page-1111-1111-1111-111111111111',
    props: {
      Name: 'John Doe',
      Age: 25,
      Active: true
    },
    createdTime: new Date('2023-01-01T00:00:00Z'),
    lastEditedTime: new Date('2023-01-02T00:00:00Z')
  },
  {
    id: 'page-2222-2222-2222-222222222222',
    props: {
      Name: 'Jane Smith',
      Age: null,
      Active: false
    },
    createdTime: new Date('2023-01-03T00:00:00Z'),
    lastEditedTime: new Date('2023-01-03T00:00:00Z')
  }
] as const;

/**
 * Sample query results for task schema
 */
export const taskResults = [
  {
    id: 'task-1111-1111-1111-111111111111',
    props: {
      Title: 'Implement user authentication',
      Description: 'Add login and registration functionality',
      Status: 'In Progress' as const,
      Tags: ['Feature', 'Enhancement'] as const
    },
    createdTime: new Date('2023-02-01T00:00:00Z'),
    lastEditedTime: new Date('2023-02-02T00:00:00Z')
  },
  {
    id: 'task-2222-2222-2222-222222222222',
    props: {
      Title: 'Fix login bug',
      Description: null,
      Status: 'Done' as const,
      Tags: ['Bug'] as const
    },
    createdTime: new Date('2023-02-03T00:00:00Z'),
    lastEditedTime: new Date('2023-02-04T00:00:00Z')
  }
] as const;

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Generate a valid UUID for testing
 */
export function generateTestUUID(): string {
  return 'test-' + Math.random().toString(16).substring(2, 15) + '-' +
         Math.random().toString(16).substring(2, 15) + '-' +
         Math.random().toString(16).substring(2, 15);
}

/**
 * Create a test schema with a random UUID
 */
export function createTestSchema(properties: Record<string, PropertyDefinition>): SchemaDefinition {
  return {
    databaseId: generateTestUUID(),
    properties
  };
}