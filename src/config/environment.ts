/**
 * Environment Configuration Module for typed-notion-core-ts
 *
 * Handles automatic database ID resolution from environment variables
 * using the NOTION_DB_[SCHEMA_NAME] convention.
 */

import { ConfigurationError } from '../errors/index.js';

/**
 * Environment configuration interface for database ID resolution
 */
export interface EnvironmentConfig {
  resolveDatabaseId(schemaName: string): string;
  hasDatabaseId(schemaName: string): boolean;
  getAllDatabaseMappings(): Record<string, string>;
  validateConfiguration(requiredSchemas: string[]): ConfigurationValidationResult;
  setDatabaseId(schemaName: string, databaseId: string): void;
}

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  isValid: boolean;
  missingConfigurations: string[];
  invalidDatabaseIds: string[];
  suggestions: string[];
}

/**
 * Default implementation of environment configuration
 */
export class DefaultEnvironmentConfig implements EnvironmentConfig {
  private readonly envPrefix: string;
  private readonly customMappings: Map<string, string> = new Map();

  constructor(envPrefix = 'NOTION_DB_') {
    this.envPrefix = envPrefix;
  }

  /**
   * Resolve database ID from environment variables
   * @param schemaName - Name of the schema (will be uppercased)
   * @returns Database ID from environment variable
   * @throws ConfigurationError if database ID not found
   */
  resolveDatabaseId(schemaName: string): string {
    // Check custom mappings first
    const customId = this.customMappings.get(schemaName.toUpperCase());
    if (customId) {
      return customId;
    }

    // Build environment variable name
    const envVarName = `${this.envPrefix}${schemaName.toUpperCase()}`;
    const databaseId = process.env[envVarName];

    if (!databaseId) {
      throw new ConfigurationError(
        `Database ID not found for schema '${schemaName}'`,
        'MISSING_ENV',
        schemaName,
        `Set environment variable ${envVarName}=your_database_id`
      );
    }

    // Basic validation of database ID format
    if (!this.isValidDatabaseId(databaseId)) {
      throw new ConfigurationError(
        `Invalid database ID format for schema '${schemaName}': ${databaseId}`,
        'INVALID_DATABASE_ID',
        schemaName,
        'Database ID should be a UUID-like string'
      );
    }

    return databaseId;
  }

  /**
   * Check if database ID is configured for schema
   * @param schemaName - Name of the schema to check
   * @returns True if environment variable or custom mapping exists
   */
  hasDatabaseId(schemaName: string): boolean {
    // Check custom mappings first
    if (this.customMappings.has(schemaName.toUpperCase())) {
      return true;
    }

    // Check environment variable
    const envVarName = `${this.envPrefix}${schemaName.toUpperCase()}`;
    return Boolean(process.env[envVarName]);
  }

  /**
   * Get all configured database mappings
   * @returns Record of schema names to database IDs
   */
  getAllDatabaseMappings(): Record<string, string> {
    const mappings: Record<string, string> = {};

    // Add custom mappings
    for (const [schemaName, databaseId] of Array.from(this.customMappings.entries())) {
      mappings[schemaName] = databaseId;
    }

    // Scan environment variables with the prefix
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(this.envPrefix) && value) {
        const schemaName = key.slice(this.envPrefix.length);
        if (!mappings[schemaName]) {
          mappings[schemaName] = value;
        }
      }
    }

    return mappings;
  }

  /**
   * Validate environment configuration for required schemas
   * @param requiredSchemas - Array of schema names that must be configured
   * @returns Validation result with missing configurations and suggestions
   */
  validateConfiguration(requiredSchemas: string[]): ConfigurationValidationResult {
    const missingConfigurations: string[] = [];
    const invalidDatabaseIds: string[] = [];
    const suggestions: string[] = [];

    for (const schemaName of requiredSchemas) {
      if (!this.hasDatabaseId(schemaName)) {
        missingConfigurations.push(schemaName);
        const envVarName = `${this.envPrefix}${schemaName.toUpperCase()}`;
        suggestions.push(`Set ${envVarName}=your_database_id_for_${schemaName}`);
      } else {
        try {
          const databaseId = this.resolveDatabaseId(schemaName);
          if (!this.isValidDatabaseId(databaseId)) {
            invalidDatabaseIds.push(schemaName);
          }
        } catch (error) {
          if (error instanceof ConfigurationError && error.context.type === 'INVALID_DATABASE_ID') {
            invalidDatabaseIds.push(schemaName);
          }
        }
      }
    }

    const isValid = missingConfigurations.length === 0 && invalidDatabaseIds.length === 0;

    return {
      isValid,
      missingConfigurations,
      invalidDatabaseIds,
      suggestions,
    };
  }

  /**
   * Set database ID mapping (for testing or runtime configuration)
   * @param schemaName - Schema name (will be uppercased)
   * @param databaseId - Notion database ID
   */
  setDatabaseId(schemaName: string, databaseId: string): void {
    if (!this.isValidDatabaseId(databaseId)) {
      throw new ConfigurationError(
        `Invalid database ID format: ${databaseId}`,
        'INVALID_DATABASE_ID',
        schemaName,
        'Database ID should be a UUID-like string'
      );
    }

    this.customMappings.set(schemaName.toUpperCase(), databaseId);
  }

  /**
   * Validate database ID format
   * @param databaseId - Database ID to validate
   * @returns True if format appears valid
   */
  private isValidDatabaseId(databaseId: string): boolean {
    // Basic validation: should be 32 characters, alphanumeric with dashes
    // Notion database IDs are typically in UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // or 32 character hex strings without dashes
    if (!databaseId || typeof databaseId !== 'string') {
      return false;
    }

    // Remove dashes for validation
    const cleanId = databaseId.replace(/-/g, '');

    // Should be 32 hex characters
    return /^[a-f0-9]{32}$/i.test(cleanId);
  }
}

// Global instance for convenience
let defaultConfig: DefaultEnvironmentConfig | null = null;

/**
 * Get the global environment configuration instance
 * @param envPrefix - Optional custom environment variable prefix
 * @returns Environment configuration instance
 */
export function getEnvironmentConfig(envPrefix?: string): EnvironmentConfig {
  if (!defaultConfig || (envPrefix && envPrefix !== 'NOTION_DB_')) {
    defaultConfig = new DefaultEnvironmentConfig(envPrefix);
  }
  return defaultConfig;
}

/**
 * Reset the global configuration instance (useful for testing)
 */
export function resetEnvironmentConfig(): void {
  defaultConfig = null;
}

/**
 * Helper function to resolve database ID for a schema name
 * @param schemaName - Schema name to resolve
 * @param customConfig - Optional custom configuration instance
 * @returns Database ID
 * @throws ConfigurationError if not found or invalid
 */
export function resolveDatabaseId(schemaName: string, customConfig?: EnvironmentConfig): string {
  const config = customConfig || getEnvironmentConfig();
  return config.resolveDatabaseId(schemaName);
}
