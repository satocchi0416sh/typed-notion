/**
 * Publishing Workflow API Contracts
 *
 * Defines the interfaces for npm publishing workflow functionality.
 * These contracts support FR-006, FR-007, FR-008, FR-009, FR-010.
 */

export interface PublishingPipeline {
  /**
   * Execute complete publishing workflow
   * @param config - Publishing configuration
   * @returns Promise resolving to publishing result
   */
  publish(config: PublishingConfiguration): Promise<PublishingResult>;

  /**
   * Test package locally before publishing
   * @param config - Local testing configuration
   * @returns Promise resolving to testing result
   */
  testLocally(config: LocalTestConfig): Promise<LocalTestResult>;

  /**
   * Prepare package for publishing without actually publishing
   * @param config - Publishing configuration
   * @returns Promise resolving to preparation result
   */
  prepare(config: PublishingConfiguration): Promise<PreparationResult>;

  /**
   * Validate package is ready for publishing
   * @param packagePath - Path to package directory
   * @returns Promise resolving to readiness validation
   */
  validateReadiness(packagePath: string): Promise<ReadinessValidationResult>;
}

export interface PublishingConfiguration {
  /** Path to package directory */
  packagePath: string;
  /** npm registry to publish to */
  registry?: string;
  /** Package access level */
  access?: 'public' | 'restricted';
  /** Whether to enable npm provenance */
  provenance?: boolean;
  /** Dry run mode - prepare but don't publish */
  dryRun?: boolean;
  /** Version bump strategy */
  versionBump?: VersionBumpStrategy;
  /** Pre-publish validation options */
  validation: ValidationOptions;
}

export type VersionBumpStrategy = 'patch' | 'minor' | 'major' | 'prerelease' | 'none';

export interface ValidationOptions {
  /** Whether to validate package structure */
  packageStructure: boolean;
  /** Whether to validate TypeScript types */
  typeValidation: boolean;
  /** Whether to check bundle size limits */
  bundleSize: boolean;
  /** Whether to test local installation */
  localInstallation: boolean;
  /** Whether to check npm registry availability */
  registryCheck: boolean;
}

export interface PublishingResult {
  /** Whether publishing was successful */
  success: boolean;
  /** Published package information */
  publishedPackage?: PublishedPackageInfo;
  /** Errors encountered during publishing */
  errors: PublishingError[];
  /** Publishing execution metadata */
  metadata: PublishingMetadata;
}

export interface PublishedPackageInfo {
  /** Package name as published */
  name: string;
  /** Version as published */
  version: string;
  /** npm registry URL where package is available */
  registryUrl: string;
  /** Package tarball URL */
  tarballUrl: string;
  /** Size of published package in bytes */
  size: number;
  /** Number of files in published package */
  fileCount: number;
  /** Integrity hash of published package */
  integrity: string;
}

export interface PublishingError {
  /** Error classification */
  type: PublishingErrorType;
  /** Human-readable error message */
  message: string;
  /** Error code from npm registry if applicable */
  registryCode?: string;
  /** Additional error context */
  context?: Record<string, unknown>;
}

export type PublishingErrorType =
  | 'AUTHENTICATION_ERROR' // npm authentication failed
  | 'AUTHORIZATION_ERROR' // Insufficient permissions
  | 'PACKAGE_EXISTS' // Version already exists
  | 'REGISTRY_ERROR' // npm registry unavailable
  | 'NETWORK_ERROR' // Network connectivity issues
  | 'VALIDATION_FAILED' // Pre-publish validation failed
  | 'BUILD_REQUIRED' // Package not built
  | 'SIZE_LIMIT_EXCEEDED'; // Package too large

export interface PublishingMetadata {
  /** Timestamp when publishing started */
  startTime: string;
  /** Timestamp when publishing completed */
  endTime: string;
  /** Total publishing duration in milliseconds */
  duration: number;
  /** npm registry used */
  registry: string;
  /** Publishing environment information */
  environment: PublishingEnvironment;
}

export interface PublishingEnvironment {
  /** npm CLI version used */
  npmVersion: string;
  /** Node.js version used */
  nodeVersion: string;
  /** CI/CD environment if applicable */
  ci?: string;
  /** User agent for publishing */
  userAgent: string;
}

export interface LocalTestConfig {
  /** Package directory to test */
  packagePath: string;
  /** Test project directory to create */
  testProjectPath: string;
  /** Testing method to use */
  method: LocalTestMethod;
  /** Whether to test TypeScript integration */
  testTypeScript: boolean;
  /** Whether to test CommonJS imports */
  testCommonJS: boolean;
  /** Whether to test ESM imports */
  testESM: boolean;
}

export type LocalTestMethod = 'npm-link' | 'npm-pack' | 'yalc';

export interface LocalTestResult {
  /** Whether local testing was successful */
  success: boolean;
  /** Test execution results */
  tests: TestExecution[];
  /** Overall test summary */
  summary: TestSummary;
}

export interface TestExecution {
  /** Name/description of the test */
  name: string;
  /** Whether this test passed */
  passed: boolean;
  /** Error message if test failed */
  error?: string;
  /** Duration of test execution in milliseconds */
  duration: number;
  /** Type of test performed */
  type: 'INSTALLATION' | 'IMPORT' | 'TYPE_CHECK' | 'FUNCTIONALITY';
}

export interface TestSummary {
  /** Total number of tests executed */
  total: number;
  /** Number of tests that passed */
  passed: number;
  /** Number of tests that failed */
  failed: number;
  /** Total execution time for all tests */
  duration: number;
}

export interface PreparationResult {
  /** Whether preparation was successful */
  success: boolean;
  /** Package tarball information */
  tarball?: TarballInfo;
  /** Preparation validation results */
  validation: ReadinessValidationResult;
}

export interface TarballInfo {
  /** Path to generated tarball file */
  path: string;
  /** Size of tarball in bytes */
  size: number;
  /** Files included in tarball */
  files: string[];
  /** Integrity hash of tarball */
  integrity: string;
}

export interface ReadinessValidationResult {
  /** Whether package is ready for publishing */
  ready: boolean;
  /** Critical issues that must be fixed */
  criticalIssues: ReadinessIssue[];
  /** Warning issues that should be addressed */
  warnings: ReadinessIssue[];
  /** Validation checks performed */
  checks: ReadinessCheck[];
}

export interface ReadinessIssue {
  /** Issue classification */
  type: ReadinessIssueType;
  /** Description of the issue */
  message: string;
  /** How to fix the issue */
  resolution: string;
  /** Affected file or configuration */
  location?: string;
}

export type ReadinessIssueType =
  | 'MISSING_BUILD' // Package not built
  | 'INVALID_PACKAGE_JSON' // package.json issues
  | 'MISSING_FILES' // Required files missing
  | 'SIZE_TOO_LARGE' // Package size exceeds limits
  | 'TYPE_ERRORS' // TypeScript declaration issues
  | 'INVALID_EXPORTS' // Export configuration issues
  | 'SECURITY_ISSUES'; // Security vulnerabilities

export interface ReadinessCheck {
  /** Name of the check performed */
  name: string;
  /** Whether the check passed */
  passed: boolean;
  /** Additional details about the check */
  details?: string;
}
