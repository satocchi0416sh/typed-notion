/**
 * Configuration Monitor for typed-notion-core-ts
 *
 * Provides real-time monitoring and health checking for
 * database configurations with automated issue detection.
 */

import type { DatabaseConfigurationManager } from './database-config-manager.js';
import type { HealthCheckResult } from './database-config-manager.js';
import { ConfigurationError } from '../errors/index.js';

/**
 * Monitoring configuration options
 */
export interface MonitoringConfig {
  /**
   * Interval for health checks in milliseconds
   * Default: 60000 (1 minute)
   */
  healthCheckInterval?: number;

  /**
   * Enable automatic issue detection
   * Default: true
   */
  enableIssueDetection?: boolean;

  /**
   * Maximum consecutive failures before alerting
   * Default: 3
   */
  maxConsecutiveFailures?: number;

  /**
   * Enable performance tracking
   * Default: true
   */
  enablePerformanceTracking?: boolean;
}

/**
 * Issue severity levels
 */
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Detected configuration issue
 */
export interface ConfigurationIssue {
  id: string;
  severity: IssueSeverity;
  type:
    | 'database_unreachable'
    | 'schema_mismatch'
    | 'env_missing'
    | 'validation_failed'
    | 'performance_degradation';
  schemaName?: string;
  message: string;
  suggestion?: string;
  detectedAt: Date;
  resolved: boolean;
}

/**
 * Monitoring statistics
 */
export interface MonitoringStats {
  totalHealthChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageCheckDuration: number;
  lastCheckDuration: number;
  uptime: number;
  startTime: Date;
}

/**
 * Health trend data
 */
export interface HealthTrend {
  timestamp: Date;
  healthy: boolean;
  schemaCount: number;
  healthPercentage: number;
}

/**
 * Configuration monitoring interface
 */
export interface ConfigurationMonitor {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  getLatestHealthCheck(): HealthCheckResult | null;
  getHealthTrends(duration?: number): HealthTrend[];
  getDetectedIssues(): ConfigurationIssue[];
  getStatistics(): MonitoringStats;
  resolveIssue(issueId: string): void;
  forceHealthCheck(): Promise<HealthCheckResult>;
}

/**
 * Configuration Monitor implementation
 */
export class ConfigurationMonitorImpl implements ConfigurationMonitor {
  private configManager: DatabaseConfigurationManager;
  private config: Required<MonitoringConfig>;
  private monitoringInterval: ReturnType<typeof globalThis.setInterval> | null = null;
  private issues: Map<string, ConfigurationIssue> = new Map();
  private healthHistory: HealthTrend[] = [];
  private latestHealthCheck: HealthCheckResult | null = null;
  private stats: MonitoringStats;
  private consecutiveFailures = 0;
  private running = false;

