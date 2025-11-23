/**
 * Package Validation API Implementation
 *
 * Provides validation functionality for npm package configuration and structure.
 */

import { PackageValidator } from './package-validator.js';
import type { PackageValidationResult, PackageManifest, NameAvailabilityResult } from './types.js';

export * from './types.js';
export { PackageValidator } from './package-validator.js';

// Re-export build pipeline from publishing module
export { BuildPipeline } from '../publishing/build-pipeline.js';
export type {
  BuildArtifact,
  BuildPerformance,
  BuildResult,
  BuildConfiguration,
} from '../publishing/build-pipeline.js';

// Default validator instance
export const validator: PackageValidator = new PackageValidator();

// Convenience functions
export const validatePackage: (manifestPath: string) => Promise<PackageValidationResult> =
  validator.validatePackage.bind(validator);
export const validateManifest: (manifest: PackageManifest) => Promise<PackageValidationResult> =
  validator.validateManifest.bind(validator);
export const validateNameAvailability: (packageName: string) => Promise<NameAvailabilityResult> =
  validator.validateNameAvailability.bind(validator);
