/**
 * Package Validation Types
 *
 * Type definitions for package validation functionality.
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
  typescriptVersion?: string | undefined;
}

export type ValidationErrorCode =
  | 'MISSING_REQUIRED_FIELD' // Required package.json field missing
  | 'INVALID_FIELD_VALUE' // Field value doesn't meet requirements
  | 'INVALID_VERSION_FORMAT' // Version doesn't follow semver
  | 'MISSING_BUILD_OUTPUT' // Expected build files don't exist
  | 'INVALID_EXPORTS_CONFIG' // Package exports configuration invalid
  | 'DEPENDENCY_MISMATCH' // Dependency categorization issues
  | 'FILE_NOT_FOUND' // Referenced file doesn't exist
  | 'INVALID_LICENSE'; // Invalid SPDX license identifier

export type ValidationWarningCode =
  | 'MISSING_OPTIONAL_FIELD' // Recommended field missing
  | 'SUBOPTIMAL_FIELD_VALUE' // Field value could be improved
  | 'LARGE_PACKAGE_SIZE' // Package size exceeds recommendations
  | 'INCOMPLETE_KEYWORDS' // Could use more descriptive keywords
  | 'MISSING_DOCUMENTATION' // Missing or incomplete docs
  | 'DEPENDENCY_MISMATCH' // Dependency categorization issues
  | 'OUTDATED_DEPENDENCIES'; // Dependencies could be updated

export interface PackageManifest {
  /** Package name */
  name: string;
  /** Package version */
  version: string;
  /** Package description */
  description?: string;
  /** Main entry point */
  main?: string;
  /** ES module entry point */
  module?: string;
  /** TypeScript declarations entry point */
  types?: string;
  /** Modern exports map */
  exports?: Record<string, unknown>;
  /** Files to include in published package */
  files?: string[];
  /** Package keywords for discoverability */
  keywords?: string[];
  /** Author information */
  author?: string;
  /** License identifier */
  license?: string;
  /** Repository information */
  repository?: {
    type: string;
    url: string;
  };
  /** Homepage URL */
  homepage?: string;
  /** Node.js engine requirements */
  engines?: {
    node?: string;
    npm?: string;
  };
  /** Runtime dependencies */
  dependencies?: Record<string, string>;
  /** Development dependencies */
  devDependencies?: Record<string, string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, string>;
  /** npm scripts */
  scripts?: Record<string, string>;
  /** Additional package.json fields */
  [key: string]: unknown;
}

export interface NameAvailabilityResult {
  /** Whether the name is available */
  available: boolean;
  /** Existing package information if name is taken */
  existingPackage?: {
    name: string;
    version: string;
    description?: string;
    author?: string;
  };
  /** Alternative name suggestions if not available */
  suggestions?: string[];
}

export interface PackageValidator {
  /**
   * Validate complete package configuration
   * @param manifestPath - Path to package.json file
   * @returns Promise resolving to validation result
   */
  validatePackage(manifestPath: string): Promise<PackageValidationResult>;

  /**
   * Validate package manifest object
   * @param manifest - Package manifest object to validate
   * @returns Promise resolving to validation result
   */
  validateManifest(manifest: PackageManifest): Promise<PackageValidationResult>;

  /**
   * Check if package name is available in npm registry
   * @param packageName - Name to check availability for
   * @returns Promise resolving to availability result
   */
  validateNameAvailability(packageName: string): Promise<NameAvailabilityResult>;
}