  constructor(configManager: DatabaseConfigurationManager, config?: MonitoringConfig) {
    this.configManager = configManager;
    this.config = {
      healthCheckInterval: config?.healthCheckInterval || 60000,
      enableIssueDetection: config?.enableIssueDetection ?? true,
      maxConsecutiveFailures: config?.maxConsecutiveFailures || 3,
      enablePerformanceTracking: config?.enablePerformanceTracking ?? true,
    };

    this.stats = {
      totalHealthChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageCheckDuration: 0,
      lastCheckDuration: 0,
      uptime: 0,
      startTime: new Date(),
    };
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.stats.startTime = new Date();

    // Perform initial health check
    this.performHealthCheck();

    // Set up periodic health checks
    this.monitoringInterval = globalThis.setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.monitoringInterval) {
      globalThis.clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check if monitor is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      const healthResult = await this.configManager.healthCheck();
      const duration = Date.now() - startTime;

      // Update statistics
      this.updateStatistics(healthResult, duration);

      // Store health check result
      this.latestHealthCheck = healthResult;

      // Record health trend
      this.recordHealthTrend(healthResult);

      // Detect issues if enabled
      if (this.config.enableIssueDetection) {
        this.detectIssues(healthResult);
      }

      // Reset consecutive failures on success
      if (healthResult.healthy) {
        this.consecutiveFailures = 0;
      } else {
        this.consecutiveFailures++;
        this.checkConsecutiveFailures();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.failedChecks++;
      this.stats.lastCheckDuration = duration;
      this.consecutiveFailures++;

      // Create critical issue for health check failure
      this.createIssue({
        id: `health_check_failure_${Date.now()}`,
        severity: 'critical',
        type: 'validation_failed',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check database connection and configuration',
        detectedAt: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Force an immediate health check
   */
  async forceHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const healthResult = await this.configManager.healthCheck();
      const duration = Date.now() - startTime;

      this.updateStatistics(healthResult, duration);
      this.latestHealthCheck = healthResult;
      this.recordHealthTrend(healthResult);

      if (this.config.enableIssueDetection) {
        this.detectIssues(healthResult);
      }

      return healthResult;
    } catch (error) {
      throw new ConfigurationError(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_FAILED'
      );
    }
  }

  /**
   * Update monitoring statistics
   */
  private updateStatistics(healthResult: HealthCheckResult, duration: number): void {
    this.stats.totalHealthChecks++;

    if (healthResult.healthy) {
      this.stats.successfulChecks++;
    } else {
      this.stats.failedChecks++;
    }

    this.stats.lastCheckDuration = duration;

    // Update average duration
    this.stats.averageCheckDuration =
      (this.stats.averageCheckDuration * (this.stats.totalHealthChecks - 1) + duration) /
      this.stats.totalHealthChecks;

    // Update uptime
    this.stats.uptime = Date.now() - this.stats.startTime.getTime();
  }

  /**
   * Record health trend
   */
  private recordHealthTrend(healthResult: HealthCheckResult): void {
    const trend: HealthTrend = {
      timestamp: new Date(),
      healthy: healthResult.healthy,
      schemaCount: healthResult.totalSchemas,
      healthPercentage:
        healthResult.totalSchemas > 0
          ? (healthResult.healthySchemas / healthResult.totalSchemas) * 100
          : 0,
    };

    this.healthHistory.push(trend);

    // Keep only last 24 hours of history
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.healthHistory = this.healthHistory.filter(h => h.timestamp.getTime() > oneDayAgo);
  }

  /**
   * Detect configuration issues
   */
  private detectIssues(healthResult: HealthCheckResult): void {
    // Clear resolved issues
    for (const [id, issue] of this.issues.entries()) {
      if (issue.resolved) {
        this.issues.delete(id);
      }
    }

    // Detect unhealthy schemas
    for (const error of healthResult.errors) {
      const issueId = `schema_unhealthy_${error.schemaName}`;

      if (!this.issues.has(issueId)) {
        this.createIssue({
          id: issueId,
          severity: 'high',
          type: 'validation_failed',
          schemaName: error.schemaName,
          message: `Schema '${error.schemaName}' is unhealthy: ${error.error}`,
          suggestion: this.getSuggestionForError(error.error),
          detectedAt: new Date(),
          resolved: false,
        });
      }
    }

    // Detect performance degradation
    if (this.config.enablePerformanceTracking && this.stats.averageCheckDuration > 5000) {
      const issueId = 'performance_degradation';

      if (!this.issues.has(issueId)) {
        this.createIssue({
          id: issueId,
          severity: 'medium',
          type: 'performance_degradation',
          message: `Health checks taking longer than expected (avg: ${this.stats.averageCheckDuration}ms)`,
          suggestion: 'Consider optimizing database queries or reducing schema complexity',
          detectedAt: new Date(),
          resolved: false,
        });
      }
    }
  }

  /**
   * Create and store an issue
   */
  private createIssue(issue: ConfigurationIssue): void {
    this.issues.set(issue.id, issue);
  }

  /**
   * Check for consecutive failures
   */
  private checkConsecutiveFailures(): void {
    if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      this.createIssue({
        id: 'consecutive_failures',
        severity: 'critical',
        type: 'validation_failed',
        message: `Health checks have failed ${this.consecutiveFailures} times consecutively`,
        suggestion: 'Check database connection, API credentials, and network connectivity',
        detectedAt: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Get suggestion for specific error
   */
  private getSuggestionForError(error: string): string {
    if (error.includes('Database ID cannot be resolved')) {
      return 'Set the NOTION_DB_[SCHEMA_NAME] environment variable or update database ID in schema';
    }
    if (error.includes('Invalid schema structure')) {
      return 'Ensure schema has both databaseId and properties fields';
    }
    if (error.includes('unauthorized') || error.includes('401')) {
      return 'Check your Notion API token and ensure it has access to the database';
    }
    if (error.includes('not found') || error.includes('404')) {
      return 'Verify the database ID is correct and the integration has access';
    }
    if (error.includes('rate limit')) {
      return 'Reduce request frequency or implement rate limiting';
    }
    return 'Review the error details and check your configuration';
  }

  /**
   * Get latest health check result
   */
  getLatestHealthCheck(): HealthCheckResult | null {
    return this.latestHealthCheck;
  }

  /**
   * Get health trends
   */
  getHealthTrends(duration?: number): HealthTrend[] {
    if (!duration) {
      return [...this.healthHistory];
    }

    const since = Date.now() - duration;
    return this.healthHistory.filter(h => h.timestamp.getTime() > since);
  }

  /**
   * Get detected issues
   */
  getDetectedIssues(): ConfigurationIssue[] {
    return Array.from(this.issues.values()).filter(issue => !issue.resolved);
  }

  /**
   * Get monitoring statistics
   */
  getStatistics(): MonitoringStats {
    return { ...this.stats };
  }

  /**
   * Resolve an issue
   */
  resolveIssue(issueId: string): void {
    const issue = this.issues.get(issueId);
    if (issue) {
      issue.resolved = true;
    }
  }

  /**
   * Clear all issues
   */
  clearIssues(): void {
    this.issues.clear();
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.stats = {
      totalHealthChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageCheckDuration: 0,
      lastCheckDuration: 0,
      uptime: 0,
      startTime: new Date(),
    };
  }
}

// Export factory function
export function createConfigurationMonitor(
  configManager: DatabaseConfigurationManager,
  config?: MonitoringConfig
): ConfigurationMonitor {
  return new ConfigurationMonitorImpl(configManager, config);
}
