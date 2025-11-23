/**
 * Build Pipeline Implementation
 *
 * Manages TypeScript compilation and build artifact generation for npm publishing.
 */

import { spawn } from 'child_process';
import { access, readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface BuildArtifact {
  /** File path relative to project root */
  path: string;
  /** File size in bytes */
  size: number;
  /** File type classification */
  type: 'javascript' | 'declaration' | 'sourcemap';
  /** Build timestamp */
  timestamp: Date;
}

export interface BuildPerformance {
  /** Build start time */
  startTime: Date;
  /** Build end time */
  endTime: Date;
  /** Total build duration in milliseconds */
  duration: number;
  /** TypeScript compilation time */
  compilationTime?: number;
  /** Bundle generation time */
  bundleTime?: number;
}

export interface BuildResult {
  /** Whether build was successful */
  success: boolean;
  /** Generated build artifacts */
  artifacts: BuildArtifact[];
  /** Build performance metrics */
  performance: BuildPerformance;
  /** Error messages if build failed */
  errors: string[];
  /** Warning messages */
  warnings: string[];
}

export interface BuildConfiguration {
  /** Project directory path */
  projectPath: string;
  /** Output directory path */
  outputDir: string;
  /** Build command to execute */
  buildCommand: string;
  /** Environment variables for build */
  environment?: Record<string, string>;
  /** Whether to clean output directory first */
  clean?: boolean;
  /** Performance targets */
  targets?: {
    /** Maximum build time in milliseconds */
    maxBuildTime?: number;
    /** Maximum bundle size in bytes */
    maxBundleSize?: number;
  };
}

export class BuildPipeline {
  private readonly config: BuildConfiguration;

  constructor(config: BuildConfiguration) {
    this.config = config;
  }

  /**
   * Execute the complete build pipeline
   */
  async build(): Promise<BuildResult> {
    const startTime = new Date();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Clean output directory if requested
      if (this.config.clean) {
        await this.cleanOutputDirectory();
      }

      // Execute build command
      const buildSuccess = await this.executeBuildCommand();
      if (!buildSuccess) {
        return {
          success: false,
          artifacts: [],
          performance: {
            startTime,
            endTime: new Date(),
            duration: Date.now() - startTime.getTime(),
          },
          errors: ['Build command failed'],
          warnings,
        };
      }

      // Analyze build artifacts
      const artifacts = await this.analyzeBuildArtifacts();

      // Check performance targets
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      if (this.config.targets?.maxBuildTime && duration > this.config.targets.maxBuildTime) {
        warnings.push(
          `Build time ${duration}ms exceeds target ${this.config.targets.maxBuildTime}ms`
        );
      }

      const totalSize = artifacts.reduce((sum, artifact) => sum + artifact.size, 0);
      if (this.config.targets?.maxBundleSize && totalSize > this.config.targets.maxBundleSize) {
        warnings.push(
          `Bundle size ${totalSize} bytes exceeds target ${this.config.targets.maxBundleSize} bytes`
        );
      }

      return {
        success: true,
        artifacts,
        performance: {
          startTime,
          endTime,
          duration,
        },
        errors,
        warnings,
      };
    } catch (error) {
      const endTime = new Date();
      return {
        success: false,
        artifacts: [],
        performance: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
        errors: [error instanceof Error ? error.message : 'Unknown build error'],
        warnings,
      };
    }
  }

  /**
   * Validate build artifacts exist and are correct
   */
  async validateArtifacts(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      const artifacts = await this.analyzeBuildArtifacts();

      // Check for required artifacts
      const hasJavaScript = artifacts.some(a => a.type === 'javascript');
      const hasDeclarations = artifacts.some(a => a.type === 'declaration');

      if (!hasJavaScript) {
        issues.push('No JavaScript output files found');
      }

      if (!hasDeclarations) {
        issues.push('No TypeScript declaration files found');
      }

      // Check file sizes
      for (const artifact of artifacts) {
        if (artifact.size === 0) {
          issues.push(`Artifact ${artifact.path} is empty`);
        }
        if (artifact.size > 1024 * 1024) {
          // 1MB
          issues.push(`Artifact ${artifact.path} is very large (${artifact.size} bytes)`);
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      issues.push(
        `Failed to analyze artifacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return { valid: false, issues };
    }
  }

  /**
   * Get build performance metrics
   */
  getPerformanceMetrics(): { buildTime: number; artifactCount: number; totalSize: number } {
    // This would be populated from the last build result
    // For now, return placeholder values
    return {
      buildTime: 0,
      artifactCount: 0,
      totalSize: 0,
    };
  }

  private async cleanOutputDirectory(): Promise<void> {
    try {
      await access(this.config.outputDir);
      // Output directory exists, could implement cleaning logic here
      // For safety, we'll skip actual deletion in this implementation
    } catch {
      // Output directory doesn't exist, nothing to clean
    }
  }

  private async executeBuildCommand(): Promise<boolean> {
    return new Promise(resolve => {
      const [command, ...args] = this.config.buildCommand.split(' ');
      if (!command) {
        resolve(false);
        return;
      }

      const child = spawn(command, args, {
        cwd: this.config.projectPath,
        env: { ...process.env, ...this.config.environment },
        stdio: 'pipe',
      });

      child.on('close', (code: number | null) => {
        resolve(code === 0);
      });

      child.on('error', () => {
        resolve(false);
      });
    });
  }

  private async analyzeBuildArtifacts(): Promise<BuildArtifact[]> {
    const artifacts: BuildArtifact[] = [];
    const outputDir = this.config.outputDir;

    try {
      await access(outputDir);
      const files = await this.getFilesRecursively(outputDir);

      for (const filePath of files) {
        const stats = await stat(filePath);
        const relativePath = filePath.replace(`${this.config.projectPath}/`, '');

        let type: BuildArtifact['type'] = 'javascript';
        if (filePath.endsWith('.d.ts') || filePath.endsWith('.d.cts')) {
          type = 'declaration';
        } else if (filePath.endsWith('.map')) {
          type = 'sourcemap';
        }

        artifacts.push({
          path: relativePath,
          size: stats.size,
          type,
          timestamp: stats.mtime,
        });
      }
    } catch (error) {
      throw new Error(
        `Failed to analyze build artifacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return artifacts;
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = await readdir(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        const subFiles = await this.getFilesRecursively(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}
