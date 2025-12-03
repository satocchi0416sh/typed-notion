#!/usr/bin/env node

import { Command } from 'commander';
import { createInitCommand } from './commands/init.js';
import { createPullCommand } from './commands/pull.js';
import { createValidateCommand } from './commands/validate.js';
import { CLIError } from './utils/error-handling.js';

const program = new Command();

program
  .name('typed-notion')
  .description('CLI tool for generating type-safe TypeScript schemas from Notion data sources')
  .version('0.1.0');

// Register commands
program.addCommand(createInitCommand());
program.addCommand(createPullCommand());
program.addCommand(createValidateCommand());

// Global error handler
program.exitOverride(err => {
  if (err instanceof CLIError) {
    console.error(`Error: ${err.message}`);
    if (err.suggestion) {
      console.error(`Suggestion: ${err.suggestion}`);
    }
    process.exit(err.exitCode);
  }
  throw err;
});

// Parse command line arguments
program.parseAsync(process.argv).catch(error => {
  if (error instanceof CLIError) {
    console.error(`Error: ${error.message}`);
    if (error.suggestion) {
      console.error(`Suggestion: ${error.suggestion}`);
    }
    process.exit(error.exitCode);
  } else {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
});
