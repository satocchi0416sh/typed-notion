import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, loadEnvironment } from '../config/loader.js';
import { DataSourceClient } from '../api/data-source-client.js';
import { writeFile, ensureDirectory } from '../utils/file-system.js';
import { formatError } from '../utils/error-handling.js';
import { generateSchemaTemplate, generateTypeDefinitionTemplate } from '../templates/index.js';
import type { DataSourceClientConfig } from '../types/notion-api.js';

interface PullOptions {
  config: string;
  force: boolean;
  nonInteractive?: boolean;
  dataSource?: string;
}

export function createPullCommand(): Command {
  return new Command('pull')
    .description('Pull schemas from Notion data sources')
    .option('-c, --config <path>', 'Path to configuration file', 'typed-notion.config.ts')
    .option('-f, --force', 'Overwrite existing schema files', false)
    .option('-n, --non-interactive', 'Run without prompts (CI/CD mode)', false)
    .option('-s, --data-source <id>', 'Specific data source to pull')
    .action(async (options: PullOptions) => {
      try {
        await handlePullCommand(options);
      } catch (error) {
        console.error(formatError(error instanceof Error ? error : new Error(String(error))));
        process.exit(1);
      }
    });
}

async function handlePullCommand(options: PullOptions): Promise<void> {
  console.log(chalk.blue('\n🔄 Pulling schemas from Notion\n'));

  // Load configuration
  const configPath = join(process.cwd(), options.config);
  if (!existsSync(configPath)) {
    console.error(chalk.red(`Configuration file not found: ${options.config}`));
    console.error(chalk.gray('Run "typed-notion init" to create a configuration file.'));
    process.exit(1);
  }

  const config = await loadConfig(configPath);

  const environment = loadEnvironment();

  // Initialize data source client
  const clientConfig: DataSourceClientConfig = {
    environment,
  };

  if (config.retry) {
    clientConfig.retry = config.retry;
  }

  const client = new DataSourceClient(clientConfig);

  // Determine which data sources to pull
  let dataSourcesToProcess: Array<{ id: string; name?: string }> = [];

  if (options.dataSource) {
    // Single data source specified via CLI
    dataSourcesToProcess.push({ id: options.dataSource });
  } else if (config.databases && Object.keys(config.databases).length > 0) {
    // Use configured databases
    dataSourcesToProcess = Object.entries(config.databases).map(([name, dbConfig]) => ({
      id: dbConfig.dataSourceId || dbConfig.databaseId!,
      name,
    }));

    // Show warning if using legacy database IDs
    const hasLegacy = Object.values(config.databases).some(db => db.databaseId && !db.dataSourceId);
    if (hasLegacy) {
      console.log(
        chalk.yellow('⚠ Using legacy database configuration. Consider migrating to data sources.')
      );
    }
  } else if (!options.nonInteractive) {
    // Interactive mode - discover data sources
    console.log(chalk.gray('No data sources configured. Discovering available sources...'));
    dataSourcesToProcess = await discoverAndSelectDataSources(client);
  } else {
    console.error(chalk.red('No data sources configured and running in non-interactive mode.'));
    console.error(
      chalk.gray('Configure data sources in your config file or use interactive mode.')
    );
    process.exit(1);
  }

  if (dataSourcesToProcess.length === 0) {
    console.log(chalk.yellow('No data sources to process.'));
    return;
  }

  // Process each data source - for now just output individual files based on config.output
  const outputPath = config.output;
  const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/')) || './src/lib';
  await ensureDirectory(outputDir);

  for (const dataSource of dataSourcesToProcess) {
    await processDataSource(client, dataSource, outputDir, options.force);
  }

  console.log(
    chalk.green(
      `\n✅ Successfully generated schemas for ${dataSourcesToProcess.length} data source(s)`
    )
  );
  console.log(chalk.gray('\nNext steps:'));
  console.log(chalk.gray('  1. Import the generated schemas in your code'));
  console.log(chalk.gray('  2. Use the type-safe interfaces for your Notion data'));
}

async function discoverAndSelectDataSources(
  client: DataSourceClient
): Promise<Array<{ id: string; name?: string }>> {
  try {
    const availableSources = await client.listDataSources();

    if (availableSources.length === 0) {
      console.log(
        chalk.yellow('No data sources found. Make sure your integration has access to databases.')
      );
      return [];
    }

    const choices = availableSources.map(source => ({
      title: `${source.name} (${source.id})`,
      value: { id: source.id, name: source.name },
    }));

    const response = await prompts({
      type: 'multiselect',
      name: 'selectedSources',
      message: 'Select data sources to generate schemas for:',
      choices,
      min: 1,
    });

    return response.selectedSources || [];
  } catch (error) {
    console.error(chalk.red('Failed to discover data sources:'));
    console.error(chalk.gray(error instanceof Error ? error.message : 'Unknown error'));
    return [];
  }
}

async function processDataSource(
  client: DataSourceClient,
  dataSource: { id: string; name?: string },
  outputDir: string,
  force: boolean
): Promise<void> {
  console.log(chalk.gray(`Processing data source: ${dataSource.name || dataSource.id}`));

  try {
    // Fetch schema from Notion
    const schema = await client.fetchDataSourceSchema(dataSource.id);

    // Generate schema name from data source name or ID
    const schemaName = generateSchemaName(dataSource.name || schema.name || dataSource.id);

    // Transform properties to TypeScript types
    const properties = Object.entries(schema.properties).map(([name, property]) => ({
      name,
      type: generateTypeDefinitionTemplate(name, property.type, property.configuration),
      nullable: property.type !== 'title', // Title is always required
    }));

    // Generate TypeScript schema file
    const schemaContent = generateSchemaTemplate(schemaName, properties);

    // Determine output path
    const outputPath = join(outputDir, `${schemaName.toLowerCase()}.ts`);

    // Check if file exists and handle overwrite
    if (existsSync(outputPath) && !force) {
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `Schema file already exists: ${outputPath}. Overwrite?`,
        initial: false,
      });

      if (!response.overwrite) {
        console.log(chalk.yellow(`Skipped: ${outputPath}`));
        return;
      }
    }

    // Write schema file
    await writeFile(outputPath, schemaContent);
    console.log(chalk.green(`✓ Generated: ${outputPath}`));
  } catch (error) {
    console.error(chalk.red(`Failed to process data source ${dataSource.id}:`));
    console.error(chalk.gray(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function generateSchemaName(input: string): string {
  // Convert to PascalCase suitable for TypeScript interface names
  return (
    input
      .replace(/[^a-zA-Z0-9\s]/g, ' ') // Replace special chars with spaces
      .split(/\s+/) // Split on whitespace
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('') || 'NotionSchema'
  ); // Fallback name
}
