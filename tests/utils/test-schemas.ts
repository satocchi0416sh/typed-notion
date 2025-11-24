/**
 * Common test schemas for use across test suites
 *
 * Provides standardized schema definitions and mock data
 * to ensure consistent testing across all test files.
 */

import type { SchemaDefinition } from '../../src/types/core.js';

export const basicSchema: SchemaDefinition = {
  properties: {
    title: { type: 'title' },
    status: { type: 'select', options: ['Active', 'Inactive', 'Pending'] },
    priority: { type: 'select', options: ['High', 'Medium', 'Low'] },
    count: { type: 'number' },
    completed: { type: 'checkbox' },
    dueDate: { type: 'date' },
    description: { type: 'rich_text' },
    email: { type: 'email' },
    url: { type: 'url' },
  },
};

export const complexSchema: SchemaDefinition = {
  properties: {
    title: { type: 'title' },
    tags: { type: 'multi_select', options: ['urgent', 'feature', 'bug', 'enhancement'] },
    assignees: { type: 'people' },
    createdAt: { type: 'created_time' },
    lastEdited: { type: 'last_edited_time' },
    createdBy: { type: 'created_by' },
    lastEditedBy: { type: 'last_edited_by' },
    category: { type: 'select', options: ['Development', 'Design', 'Marketing', 'Sales'] },
    budget: { type: 'number' },
    archived: { type: 'checkbox' },
    startDate: { type: 'date' },
    notes: { type: 'rich_text' },
    projectUrl: { type: 'url' },
    contactEmail: { type: 'email' },
  },
};

export const minimalSchema: SchemaDefinition = {
  properties: {
    title: { type: 'title' },
    status: { type: 'checkbox' },
  },
};

export const allPropertiesSchema: SchemaDefinition = {
  properties: {
    // Text properties
    title: { type: 'title' },
    description: { type: 'rich_text' },
    email: { type: 'email' },
    url: { type: 'url' },

    // Number properties
    count: { type: 'number' },

    // Boolean properties
    completed: { type: 'checkbox' },

    // Date properties
    dueDate: { type: 'date' },
    createdAt: { type: 'created_time' },
    lastEdited: { type: 'last_edited_time' },

    // Selection properties
    status: { type: 'select', options: ['Todo', 'In Progress', 'Done'] },
    tags: { type: 'multi_select', options: ['urgent', 'feature', 'bug'] },

    // People properties
    assignees: { type: 'people' },
    createdBy: { type: 'created_by' },
    lastEditedBy: { type: 'last_edited_by' },
  },
};
