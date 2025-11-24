/**
 * Configuration Management Example - Clean API demonstration
 */

import {
  createTypedSchema,
  NotionClient,
  getDatabaseConfigurationManager,
  createConfigurationMonitor,
  getEnvironmentConfig,
} from '../src/index.js';

const projectSchema = createTypedSchema({
  databaseId: 'project-db-id',
  properties: {
    ProjectName: { type: 'title' },
    Status: {
      type: 'select',
      options: ['Planning', 'Active', 'On Hold', 'Completed'] as const,
    },
    StartDate: { type: 'date' },
    Budget: { type: 'number' },
    ProjectManager: { type: 'people' },
  },
} as const);

export async function demonstrateConfiguration() {
  const envConfig = getEnvironmentConfig();
  const configManager = getDatabaseConfigurationManager();
  const client = new NotionClient({ auth: process.env.NOTION_TOKEN! });

  configManager.setNotionClient(client);

  // Register schemas
  await configManager.registerSchema('projects', projectSchema.definition);

  // Check health
  const healthResult = await configManager.healthCheck();

  return {
    hasConfig: envConfig.hasDatabaseId('projects'),
    healthCheck: healthResult,
    schemaCount: configManager.getRegistrationCount(),
  };
}

export function demonstrateMonitoring() {
  const configManager = getDatabaseConfigurationManager();

  const monitor = createConfigurationMonitor(configManager, {
    healthCheckInterval: 60000,
    enableIssueDetection: true,
    maxConsecutiveFailures: 3,
    enablePerformanceTracking: true,
  });

  // Start monitoring
  monitor.start();

  // Get statistics
  const stats = monitor.getStatistics();
  const issues = monitor.getDetectedIssues();

  // Stop monitoring
  monitor.stop();

  return {
    isRunning: monitor.isRunning(),
    statistics: stats,
    issues: issues.length,
  };
}
