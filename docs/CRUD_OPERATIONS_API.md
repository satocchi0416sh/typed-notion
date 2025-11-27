# CRUD Operations API Documentation

This document provides comprehensive API documentation for the enhanced CRUD operations functionality in typed-notion-core-ts.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Components](#core-components)
- [Configuration Management](#configuration-management)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Performance](#performance)

## Overview

The enhanced CRUD operations system provides:

- **Type-safe database operations** with compile-time validation
- **Automatic Zod schema generation** to eliminate duplicate schemas
- **Advanced filtering system** with type-safe query building
- **Configuration management** with health monitoring
- **Comprehensive error handling** with actionable error messages
- **Performance optimization** with caching and metrics

## Quick Start

### Basic Setup

```typescript
import { createTypedSchema, NotionClient } from 'typed-notion-core-ts';

// 1. Define your schema with type safety
const taskSchema = createTypedSchema({
  databaseId: process.env.NOTION_DB_TASKS!,
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

// 2. Create client with configuration
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
```

### CRUD Operations

```typescript
// CREATE - Type-safe creation
const newTask = await client.create(taskSchema, {
  Title: 'Implement feature X',
  Status: 'Todo', // TypeScript enforces valid options
  Priority: 5,
  IsCompleted: false,
  DueDate: new Date('2024-01-15'),
  AssigneeEmail: 'dev@company.com',
});

// READ - Type-safe querying with filters
const activeTasks = await client.query(taskSchema, {
  filter: {
    and: [
      { property: 'Status', select: { does_not_equal: 'Done' } },
      { property: 'Priority', number: { greater_than: 3 } },
    ],
  },
  sorts: [
    { property: 'DueDate', direction: 'ascending' },
    { property: 'Priority', direction: 'descending' },
  ],
});

// READ - Get specific page
const task = await client.getPage(taskSchema, 'page-id');

// UPDATE - Partial updates with type safety
const updatedTask = await client.update(taskSchema, 'page-id', {
  Status: 'In Progress',
  IsCompleted: false,
});

// VALIDATE - Schema validation
const isValid = taskSchema.validate({
  Title: 'Valid task',
  Status: 'Todo',
});
```

## Core Components

### TypedSchema Enhanced Features

```typescript
// Generate Zod schema from Notion schema
const zodSchema = taskSchema.toZod();

// Use for validation
const validatedData = zodSchema.parse(userInput);

// Parse with error handling
try {
  const data = taskSchema.parse(userInput);
} catch (error) {
  console.log('Validation failed:', error.message);
}

// Get property information
const statusProperty = taskSchema.getProperty('Status');
const validator = taskSchema.createPropertyValidator();
```

### NotionClient Enhanced Methods

```typescript
// Schema validation against remote database
const validationResult = await client.validateSchema(taskSchema);
if (!validationResult.isValid) {
  console.log('Schema issues:', validationResult.errors);
}

// Performance metrics
const metrics = client.getPerformanceMetrics();
console.log(`Cache hit rate: ${metrics.cacheHitRate}%`);

// Clear caches
client.clearCaches();
```

### Filter System

```typescript
import { FilterBuilder, FilterValidator, FilterConverter } from 'typed-notion-core-ts';

// Build complex filters programmatically
const builder = new FilterBuilder({ definition: taskSchema.definition });
const filter = builder
  .where('Status', { equals: 'Todo' })
  .and({
    or: [
      { property: 'Priority', number: { greater_than: 5 } },
      { property: 'DueDate', date: { before: '2024-01-01' } },
    ],
  })
  .build();

// Validate filters
const validator = new FilterValidator({ definition: taskSchema.definition });
const isValidFilter = validator.validate(filter);

// Convert to Notion API format
const converter = new FilterConverter();
const notionFilter = converter.toNotionFilter(filter);
```

## Configuration Management

### Environment Configuration

```typescript
import {
  getEnvironmentConfig,
  getDatabaseConfigurationManager,
  createConfigurationMonitor,
} from 'typed-notion-core-ts';

// Environment variable patterns
// NOTION_DB_TASKS=12345678-1234-5678-9abc-123456789abc
// NOTION_DB_PROJECTS=87654321-4321-8765-cba9-876543210fed

const envConfig = getEnvironmentConfig();

// Check database ID resolution
const hasTasksDb = envConfig.hasDatabaseId('tasks');
const tasksDbId = envConfig.resolveDatabaseId('tasks');

// Validate configuration
const validation = envConfig.validateConfiguration(['tasks', 'projects']);
if (!validation.isValid) {
  console.log('Configuration errors:', validation.errors);
}
```

### Schema Registration & Management

```typescript
// Get configuration manager
const configManager = getDatabaseConfigurationManager();
configManager.setNotionClient(client);

// Register schemas
await configManager.registerSchema('tasks', taskSchema.definition);
await configManager.registerSchema('projects', projectSchema.definition);

// Check schema health
const isTasksHealthy = configManager.isSchemaHealthy('tasks');
const taskStatus = configManager.getSchemaStatus('tasks');

// Perform health check
const healthResult = await configManager.healthCheck();
console.log(`Healthy schemas: ${healthResult.healthySchemas}/${healthResult.totalSchemas}`);

// Validate all schemas against remote databases
await configManager.validateAllSchemas();
```

### Configuration Monitoring

```typescript
// Create monitor with configuration
const monitor = createConfigurationMonitor(configManager, {
  healthCheckInterval: 60000, // 1 minute
  enableIssueDetection: true,
  maxConsecutiveFailures: 3,
  enablePerformanceTracking: true,
});

// Start monitoring
monitor.start();

// Check monitoring data
const stats = monitor.getStatistics();
console.log(`Health checks: ${stats.totalHealthChecks}`);
console.log(
  `Success rate: ${((stats.successfulChecks / stats.totalHealthChecks) * 100).toFixed(1)}%`
);

// Get detected issues
const issues = monitor.getDetectedIssues();
issues.forEach(issue => {
  console.log(`${issue.severity}: ${issue.message}`);
  if (issue.suggestion) {
    console.log(`Suggestion: ${issue.suggestion}`);
  }
});

// Get health trends
const trends = monitor.getHealthTrends(3600000); // Last hour
trends.forEach(trend => {
  console.log(`${trend.timestamp}: ${trend.healthPercentage}% healthy`);
});

// Stop monitoring
monitor.stop();
```

## Examples

### Complete CRM Example

```typescript
const customerSchema = createTypedSchema({
  databaseId: process.env.NOTION_DB_CUSTOMERS!,
  properties: {
    CompanyName: { type: 'title' },
    ContactEmail: { type: 'email' },
    Website: { type: 'url' },
    Industry: {
      type: 'select',
      options: ['Technology', 'Healthcare', 'Finance'] as const,
    },
    Revenue: { type: 'number' },
    IsActive: { type: 'checkbox' },
    LastContact: { type: 'date' },
    AccountManager: { type: 'people' },
  },
} as const);

// Create customer with validation
const newCustomer = await client.create(customerSchema, {
  CompanyName: 'Acme Corp',
  ContactEmail: 'contact@acme.com',
  Website: 'https://acme.com',
  Industry: 'Technology',
  Revenue: 1000000,
  IsActive: true,
  LastContact: new Date(),
});

// Query high-value active customers
const highValueCustomers = await client.query(customerSchema, {
  filter: {
    and: [
      { property: 'IsActive', checkbox: { equals: true } },
      { property: 'Revenue', number: { greater_than: 500000 } },
    ],
  },
  sorts: [{ property: 'Revenue', direction: 'descending' }],
});
```

### Zod Integration Example

```typescript
// Generate Zod schema from Notion schema
const zodSchema = customerSchema.toZod();

// Create extended schema with business logic
const businessCustomerSchema = zodSchema
  .extend({
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
    score: z.number().min(0).max(100),
  })
  .refine(
    data => {
      // High revenue customers must have account manager
      if (data.Revenue && data.Revenue > 1000000 && !data.AccountManager) {
        return false;
      }
      return true;
    },
    {
      message: 'High-value customers must have an assigned account manager',
    }
  );

// Use for form validation
const formData = businessCustomerSchema.parse(userInput);

// Bulk validation
const validationResults = customerRecords.map(record => {
  try {
    const validated = zodSchema.parse(record);
    return { success: true, data: validated };
  } catch (error) {
    return { success: false, error: error.errors };
  }
});
```

## Error Handling

### Error Types

```typescript
import {
  TypedNotionError,
  SchemaValidationError,
  PropertyValidationError,
  ConfigurationError,
  ConversionError,
  NotionAPIError,
} from 'typed-notion-core-ts';

try {
  await client.create(taskSchema, invalidData);
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.log('Schema validation failed:', error.context);
  } else if (error instanceof ConfigurationError) {
    console.log('Configuration issue:', error.context);
  } else if (error instanceof NotionAPIError) {
    console.log('API error:', error.context.status, error.context.message);
  }
}
```

### Result Pattern (Safe Operations)

```typescript
import { Result, isOk, isErr, createOk, createErr } from 'typed-notion-core-ts';

function safeParseProfessional(input: unknown): Result<CustomerData, ValidationError> {
  try {
    const data = customerSchema.parse(input);
    return createOk(data);
  } catch (error) {
    return createErr(new ValidationError('Invalid customer data'));
  }
}

const result = safeParseProfessional(userInput);
if (isOk(result)) {
  console.log('Valid data:', result.value);
} else {
  console.log('Validation error:', result.error.message);
}
```

## Performance

### Caching Configuration

```typescript
const client = new NotionClient({
  auth: process.env.NOTION_TOKEN!,
  conversionConfig: {
    performance: {
      enableCaching: true,
      cacheMaxSize: 500, // Number of cached items
      enableMetrics: true, // Track performance metrics
    },
  },
});

// Cache operations
const factory = getTransformerFactory(100); // Set cache size
const stats = factory.getCacheStats();
console.log(`Cache usage: ${stats.size}/${stats.maxSize}`);

// Clear caches when needed
client.clearCaches();
factory.clearCache();
```

### Performance Monitoring

```typescript
// Built-in metrics
const metrics = client.getPerformanceMetrics();
console.log('Performance metrics:', {
  totalOperations: metrics.totalOperations,
  averageResponseTime: metrics.averageResponseTime,
  cacheHitRate: metrics.cacheHitRate,
  errorRate: metrics.errorRate,
});

// Custom performance measurement
import { measurePerformanceAsync, timed } from 'typed-notion-core-ts';

const { result, metrics: queryMetrics } = await measurePerformanceAsync(() =>
  client.query(taskSchema, complexFilter)
);

console.log(`Query took ${queryMetrics.duration}ms`);
```

### Rate Limiting

```typescript
// Built-in rate limiting handles Notion API limits
// Client automatically retries with exponential backoff

// Monitor rate limiting
const metrics = client.getPerformanceMetrics();
if (metrics.rateLimitHits > 0) {
  console.log('Rate limit encountered, requests were retried');
}
```

## Migration Guide

### From Previous Versions

```typescript
// Before: Basic schema
const oldSchema = {
  properties: {
    title: { type: 'title' },
    status: { type: 'select', options: ['todo', 'done'] },
  },
};

// After: Enhanced schema with database ID
const newSchema = createTypedSchema({
  databaseId: 'your-database-id', // Required
  properties: {
    title: { type: 'title' },
    status: {
      type: 'select',
      options: ['todo', 'done'] as const, // Use `as const` for literal types
    },
  },
} as const); // Use `as const` for schema

// Benefits of migration:
// - Type-safe property access
// - Automatic Zod schema generation
// - Runtime validation
// - Better error messages
// - Performance optimization
```

### Best Practices

1. **Environment Variables**: Use `NOTION_DB_[SCHEMA_NAME]` pattern
2. **Type Safety**: Always use `as const` for schemas and options
3. **Error Handling**: Implement proper error catching and logging
4. **Performance**: Enable caching and monitor metrics in production
5. **Validation**: Validate schemas during development and deployment
6. **Monitoring**: Use configuration monitoring for production systems

This completes the API documentation for the enhanced CRUD operations functionality.
