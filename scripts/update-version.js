#!/usr/bin/env node
/**
 * Automatic version update script
 * Updates version references across the codebase when semantic-release runs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import process from 'process';

const CURRENT_VERSION = process.argv[2] || process.env.SEMANTIC_RELEASE_VERSION;

if (!CURRENT_VERSION) {
  console.error('❌ No version provided. Usage: node update-version.js <version>');
  process.exit(1);
}

console.log(`📦 Updating version references to ${CURRENT_VERSION}`);

const updates = [
  // Core source file
  {
    file: 'src/index.ts',
    patterns: [
      {
        regex: /(\* @version )\d+\.\d+\.\d+/g,
        replacement: `$1${CURRENT_VERSION}`,
      },
      {
        regex: /(export const VERSION = ')\d+\.\d+\.\d+(')/g,
        replacement: `$1${CURRENT_VERSION}$2`,
      },
    ],
  },

  // Package validator rules version
  {
    file: 'src/validation/package-validator.ts',
    patterns: [
      {
        regex: /(private readonly rulesVersion = ')\d+\.\d+\.\d+(')/g,
        replacement: `$1${CURRENT_VERSION}$2`,
      },
    ],
  },
];

let updatedCount = 0;

updates.forEach(({ file, patterns }) => {
  try {
    const filePath = join(process.cwd(), file);
    let content = readFileSync(filePath, 'utf8');
    let fileUpdated = false;

    patterns.forEach(({ regex, replacement }) => {
      const newContent = content.replace(regex, replacement);
      if (newContent !== content) {
        content = newContent;
        fileUpdated = true;
      }
    });

    if (fileUpdated) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${file}`);
      updatedCount++;
    } else {
      console.log(`⏭️  No changes needed in ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
  }
});

// Clean up low-priority outdated files
const filesToClean = [
  'specs/001-mvp-properties/quickstart.md',
  'specs/001-npm-publish-prep/quickstart.md',
  'specs/001-npm-publish-prep/quickstart-legacy.md',
  'specs/001-npm-update-notifier/quickstart.md',
  'specs/001-npm-update-notifier/data-model.md',
  '.specify/memory/constitution.md',
];

console.log('\n🧹 Cleaning up outdated version references in documentation...');

filesToClean.forEach(file => {
  try {
    const filePath = join(process.cwd(), file);
    const content = readFileSync(filePath, 'utf8');

    // Replace any 1.0.0 references with current version
    const newContent = content.replace(/1\.0\.0/g, CURRENT_VERSION);

    if (newContent !== content) {
      writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Cleaned ${file}`);
      updatedCount++;
    }
  } catch {
    // File might not exist, which is fine
    console.log(`⏭️  Skipped ${file} (file not found)`);
  }
});

console.log(
  `\n🎉 Version update complete! Updated ${updatedCount} files to version ${CURRENT_VERSION}`
);
