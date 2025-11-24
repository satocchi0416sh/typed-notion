/**
 * Basic Usage Example - Clean API demonstration
 */

import { createTypedSchema, NotionClient } from '../src/index.js';

// Define a schema
const taskSchema = createTypedSchema({
  databaseId: 'your-database-id',
  properties: {
    Title: { type: 'title' },
    Status: {
      type: 'select',
      options: ['Todo', 'In Progress', 'Done'] as const,
    },
    Priority: { type: 'number' },
    IsCompleted: { type: 'checkbox' },
    DueDate: { type: 'date' },
    AssigneeEmail: { type: 'email' },
  },
} as const);

// Initialize client
const client = new NotionClient({
  auth: process.env.NOTION_TOKEN!,
  conversionConfig: {
    strictTypeValidation: true,
    preserveRichTextFormatting: true,
    missingPropertyStrategy: 'null',
    performance: {
      enableCaching: true,
      cacheMaxSize: 100,
      enableMetrics: true,
    },
  },
});

export async function demonstrateCRUD() {
  // CREATE
  const newTask = await client.create(taskSchema, {
    Title: 'Implement feature X',
    Status: 'Todo',
    Priority: 5,
    IsCompleted: false,
    DueDate: new Date('2024-01-15'),
    AssigneeEmail: 'dev@company.com',
  });

  // READ with filters
  const activeTasks = await client.query(taskSchema, {
    filter: {
      and: [
        { property: 'Status', select: { does_not_equal: 'Done' } },
        { property: 'Priority', number: { greater_than: 3 } },
      ],
    },
    sorts: [{ property: 'DueDate', direction: 'ascending' }],
  });

  // READ single page
  const task = await client.getPage(taskSchema, newTask.id);

  // UPDATE
  const updatedTask = await client.update(taskSchema, newTask.id, {
    Status: 'In Progress',
    IsCompleted: false,
  });

  return {
    created: newTask,
    queried: activeTasks,
    retrieved: task,
    updated: updatedTask,
  };
}

export function demonstrateTypeInference() {
  // Type inference examples
  type _TaskProperties = typeof taskSchema.properties;

  const exampleTask: {
    Title: string | null;
    Status: 'Todo' | 'In Progress' | 'Done' | null;
    Priority: number | null;
    IsCompleted: boolean | null;
    DueDate: Date | null;
    AssigneeEmail: string | null;
  } = {
    Title: 'Type-safe task',
    Status: 'Todo',
    Priority: 5,
    IsCompleted: false,
    DueDate: new Date(),
    AssigneeEmail: 'user@example.com',
  };

  return exampleTask;
}

export function demonstrateZodIntegration() {
  // Generate Zod schema
  const zodSchema = taskSchema.toZod();

  // Validate data
  const isValid = taskSchema.validate({
    Title: 'Valid task',
    Status: 'Todo',
  });

  return { zodSchema, isValid };
}
