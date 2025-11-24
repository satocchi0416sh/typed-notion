/**
 * Database Configuration Manager for typed-notion-core-ts
 *
 * Manages database configurations and schema registrations
 * with health checking and monitoring capabilities.
 */

import type { SchemaDefinition } from '../types/core.js';
import type { NotionClient } from '../client/notion-client.js';
import { SchemaRegistrationError, ConfigurationError } from '../errors/index.js';
import { getEnvironmentConfig, type EnvironmentConfig } from './environment.js';

/**
 * Configuration status for a registered schema
 */
export interface SchemaConfigStatus {
  schemaName: string;
  databaseId: string;
  isHealthy: boolean;
  lastHealthCheck?: Date;
  lastError?: string;
  validationStatus?: 'valid' | 'invalid' | 'unchecked';
  propertyCount?: number;
}

/**
 * Health check result for database configuration
 */
export interface HealthCheckResult {
  healthy: boolean;
  totalSchemas: number;
  healthySchemas: number;
  unhealthySchemas: number;
  errors: Array<{
    schemaName: string;
    error: string;
  }>;
  timestamp: Date;
}

/**
 * Configuration manager for database schemas
 */
export interface ConfigurationManager {
  registerSchema(schemaName: string, schema: SchemaDefinition): Promise<void>;
  unregisterSchema(schemaName: string): void;
  getSchemaStatus(schemaName: string): SchemaConfigStatus | null;
  getAllSchemaStatuses(): SchemaConfigStatus[];
  healthCheck(): Promise<HealthCheckResult>;
  validateAllSchemas(): Promise<void>;
  isSchemaHealthy(schemaName: string): boolean;
  clearCache(): void;
}

/**
 * Database Configuration Manager implementation
 */
export class DatabaseConfigurationManager implements ConfigurationManager {
  private readonly registeredSchemas = new Map<string, SchemaDefinition>();
  private readonly schemaStatuses = new Map<string, SchemaConfigStatus>();
  private readonly environmentConfig: EnvironmentConfig;
  private notionClient: NotionClient | null = null;

  constructor(environmentConfig?: EnvironmentConfig) {
    this.environmentConfig = environmentConfig || getEnvironmentConfig();
  }

  /**
   * Set NotionClient for remote validation
   */
  setNotionClient(client: NotionClient): void {
    this.notionClient = client;
  }

