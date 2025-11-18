# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript project for building type-safe Notion API integrations using the official `@notionhq/client` library.

## Essential Commands

### Development
```bash
npx ts-node <file>     # Execute TypeScript files directly
npx tsc                # Type check the codebase
npx tsc --watch        # Watch mode for continuous type checking
```

### Package Management
```bash
npm install            # Install dependencies
```

## TypeScript Configuration

The project uses strict TypeScript settings:
- **Module System**: Modern Node.js (`"nodenext"`) with ES modules
- **Target**: ESNext for latest JavaScript features  
- **Strict Mode**: Enabled with additional safety checks
  - `noUncheckedIndexedAccess` - Array access must be checked
  - `exactOptionalPropertyTypes` - Strict optional property handling
- **Isolation**: Each file can be transpiled independently

## Code Style Requirements

### Type Safety
- Always handle undefined/null cases due to strict null checks
- Check array access: `array[index]?.property` 
- Use exact optional property types
- Leverage TypeScript's strict mode for error prevention

### Module System
- Use ES modules (`import`/`export`) exclusively
- Avoid global scope pollution (all files treated as modules)

### Notion API Integration
- Store API tokens in `.env` file using dotenv
- Use official `@notionhq/client` for all Notion operations
- Implement proper error handling for API calls
- Follow Notion's API patterns for database and page operations

## Architecture Recommendations

```
src/
├── types/          # TypeScript type definitions
├── clients/        # Notion API client configuration  
├── services/       # Business logic for Notion operations
├── utils/          # Helper functions
└── index.ts        # Main entry point
```

## Task Completion Standards

Since testing/linting infrastructure is not yet configured:
1. Run `npx tsc` to verify no TypeScript errors
2. Test functionality manually with `npx ts-node`
3. Verify environment variables are properly configured
4. Ensure API error handling is implemented

## Environment Setup

Required environment variables:
```bash
NOTION_TOKEN=<your_integration_token>
NOTION_DATABASE_ID=<optional_database_id>
```