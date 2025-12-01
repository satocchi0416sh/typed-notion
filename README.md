# typed-notion-core-ts

[![npm version](https://badge.fury.io/js/typed-notion-core-ts.svg)](https://badge.fury.io/js/typed-notion-core-ts)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Type-safe Notion API library** with compile-time validation and runtime type inference.

## Key Features

- **Type Safety First**: End-to-end type safety from schema definition to API response
- **Complex Properties**: Full type inference for Rollups and Formulas using helper functions
- **Zero Dependencies**: Lightweight (7.75KB gzipped) and ideal for edge environments
- **Runtime Validation**: Protects your application from silent schema changes in Notion

## Installation

```bash
npm install typed-notion-core-ts
```

## Quick Start

The core philosophy is **"Schema First"**. Define your schema, and get types for free.

```typescript
import { createTypedSchema, NotionClient, rollup, formula } from 'typed-notion-core-ts';

// 1. Define your Notion database schema
const projectSchema = createTypedSchema({
  title: { type: 'title' },
  status: {
    type: 'select',
    options: ['Planning', 'In Progress', 'Done'],
  },
  // ✨ Automatic type inference for complex properties
  taskCount: rollup('Tasks', 'Name', 'count'), // -> number | null
  isOverdue: formula('boolean', 'prop("Due") < now()'), // -> boolean | null
});

// 2. Initialize the client
const client = new NotionClient({ auth: process.env.NOTION_TOKEN });

// 3. Type-safe database operations
const newProject = await client.create(projectSchema, {
  title: 'Website Redesign',
  status: 'Planning', // ✅ Auto-completed & Validated
  // taskCount and isOverdue are read-only, excluded from creation
});

// 4. Type-safe response
const project = await client.getPage(projectSchema, newProject.id);
if (project.isOverdue) {
  console.log(`Warning: ${project.title} has ${project.taskCount} tasks!`);
}
```

## Core Concepts

### Schema Definition

Define your database structure once, use it everywhere with full type safety:

```typescript
import { createTypedSchema, formula, rollup } from 'typed-notion-core-ts';

const schema = createTypedSchema({
  // Basic properties
  title: { type: 'title' },
  completed: { type: 'checkbox' },
  priority: {
    type: 'select',
    options: ['Low', 'Medium', 'High', 'Urgent'],
  },
  tags: {
    type: 'multi_select',
    options: ['Frontend', 'Backend', 'Design', 'Bug'],
  },
  assignee: { type: 'people' },
  dueDate: { type: 'date' },

  // Complex properties with type inference
  totalBudget: rollup('Expenses', 'Amount', 'sum'), // -> number | null
  lastUpdate: rollup('Activity', 'Date', 'latest'), // -> Date | null
  progress: formula('number', 'prop("Completed") / prop("Total") * 100'),
  statusLabel: formula('string', 'concat("Task: ", prop("Title"))'),
});
```

### Type Inference

Export TypeScript types directly from your runtime schema:

```typescript
import { InferSchemaProperties } from 'typed-notion-core-ts';

// Automatically inferred from schema
type Project = InferSchemaProperties<typeof projectSchema>;

function processProject(project: Project) {
  // TypeScript knows exact types
  if (project.status === 'Done') {
    // ✅ 'Planning' | 'In Progress' | 'Done'
    console.log(project.taskCount); // ✅ number | null
    console.log(project.title); // ✅ string
  }
}
```

## Database Operations

### Query with Filters

```typescript
const activeProjects = await client.query(projectSchema, {
  filter: {
    and: [
      { property: 'status', select: { equals: 'In Progress' } },
      { property: 'taskCount', number: { greater_than: 0 } },
    ],
  },
  sorts: [{ property: 'dueDate', direction: 'ascending' }],
});

// Type-safe iteration
activeProjects.results.forEach(project => {
  // project is fully typed based on schema
  console.log(`${project.title}: ${project.taskCount} tasks`);
});
```

### Create and Update

```typescript
// Create - only writable properties allowed
const task = await client.create(taskSchema, {
  title: 'Implement authentication',
  priority: 'High',
  tags: ['Backend', 'Security'],
  assignee: [{ id: 'user-id' }],
});

// Update - partial updates supported
await client.update(task.id, taskSchema, {
  completed: true,
  tags: ['Backend', 'Security', 'Done'],
});
```

### Pagination

```typescript
let allProjects = [];
let hasMore = true;
let cursor = undefined;

while (hasMore) {
  const response = await client.query(projectSchema, {
    page_size: 100,
    start_cursor: cursor,
  });

  allProjects.push(...response.results);
  hasMore = response.has_more;
  cursor = response.next_cursor;
}
```

## Advanced Features

### Complex Property Helpers

Helper functions provide ergonomic API for defining complex properties:

```typescript
import { rollup, formula, union } from 'typed-notion-core-ts';

const advancedSchema = createTypedSchema({
  // Rollup with automatic type inference
  totalSpent: rollup('Transactions', 'Amount', 'sum'),
  earliestTask: rollup('Tasks', 'Created', 'earliest'),

  // Formula with explicit type hints
  isUrgent: formula('boolean'),
  displayName: formula('string'),
  score: formula('number'),

  // Union types for conditional formulas
  dynamicValue: formula(union('string', 'number'), 'if(prop("IsText"), "Text Value", 42)'), // -> string | number | null
});
```

### Schema Validation

Validate that your local schema matches the actual Notion database:

```typescript
const validation = await client.validateSchema(projectSchema);

if (!validation.isValid) {
  console.error('Schema mismatch detected:');
  validation.errors.forEach(error => {
    console.error(`- ${error.property}: ${error.message}`);
  });
}
```

### Performance Monitoring

Built-in performance tracking for optimization:

```typescript
const metrics = client.getPerformanceMetrics();
console.log(`Average response time: ${metrics.averageResponseTime}ms`);
console.log(`Cache hit rate: ${metrics.cacheHitRate}%`);

// Clear cache when needed
client.clearCaches();
```

### Configuration Management

```typescript
import { DatabaseConfigManager } from 'typed-notion-core-ts';

const config = new DatabaseConfigManager();

// Set database IDs from environment
config.setDatabaseId('projects', process.env.PROJECTS_DB_ID);
config.setDatabaseId('tasks', process.env.TASKS_DB_ID);

// Auto-resolve database IDs
const projects = await client.query(projectSchema); // Uses configured ID
```

## API Reference

### Schema Creation

- `createTypedSchema(definition)` - Create a typed schema from property definitions
- `rollup(relation, property, function)` - Define a rollup property with type inference
- `formula(returnType, expression?)` - Define a formula with explicit type hint
- `union(...types)` - Create union type for complex formulas

### Client Operations

- `new NotionClient(config)` - Initialize Notion client with authentication
- `client.query(schema, options?)` - Query database with filters and sorting
- `client.create(schema, data)` - Create new database entry
- `client.update(id, schema, data)` - Update existing entry
- `client.getPage(schema, id)` - Retrieve single page by ID
- `client.validateSchema(schema)` - Validate schema against database

### Type Utilities

- `InferSchemaProperties<T>` - Extract TypeScript type from schema
- `PropertyType` - Union of all supported Notion property types
- `SchemaDefinition` - Type for schema configuration object

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development setup, testing guidelines, and submission process.

## License

MIT © Satoyoshi