  /**
   * Register a schema with the configuration manager
   */
  async registerSchema(schemaName: string, schema: SchemaDefinition): Promise<void> {
    try {
      // Validate schema structure
      if (!schema.databaseId || !schema.properties) {
        throw new SchemaRegistrationError(
          `Invalid schema structure for '${schemaName}'`,
          schemaName,
          [
            {
              type: 'INVALID_STRUCTURE',
              message: 'Schema must have databaseId and properties',
            },
          ]
        );
      }

      // Check if database ID can be resolved
      const databaseId = this.environmentConfig.hasDatabaseId(schemaName)
        ? this.environmentConfig.resolveDatabaseId(schemaName)
        : schema.databaseId;

      // Store schema
      this.registeredSchemas.set(schemaName, schema);

      // Initialize status
      const status: SchemaConfigStatus = {
        schemaName,
        databaseId,
        isHealthy: true,
        lastHealthCheck: new Date(),
        validationStatus: 'unchecked',
        propertyCount: Object.keys(schema.properties).length,
      };

      this.schemaStatuses.set(schemaName, status);

      // Perform initial validation if client is available
      if (this.notionClient) {
        await this.validateSchema(schemaName);
      }
    } catch (error) {
      throw new SchemaRegistrationError(
        `Failed to register schema '${schemaName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        schemaName
      );
    }
  }

  /**
   * Unregister a schema
   */
  unregisterSchema(schemaName: string): void {
    this.registeredSchemas.delete(schemaName);
    this.schemaStatuses.delete(schemaName);
  }

  /**
   * Get status for a specific schema
   */
  getSchemaStatus(schemaName: string): SchemaConfigStatus | null {
    return this.schemaStatuses.get(schemaName) || null;
  }

  /**
   * Get all schema statuses
   */
  getAllSchemaStatuses(): SchemaConfigStatus[] {
    return Array.from(this.schemaStatuses.values());
  }

  /**
   * Perform health check on all registered schemas
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const errors: Array<{ schemaName: string; error: string }> = [];
    let healthySchemas = 0;
    let unhealthySchemas = 0;

    for (const [schemaName, schema] of this.registeredSchemas) {
      try {
        // Check database ID resolution
        const canResolve = this.environmentConfig.hasDatabaseId(schemaName);

        // Check schema structure
        const hasValidStructure = !!(schema.databaseId && schema.properties);

        // Update status
        const status = this.schemaStatuses.get(schemaName);
        if (status) {
          status.isHealthy = canResolve || hasValidStructure;
          status.lastHealthCheck = new Date();

          if (status.isHealthy) {
            healthySchemas++;
          } else {
            unhealthySchemas++;
            errors.push({
              schemaName,
              error: !canResolve ? 'Database ID cannot be resolved' : 'Invalid schema structure',
            });
          }
        }
      } catch (error) {
        unhealthySchemas++;
        errors.push({
          schemaName,
          error: error instanceof Error ? error.message : 'Health check failed',
        });

        // Update status
        const status = this.schemaStatuses.get(schemaName);
        if (status) {
          status.isHealthy = false;
          status.lastHealthCheck = new Date();
          status.lastError = error instanceof Error ? error.message : 'Health check failed';
        }
      }
    }

    return {
      healthy: unhealthySchemas === 0,
      totalSchemas: this.registeredSchemas.size,
      healthySchemas,
      unhealthySchemas,
      errors,
      timestamp: new Date(),
    };
  }

  /**
   * Validate all schemas against remote database
   */
  async validateAllSchemas(): Promise<void> {
    if (!this.notionClient) {
      throw new ConfigurationError(
        'NotionClient not set for validation',
        'VALIDATION_FAILED',
        undefined,
        'Call setNotionClient() before validation'
      );
    }

    const validationPromises: Promise<void>[] = [];

    for (const schemaName of this.registeredSchemas.keys()) {
      validationPromises.push(this.validateSchema(schemaName));
    }

    await Promise.all(validationPromises);
  }

  /**
   * Validate a single schema
   */
  private async validateSchema(schemaName: string): Promise<void> {
    const schema = this.registeredSchemas.get(schemaName);
    const status = this.schemaStatuses.get(schemaName);

    if (!schema || !status) {
      return;
    }

    if (!this.notionClient) {
      return;
    }

    try {
      // Use NotionClient's validateSchema method
      const tempSchema = { definition: schema, propertyNames: Object.keys(schema.properties) };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validationResult = await this.notionClient.validateSchema(tempSchema as any);

      // Update status based on validation result
      status.validationStatus = validationResult.isValid ? 'valid' : 'invalid';
      status.isHealthy = validationResult.isValid;
      status.lastHealthCheck = new Date();

      if (!validationResult.isValid && validationResult.errors.length > 0) {
        status.lastError = validationResult.errors.join(', ');
      } else {
        delete status.lastError;
      }
    } catch (error) {
      status.validationStatus = 'invalid';
      status.isHealthy = false;
      status.lastError = error instanceof Error ? error.message : 'Validation failed';
      status.lastHealthCheck = new Date();
    }
  }

  /**
   * Check if a schema is healthy
   */
  isSchemaHealthy(schemaName: string): boolean {
    const status = this.schemaStatuses.get(schemaName);
    return status?.isHealthy || false;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    // Clear status cache but keep registrations
    for (const status of this.schemaStatuses.values()) {
      status.validationStatus = 'unchecked';
      delete status.lastHealthCheck;
      delete status.lastError;
    }
  }

  /**
   * Get registration count
   */
  getRegistrationCount(): number {
    return this.registeredSchemas.size;
  }

  /**
   * Get all registered schema names
   */
  getRegisteredSchemaNames(): string[] {
    return Array.from(this.registeredSchemas.keys());
  }
}

// Export singleton instance
let globalManager: DatabaseConfigurationManager | null = null;

export function getDatabaseConfigurationManager(): DatabaseConfigurationManager {
  if (!globalManager) {
    globalManager = new DatabaseConfigurationManager();
  }
  return globalManager;
}

export function resetDatabaseConfigurationManager(): void {
  if (globalManager) {
    globalManager.clearCache();
  }
  globalManager = null;
}
