/**
 * TypeScript API Contracts for Configuration Management
 *
 * This file defines the contracts for automatic database ID resolution,
 * environment configuration management, and schema validation.
 */

// Environment Configuration Management
export interface EnvironmentConfig {
  /**
   * Resolve database ID from environment variables
   * @param schemaName - Name of the schema to resolve database ID for
   * @returns Database ID from environment variable
   * @throws ConfigurationError if database ID not found
   *
   * @example
   * // Environment: NOTION_DB_USER_PROFILE=abc123
   * resolveDatabaseId('USER_PROFILE') // returns 'abc123'
   */
  resolveDatabaseId(schemaName: string): string;

  /**
   * Check if database ID is configured for schema
   * @param schemaName - Name of the schema to check
   * @returns True if environment variable exists
   */
  hasDatabaseId(schemaName: string): boolean;

  /**
   * Get all configured database mappings
   * @returns Record of schema names to database IDs
   */
  getAllDatabaseMappings(): Record<string, string>;

  /**
   * Validate environment configuration
   * @param requiredSchemas - Array of schema names that must be configured
   * @returns Validation result with missing configurations
   */
  validateConfiguration(requiredSchemas: string[]): ConfigurationValidationResult;

  /**
   * Set database ID mapping (for testing or runtime configuration)
   * @param schemaName - Schema name
   * @param databaseId - Notion database ID
   */
  setDatabaseId(schemaName: string, databaseId: string): void;
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  missingConfigurations: string[];
  invalidDatabaseIds: string[];
  suggestions: string[];
}

// Schema Structure Validation
export interface SchemaValidator {
  /**
   * Validate that schema definition matches actual Notion database structure
   * @template T - Schema definition type
   * @param schema - Schema to validate
   * @param databaseId - Notion database ID (optional, resolved from env if not provided)
   * @returns Promise resolving to validation result
   * @throws NotionAPIError for API access failures
   */
  validateSchemaStructure<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    databaseId?: string
  ): Promise<SchemaStructureValidationResult>;

  /**
   * Check if property exists in Notion database
   * @param databaseId - Notion database ID
   * @param propertyName - Property name to check
   * @returns Promise resolving to property existence and type information
   */
  checkProperty(databaseId: string, propertyName: string): Promise<PropertyCheckResult>;

  /**
   * Get complete database schema from Notion
   * @param databaseId - Notion database ID
   * @returns Promise resolving to database structure information
   */
  getDatabaseStructure(databaseId: string): Promise<NotionDatabaseStructure>;

  /**
   * Compare schema definition with actual database structure
   * @template T - Schema definition type
   * @param schema - Local schema definition
   * @param remoteStructure - Remote database structure
   * @returns Detailed comparison result
   */
  compareSchemaStructures<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    remoteStructure: NotionDatabaseStructure
  ): SchemaComparisonResult;
}

export interface SchemaStructureValidationResult {
  isValid: boolean;
  databaseId: string;
  databaseTitle: string;
  errors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
  missingProperties: MissingPropertyInfo[];
  extraProperties: ExtraPropertyInfo[];
  typeConflicts: TypeConflictInfo[];
  suggestions: string[];
}

export interface SchemaValidationError {
  type: 'MISSING_PROPERTY' | 'TYPE_CONFLICT' | 'INVALID_OPTIONS' | 'DATABASE_NOT_FOUND';
  property?: string;
  message: string;
  expected?: string;
  actual?: string;
}

export interface SchemaValidationWarning {
  type: 'EXTRA_PROPERTY' | 'UNUSED_OPTIONS' | 'PERFORMANCE' | 'DEPRECATED';
  property?: string;
  message: string;
  suggestion?: string;
}

export interface MissingPropertyInfo {
  propertyName: string;
  expectedType: string;
  suggestedType?: string;
  canAutoCreate: boolean;
}

export interface ExtraPropertyInfo {
  propertyName: string;
  actualType: string;
  canIgnore: boolean;
  suggestedAction: 'ignore' | 'add_to_schema' | 'remove_from_database';
}

export interface TypeConflictInfo {
  propertyName: string;
  expectedType: string;
  actualType: string;
  canConvert: boolean;
  conversionRisk: 'low' | 'medium' | 'high';
  suggestedAction: string;
}

export interface PropertyCheckResult {
  exists: boolean;
  propertyInfo?: NotionPropertyInfo;
  type?: string;
  configuration?: Record<string, unknown>;
}

export interface NotionDatabaseStructure {
  id: string;
  title: string;
  description?: string;
  properties: Record<string, NotionPropertyInfo>;
  created_time: string;
  last_edited_time: string;
  created_by: NotionUser;
  last_edited_by: NotionUser;
  archived: boolean;
  is_inline: boolean;
  public_url?: string;
  url: string;
}

export interface NotionPropertyInfo {
  id: string;
  type: string;
  name: string;
  description?: string;
  // Type-specific configuration
  [key: string]: unknown;
}

export interface SchemaComparisonResult {
  identical: boolean;
  compatible: boolean;
  differences: SchemaDifference[];
  compatibilityScore: number; // 0-100
  migrationRequired: boolean;
  migrationSteps?: MigrationStep[];
}

export interface SchemaDifference {
  type: 'MISSING' | 'EXTRA' | 'TYPE_MISMATCH' | 'CONFIG_MISMATCH';
  property: string;
  impact: 'breaking' | 'warning' | 'info';
  description: string;
  localValue?: unknown;
  remoteValue?: unknown;
}

