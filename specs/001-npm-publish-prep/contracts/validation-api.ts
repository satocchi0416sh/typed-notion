/**
 * Package Validation API Contracts
 *
 * Defines the interfaces for npm package validation functionality.
 * These contracts support FR-001, FR-002, FR-003, FR-005, FR-007.
 */

export interface PackageValidationResult {
  /** Overall validation status */
  isValid: boolean;
  /** Array of validation errors found */
  errors: ValidationError[];
  /** Array of validation warnings */
  warnings: ValidationWarning[];
  /** Validation execution metadata */
  metadata: ValidationMetadata;
}

export interface ValidationError {
  /** Error classification code */
  code: ValidationErrorCode;
  /** Human-readable error message */
  message: string;
  /** Field or file path where error occurred */
  location?: string;
  /** Suggested fix for the error */
  suggestion?: string;
}

export interface ValidationWarning {
  /** Warning classification code */
  code: ValidationWarningCode;
  /** Human-readable warning message */
  message: string;
  /** Field or file path where warning occurred */
  location?: string;
  /** Impact level of the warning */
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationMetadata {
  /** Timestamp when validation was performed */
  timestamp: string;
  /** Version of validation rules used */
  rulesVersion: string;
  /** Duration of validation in milliseconds */
  duration: number;
  /** Validation environment information */
  environment: ValidationEnvironment;
}

export interface ValidationEnvironment {
  /** Node.js version used for validation */
  nodeVersion: string;
  /** npm version used for validation */
  npmVersion: string;
  /** Operating system platform */
  platform: string;
  /** TypeScript version if available */
  typescriptVersion?: string;
}

export type ValidationErrorCode =
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FIELD_VALUE'
  | 'INVALID_SEMVER'
  | 'INVALID_EXPORT_PATH'
  | 'FILE_NOT_FOUND'
  | 'INVALID_DEPENDENCY_RANGE'
  | 'DUPLICATE_DEPENDENCY'
  | 'REGISTRY_NAME_CONFLICT'
  | 'INVALID_LICENSE'
  | 'COMPILATION_ERROR';

export type ValidationWarningCode =
  | 'MISSING_OPTIONAL_FIELD'
  | 'LARGE_BUNDLE_SIZE'
  | 'OUTDATED_DEPENDENCY'
  | 'INSECURE_DEPENDENCY'
  | 'MISSING_KEYWORDS'
  | 'LONG_DESCRIPTION'
  | 'MISSING_HOMEPAGE';

/**
 * Package Validation Service Interface
 */
export interface PackageValidator {
  /**
   * Validate complete package configuration
   * @param manifestPath - Path to package.json file
   * @returns Promise resolving to validation result
   */
  validatePackage(manifestPath: string): Promise<PackageValidationResult>;

  /**
   * Validate package.json manifest only
   * @param manifest - Package manifest object
   * @returns Promise resolving to validation result
   */
  validateManifest(manifest: PackageManifest): Promise<PackageValidationResult>;

  /**
   * Validate package name availability in npm registry
   * @param packageName - Name to check for availability
   * @returns Promise resolving to availability result
   */
  validateNameAvailability(packageName: string): Promise<NameAvailabilityResult>;

  /**
   * Validate dependency versions and compatibility
   * @param dependencies - Dependencies map to validate
   * @returns Promise resolving to dependency validation result
   */
  validateDependencies(dependencies: Record<string, string>): Promise<DependencyValidationResult>;
}

export interface PackageManifest {
  name: string;
  version: string;
  description: string;
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, unknown>;
  files?: string[];
  keywords?: string[];
  author?: string | AuthorObject;
  license?: string;
  repository?: string | RepositoryObject;
  homepage?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  engines?: Record<string, string>;
}

export interface AuthorObject {
  name: string;
  email?: string;
  url?: string;
}

export interface RepositoryObject {
  type: string;
  url: string;
  directory?: string;
}

export interface NameAvailabilityResult {
  /** Whether the name is available */
  available: boolean;
  /** Reason if not available */
  reason?: 'EXISTS' | 'BLOCKED' | 'INVALID';
  /** Suggested alternative names */
  suggestions?: string[];
}

export interface DependencyValidationResult {
  /** Whether all dependencies are valid */
  valid: boolean;
  /** Issues found with specific dependencies */
  issues: DependencyIssue[];
}

export interface DependencyIssue {
  /** Name of the problematic dependency */
  package: string;
  /** Type of issue found */
  type: 'INVALID_RANGE' | 'NOT_FOUND' | 'SECURITY_VULNERABILITY' | 'DEPRECATED';
  /** Description of the issue */
  message: string;
  /** Suggested resolution */
  resolution?: string;
}
