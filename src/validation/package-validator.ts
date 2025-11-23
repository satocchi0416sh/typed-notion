/**
 * Package Validator Implementation
 * Validates npm package configuration and structure.
 */

import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import type {
  PackageValidator as IPackageValidator,
  PackageValidationResult,
  PackageManifest,
  NameAvailabilityResult,
  ValidationError,
  ValidationWarning,
} from './types.js';

export class PackageValidator implements IPackageValidator {
  private readonly rulesVersion = '1.0.0';

  async validatePackage(manifestPath: string): Promise<PackageValidationResult> {
    const startTime = performance.now();

    try {
      // Read and parse package.json
      const content = await readFile(manifestPath, 'utf-8');
      const manifest: PackageManifest = JSON.parse(content);

      // Validate the manifest
      const result = await this.validateManifest(manifest);

      // Additional file-based validation
      const packageDir = dirname(manifestPath);
      const fileErrors = await this.validateFileStructure(manifest, packageDir);

      const endTime = performance.now();

      return {
        ...result,
        errors: [...result.errors, ...fileErrors],
        metadata: {
          ...result.metadata,
          duration: endTime - startTime,
        },
      };
    } catch (error) {
      const endTime = performance.now();

      return {
        isValid: false,
        errors: [
          {
            code: 'FILE_NOT_FOUND',
            message: `Failed to read package.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
            location: manifestPath,
            suggestion: 'Ensure package.json exists and is valid JSON',
          },
        ],
        warnings: [],
        metadata: {
          timestamp: new Date().toISOString(),
          rulesVersion: this.rulesVersion,
          duration: endTime - startTime,
          environment: await this.getEnvironment(),
        },
      };
    }
  }

  async validateManifest(manifest: PackageManifest): Promise<PackageValidationResult> {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    this.validateRequiredFields(manifest, errors);

    // Validate field values
    this.validateFieldValues(manifest, errors, warnings);

    // Validate exports configuration
    this.validateExportsConfig(manifest, errors, warnings);

    // Validate dependencies
    this.validateDependencies(manifest, errors, warnings);

    const endTime = performance.now();

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        timestamp: new Date().toISOString(),
        rulesVersion: this.rulesVersion,
        duration: endTime - startTime,
        environment: await this.getEnvironment(),
      },
    };
  }

  async validateNameAvailability(packageName: string): Promise<NameAvailabilityResult> {
    try {
      // Use npm registry API to check name availability
      const response = await globalThis.fetch(`https://registry.npmjs.org/${packageName}`);

      if (response.status === 404) {
        return { available: true };
      } else if (response.ok) {
        const packageData = (await response.json()) as {
          name: string;
          'dist-tags'?: { latest?: string };
          description?: string;
          author?: string | { name?: string };
        };
        const existingPackage: {
          name: string;
          version: string;
          description?: string;
          author?: string;
        } = {
          name: packageData.name,
          version: packageData['dist-tags']?.latest || 'unknown',
        };

        if (packageData.description) {
          existingPackage.description = packageData.description;
        }

        if (typeof packageData.author === 'string') {
          existingPackage.author = packageData.author;
        } else if (packageData.author?.name) {
          existingPackage.author = packageData.author.name;
        }

        return {
          available: false,
          existingPackage,
          suggestions: this.generateNameSuggestions(packageName),
        };
      } else {
        // Network error or other issue
        return {
          available: false,
          suggestions: this.generateNameSuggestions(packageName),
        };
      }
    } catch {
      // Fallback - assume not available for safety
      return {
        available: false,
        suggestions: this.generateNameSuggestions(packageName),
      };
    }
  }

  private validateRequiredFields(manifest: PackageManifest, errors: ValidationError[]): void {
    const requiredFields: (keyof PackageManifest)[] = ['name', 'version', 'description'];

    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push({
          code: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${field}' is missing`,
          location: String(field),
          suggestion: `Add a ${field} field to your package.json`,
        });
      }
    }
  }

  private validateFieldValues(
    manifest: PackageManifest,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate version format (semantic versioning)
    if (manifest.version && !/^\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/.test(manifest.version)) {
      errors.push({
        code: 'INVALID_VERSION_FORMAT',
        message: `Version '${manifest.version}' is not valid semantic versioning format`,
        location: 'version',
        suggestion: 'Use semantic versioning format like 1.0.0, 1.0.0-alpha.1, etc.',
      });
    }

    // Validate license
    if (manifest.license && !this.isValidSPDXLicense(manifest.license)) {
      errors.push({
        code: 'INVALID_LICENSE',
        message: `License '${manifest.license}' is not a valid SPDX identifier`,
        location: 'license',
        suggestion: 'Use a valid SPDX license identifier like MIT, Apache-2.0, GPL-3.0, etc.',
      });
    }

    // Check for recommended fields
    const recommendedFields: (keyof PackageManifest)[] = [
      'keywords',
      'author',
      'repository',
      'homepage',
    ];
    for (const field of recommendedFields) {
      if (!manifest[field]) {
        warnings.push({
          code: 'MISSING_OPTIONAL_FIELD',
          message: `Recommended field '${field}' is missing`,
          location: String(field),
          severity: field === 'keywords' ? 'high' : 'medium',
        });
      }
    }

    // Validate keywords length and quality
    if (manifest.keywords) {
      if (manifest.keywords.length < 3) {
        warnings.push({
          code: 'INCOMPLETE_KEYWORDS',
          message: 'Consider adding more keywords for better discoverability',
          location: 'keywords',
          severity: 'medium',
        });
      }
    }
  }

  private validateExportsConfig(
    manifest: PackageManifest,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (manifest.exports) {
      // Basic validation - ensure exports is properly structured
      if (typeof manifest.exports !== 'object') {
        errors.push({
          code: 'INVALID_EXPORTS_CONFIG',
          message: 'Exports field must be an object',
          location: 'exports',
          suggestion: 'Configure exports as an object with proper entry points',
        });
      }
    } else if (manifest.main || manifest.module || manifest.types) {
      warnings.push({
        code: 'MISSING_OPTIONAL_FIELD',
        message: 'Consider using modern exports field instead of main/module/types',
        location: 'exports',
        severity: 'low',
      });
    }
  }

  private validateDependencies(
    manifest: PackageManifest,
    _errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for common dependency issues

    // Check for duplicate dependencies across categories
    const depsKeys = Object.keys(manifest.dependencies || {});
    const devDepsKeys = Object.keys(manifest.devDependencies || {});
    const peerDepsKeys = Object.keys(manifest.peerDependencies || {});

    const duplicates = depsKeys.filter(
      dep => devDepsKeys.includes(dep) || peerDepsKeys.includes(dep)
    );

    for (const duplicate of duplicates) {
      warnings.push({
        code: 'DEPENDENCY_MISMATCH',
        message: `Dependency '${duplicate}' appears in multiple categories`,
        location: 'dependencies',
        severity: 'medium',
      });
    }
  }

  private async validateFileStructure(
    manifest: PackageManifest,
    packageDir: string
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check if main/module/types files exist
    const filesToCheck = [
      { field: 'main', path: manifest.main },
      { field: 'module', path: manifest.module },
      { field: 'types', path: manifest.types },
    ].filter((item): item is { field: string; path: string } => Boolean(item.path));

    for (const { field, path } of filesToCheck) {
      if (path) {
        try {
          await access(join(packageDir, path));
        } catch {
          errors.push({
            code: 'FILE_NOT_FOUND',
            message: `File specified in '${field}' does not exist: ${path}`,
            location: String(field),
            suggestion: `Build the project or update the ${field} field to point to an existing file`,
          });
        }
      }
    }

    return errors;
  }

  private isValidSPDXLicense(license: string): boolean {
    // Common SPDX license identifiers
    const commonLicenses = [
      'MIT',
      'Apache-2.0',
      'GPL-3.0',
      'GPL-2.0',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'ISC',
      'MPL-2.0',
      'LGPL-3.0',
      'LGPL-2.1',
      'UNLICENSED',
    ];

    return commonLicenses.includes(license) || /^[A-Za-z0-9.-]+$/.test(license);
  }

  private generateNameSuggestions(packageName: string): string[] {
    const suggestions: string[] = [];

    // Add common prefixes/suffixes
    suggestions.push(`${packageName}-js`);
    suggestions.push(`${packageName}-lib`);
    suggestions.push(`${packageName}-core`);
    suggestions.push(`@yourorg/${packageName}`);

    // Add with common variations
    suggestions.push(`${packageName}2`);
    suggestions.push(`new-${packageName}`);

    return suggestions.slice(0, 5); // Return max 5 suggestions
  }

  private async getEnvironment() {
    return {
      nodeVersion: process.version,
      npmVersion: await this.getNpmVersion(),
      platform: process.platform,
      typescriptVersion: await this.getTypeScriptVersion(),
    };
  }

  private async getNpmVersion(): Promise<string> {
    try {
      const { spawn } = await import('child_process');
      return new Promise(resolve => {
        const npm = spawn('npm', ['--version']);
        let version = '';
        npm.stdout?.on('data', data => {
          version += data.toString();
        });
        npm.on('close', () => {
          resolve(version.trim() || 'unknown');
        });
        npm.on('error', () => {
          resolve('unknown');
        });
      });
    } catch {
      return 'unknown';
    }
  }

  private async getTypeScriptVersion(): Promise<string | undefined> {
    try {
      const { spawn } = await import('child_process');
      return new Promise(resolve => {
        const tsc = spawn('npx', ['tsc', '--version']);
        let version = '';
        tsc.stdout?.on('data', data => {
          version += data.toString();
        });
        tsc.on('close', () => {
          const match = version.match(/Version\s+(\d+\.\d+\.\d+)/);
          resolve(match ? match[1] : undefined);
        });
        tsc.on('error', () => {
          resolve(undefined);
        });
      });
    } catch {
      return undefined;
    }
  }
}
