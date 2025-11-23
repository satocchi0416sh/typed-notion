/**
 * Build Pipeline API Contracts
 *
 * Defines the interfaces for TypeScript build pipeline functionality.
 * These contracts support FR-002, FR-004, FR-006.
 */

export interface BuildPipelineResult {
  /** Overall build status */
  success: boolean;
  /** Build artifacts produced */
  artifacts: BuildArtifact[];
  /** Build execution metadata */
  metadata: BuildMetadata;
  /** Errors encountered during build */
  errors: BuildError[];
  /** Performance metrics */
  performance: BuildPerformance;
}

export interface BuildArtifact {
  /** Type of artifact produced */
  type: ArtifactType;
  /** Absolute path to the artifact file */
  path: string;
  /** Size of the artifact in bytes */
  size: number;
  /** Hash of the artifact content for integrity */
  hash: string;
  /** Source files that contributed to this artifact */
  sources: string[];
  /** Whether this artifact is included in published package */
  publishable: boolean;
}

export type ArtifactType =
  | 'javascript' // Compiled JS files
  | 'declaration' // TypeScript .d.ts files
  | 'sourcemap' // Source map files
  | 'metadata'; // Build metadata files

export interface BuildMetadata {
  /** Timestamp when build started */
  startTime: string;
  /** Timestamp when build completed */
  endTime: string;
  /** Total build duration in milliseconds */
  duration: number;
  /** Build tool version information */
  toolchain: BuildToolchain;
  /** Configuration used for the build */
  configuration: BuildConfiguration;
}

export interface BuildToolchain {
  /** TypeScript compiler version */
  typescript: string;
  /** Build tool name and version (e.g., "tsup@8.0.0") */
  buildTool: string;
  /** Node.js version used for build */
  nodeVersion: string;
  /** Target JavaScript version */
  target: string;
}

export interface BuildConfiguration {
  /** Entry point files for the build */
  entryPoints: string[];
  /** Output directory path */
  outputDir: string;
  /** Output formats to generate */
  formats: BuildFormat[];
  /** Whether to generate source maps */
  sourceMaps: boolean;
  /** Whether to generate declaration files */
  declarations: boolean;
  /** Whether to minify output */
  minify: boolean;
  /** Whether to enable tree-shaking */
  treeShaking: boolean;
}

export type BuildFormat = 'esm' | 'cjs' | 'umd' | 'iife';

export interface BuildError {
  /** Error classification */
  type: BuildErrorType;
  /** Human-readable error message */
  message: string;
  /** Source file where error occurred */
  file?: string;
  /** Line number where error occurred */
  line?: number;
  /** Column number where error occurred */
  column?: number;
  /** Full error context/stack */
  context?: string;
}

export type BuildErrorType =
  | 'TYPESCRIPT_ERROR' // TypeScript compilation errors
  | 'MODULE_RESOLUTION' // Module import/export errors
  | 'FILE_NOT_FOUND' // Missing source files
  | 'CONFIGURATION_ERROR' // Build config issues
  | 'DEPENDENCY_ERROR' // Dependency resolution issues
  | 'OUTPUT_ERROR'; // File system output errors

export interface BuildPerformance {
  /** Total build time in milliseconds */
  totalTime: number;
  /** Time spent on TypeScript compilation */
  compilationTime: number;
  /** Time spent on bundling/optimization */
  bundlingTime: number;
  /** Memory usage peak in bytes */
  memoryPeak: number;
  /** Number of files processed */
  filesProcessed: number;
  /** Size optimization achieved */
  optimization: OptimizationStats;
}

export interface OptimizationStats {
  /** Original total size before optimization */
  originalSize: number;
  /** Final size after optimization */
  finalSize: number;
  /** Compression ratio achieved */
  compressionRatio: number;
  /** Tree-shaking effectiveness */
  treeShakingReduction: number;
}

/**
 * Build Pipeline Service Interface
 */
export interface BuildPipeline {
  /**
   * Execute complete build pipeline
   * @param config - Build configuration
   * @returns Promise resolving to build result
   */
  build(config: BuildConfiguration): Promise<BuildPipelineResult>;

  /**
   * Build in watch mode for development
   * @param config - Build configuration
   * @param callback - Callback for build completion events
   * @returns Promise resolving to watch mode controller
   */
  watch(
    config: BuildConfiguration,
    callback: (result: BuildPipelineResult) => void
  ): Promise<BuildWatcher>;

  /**
   * Validate build configuration
   * @param config - Configuration to validate
   * @returns Promise resolving to validation result
   */
  validateConfig(config: BuildConfiguration): Promise<ConfigValidationResult>;

  /**
   * Clean build outputs
   * @param outputDir - Directory to clean
   * @returns Promise resolving when cleanup is complete
   */
  clean(outputDir: string): Promise<void>;
}

export interface BuildWatcher {
  /** Stop watching for file changes */
  stop(): Promise<void>;
  /** Current watch status */
  readonly isWatching: boolean;
}

export interface ConfigValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  /** Issues found in configuration */
  issues: ConfigIssue[];
}

export interface ConfigIssue {
  /** Severity of the issue */
  severity: 'error' | 'warning';
  /** Configuration field with issue */
  field: string;
  /** Description of the issue */
  message: string;
  /** Suggested fix */
  suggestion?: string;
}