export interface MigrationStep {
  type: 'ADD_PROPERTY' | 'REMOVE_PROPERTY' | 'CHANGE_TYPE' | 'UPDATE_CONFIG';
  property: string;
  action: string;
  risk: 'low' | 'medium' | 'high';
  reversible: boolean;
  automated: boolean;
}

// Configuration Management Service
export interface ConfigurationManager {
  /**
   * Initialize configuration from environment
   * @param options - Configuration options
   * @returns Initialized configuration state
   */
  initialize(options?: ConfigurationOptions): Promise<ConfigurationState>;

  /**
   * Refresh configuration from environment (useful for runtime changes)
   * @returns Updated configuration state
   */
  refresh(): Promise<ConfigurationState>;

  /**
   * Get current configuration state
   * @returns Current configuration information
   */
  getState(): ConfigurationState;

  /**
   * Register schema for automatic validation and configuration
   * @template T - Schema definition type
   * @param schema - Schema to register
   * @param options - Registration options
   */
  registerSchema<T extends SchemaDefinition>(
    schema: EnhancedTypedSchema<T>,
    options?: SchemaRegistrationOptions
  ): Promise<void>;

  /**
   * Unregister schema
   * @param schemaName - Name of schema to unregister
   */
  unregisterSchema(schemaName: string): void;

  /**
   * Get all registered schemas
   * @returns Array of registered schema information
   */
  getRegisteredSchemas(): RegisteredSchemaInfo[];

  /**
   * Validate all registered schemas against their databases
   * @returns Promise resolving to validation results for all schemas
   */
  validateAllSchemas(): Promise<Record<string, SchemaStructureValidationResult>>;
}

export interface ConfigurationOptions {
  /**
   * Environment variable prefix (default: 'NOTION_DB_')
   */
  envPrefix?: string;

  /**
   * Whether to validate schemas on registration
   */
  validateOnRegister?: boolean;

  /**
   * Cache duration for validation results (minutes)
   */
  validationCacheDuration?: number;

  /**
   * Whether to enable automatic schema monitoring
   */
  enableMonitoring?: boolean;

  /**
   * Custom environment variable mappings
   */
  customMappings?: Record<string, string>;
}

export interface ConfigurationState {
  initialized: boolean;
  envPrefix: string;
  databaseMappings: Record<string, string>;
  registeredSchemas: string[];
  lastValidation?: Date;
  validationResults: Record<string, SchemaStructureValidationResult>;
  errors: ConfigurationError[];
  warnings: string[];
}

export interface SchemaRegistrationOptions {
  /**
   * Custom schema name override
   */
  customName?: string;

  /**
   * Whether to validate immediately on registration
   */
  validateImmediately?: boolean;

  /**
   * Custom database ID (overrides environment resolution)
   */
  customDatabaseId?: string;

  /**
   * Whether to enable monitoring for schema changes
   */
  enableMonitoring?: boolean;
}

export interface RegisteredSchemaInfo {
  name: string;
  databaseId: string;
  registeredAt: Date;
  lastValidated?: Date;
  validationResult?: SchemaStructureValidationResult;
  monitoringEnabled: boolean;
}

// Error Types for Configuration
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly type: 'MISSING_ENV' | 'INVALID_DATABASE_ID' | 'VALIDATION_FAILED' | 'API_ERROR',
    public readonly schemaName?: string,
    public readonly suggestion?: string
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class SchemaRegistrationError extends Error {
  constructor(
    message: string,
    public readonly schemaName: string,
    public readonly validationErrors?: SchemaValidationError[]
  ) {
    super(message);
    this.name = 'SchemaRegistrationError';
  }
}

// Utility Types for Configuration
export type DatabaseIdResolver = (schemaName: string) => string | Promise<string>;

export interface CustomDatabaseMapping {
  schemaName: string;
  databaseId: string;
  environment?: 'dev' | 'staging' | 'prod' | 'test';
}

export interface EnvironmentInfo {
  nodeEnv?: string;
  notionApiVersion?: string;
  configuredSchemas: string[];
  missingConfigurations: string[];
  hasValidApiKey: boolean;
}

// Monitoring and Health Check
export interface ConfigurationMonitor {
  /**
   * Start monitoring for configuration changes
   * @param interval - Check interval in milliseconds
   */
  startMonitoring(interval?: number): void;

  /**
   * Stop configuration monitoring
   */
  stopMonitoring(): void;

  /**
   * Perform health check on all configurations
   * @returns Health check results
   */
  healthCheck(): Promise<ConfigurationHealthResult>;

  /**
   * Subscribe to configuration change events
   * @param callback - Function called when configuration changes
   */
  onConfigurationChange(callback: (change: ConfigurationChange) => void): void;
}

export interface ConfigurationHealthResult {
  healthy: boolean;
  issues: ConfigurationIssue[];
  lastChecked: Date;
  responseTime: number; // milliseconds
  apiConnectivity: boolean;
  schemaValidityCount: number;
  totalSchemaCount: number;
}

export interface ConfigurationIssue {
  severity: 'error' | 'warning' | 'info';
  type: 'DATABASE_UNREACHABLE' | 'SCHEMA_MISMATCH' | 'API_RATE_LIMIT' | 'CONFIGURATION_DRIFT';
  message: string;
  schemaName?: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface ConfigurationChange {
  type: 'DATABASE_ID_CHANGED' | 'SCHEMA_STRUCTURE_CHANGED' | 'ENVIRONMENT_CHANGED';
  schemaName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: Date;
}
