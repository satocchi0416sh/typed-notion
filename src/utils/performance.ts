/**
 * Performance monitoring utilities for MVP Property Types
 *
 * Implements NFR-001 performance monitoring requirements
 * Provides metrics collection and analysis for schema operations
 */

import type { PerformanceMetrics } from '../types/core.js';

/**
 * Performance metrics collector
 * Tracks schema processing times and system performance
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private schemaCount: number = 0;
  private totalProcessingTime: number = 0;
  private lastQueryDuration: number = 0;
  private operationTimings: Map<string, number[]> = new Map();

  private constructor() {
    // Singleton instance - no initialization needed
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record schema creation time
   */
  recordSchemaCreation(duration: number): void {
    this.schemaCount++;
    this.totalProcessingTime += duration;
    this.recordOperation('schema_creation', duration);
  }

  /**
   * Record query execution time
   */
  recordQueryExecution(duration: number): void {
    this.lastQueryDuration = duration;
    this.recordOperation('query_execution', duration);
  }

  /**
   * Record property validation time
   */
  recordPropertyValidation(duration: number): void {
    this.recordOperation('property_validation', duration);
  }

  /**
   * Record type inference time
   */
  recordTypeInference(duration: number): void {
    this.recordOperation('type_inference', duration);
  }

  /**
   * Record generic operation timing
   */
  recordOperation(operation: string, duration: number): void {
    if (!this.operationTimings.has(operation)) {
      this.operationTimings.set(operation, []);
    }
    const timings = this.operationTimings.get(operation)!;
    timings.push(duration);

    // Keep only last 100 measurements to prevent memory leaks
    if (timings.length > 100) {
      timings.shift();
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      schemaProcessingTime: this.getAverageProcessingTime(),
      activeSchemaCount: this.schemaCount,
      lastQueryDuration: this.lastQueryDuration,
    };
  }

  /**
   * Get detailed performance statistics
   */
  getDetailedStats(): {
    averages: Record<string, number>;
    totals: Record<string, number>;
    counts: Record<string, number>;
    p95: Record<string, number>;
  } {
    const averages: Record<string, number> = {};
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    const p95: Record<string, number> = {};

    for (const [operation, timings] of this.operationTimings.entries()) {
      if (timings.length === 0) continue;

      counts[operation] = timings.length;
      totals[operation] = timings.reduce((sum, time) => sum + time, 0);
      averages[operation] = totals[operation] / timings.length;

      // Calculate 95th percentile
      const sorted = [...timings].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      p95[operation] = sorted[p95Index] || 0;
    }

    return { averages, totals, counts, p95 };
  }

  /**
   * Get average schema processing time
   */
  private getAverageProcessingTime(): number {
    return this.schemaCount > 0 ? this.totalProcessingTime / this.schemaCount : 0;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.schemaCount = 0;
    this.totalProcessingTime = 0;
    this.lastQueryDuration = 0;
    this.operationTimings.clear();
  }

  /**
   * Check if performance is within acceptable limits
   */
  isPerformanceHealthy(): {
    isHealthy: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const stats = this.getDetailedStats();

    // Check schema processing time (should be < 2s for 20 properties)
    if (stats.averages.schema_creation && stats.averages.schema_creation > 2000) {
      issues.push(
        `Schema creation too slow: ${stats.averages.schema_creation}ms (target: <2000ms)`
      );
    }

    // Check query execution time (should be reasonable)
    if (stats.averages.query_execution && stats.averages.query_execution > 5000) {
      issues.push(
        `Query execution too slow: ${stats.averages.query_execution}ms (target: <5000ms)`
      );
    }

    // Check property validation time (should be fast)
    if (stats.averages.property_validation && stats.averages.property_validation > 100) {
      issues.push(
        `Property validation too slow: ${stats.averages.property_validation}ms (target: <100ms)`
      );
    }

    // Check active schema count (performance degrades with too many)
    if (this.schemaCount > 100) {
      issues.push(`Too many active schemas: ${this.schemaCount} (target: <100)`);
    }

    return {
      isHealthy: issues.length === 0,
      issues,
    };
  }
}

/**
 * High-level function to measure operation performance
 */
export function measurePerformance<T>(operation: string, fn: () => T): T {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - startTime;

    // Record based on operation type
    switch (operation) {
      case 'schema_creation':
        monitor.recordSchemaCreation(duration);
        break;
      case 'query_execution':
        monitor.recordQueryExecution(duration);
        break;
      case 'property_validation':
        monitor.recordPropertyValidation(duration);
        break;
      case 'type_inference':
        monitor.recordTypeInference(duration);
        break;
      default:
        // Generic operation timing
        monitor.recordOperation(operation, duration);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    monitor.recordOperation(`${operation}_error`, duration);
    throw error;
  }
}

/**
 * Async version of measurePerformance
 */
export async function measurePerformanceAsync<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    switch (operation) {
      case 'schema_creation':
        monitor.recordSchemaCreation(duration);
        break;
      case 'query_execution':
        monitor.recordQueryExecution(duration);
        break;
      case 'property_validation':
        monitor.recordPropertyValidation(duration);
        break;
      case 'type_inference':
        monitor.recordTypeInference(duration);
        break;
      default:
        monitor.recordOperation(operation, duration);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    monitor.recordOperation(`${operation}_error`, duration);
    throw error;
  }
}

/**
 * Get current performance metrics
 * This is the main function exported for public API
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return PerformanceMonitor.getInstance().getMetrics();
}

/**
 * Get detailed performance statistics
 */
export function getDetailedPerformanceStats() {
  return PerformanceMonitor.getInstance().getDetailedStats();
}

/**
 * Check system performance health
 */
export function checkPerformanceHealth() {
  return PerformanceMonitor.getInstance().isPerformanceHealthy();
}

/**
 * Reset performance metrics (mainly for testing)
 */
export function resetPerformanceMetrics(): void {
  PerformanceMonitor.getInstance().reset();
}

/**
 * Performance timing decorator for class methods
 */
export function timed(operation: string) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      return measurePerformance(`${operation}_${propertyKey}`, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
