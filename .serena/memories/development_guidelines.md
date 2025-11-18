# Development Guidelines

## Code Style and Conventions
Based on the TypeScript configuration, follow these patterns:

### Type Safety
- Use strict null checks - always handle undefined/null cases
- Check array access with optional chaining: `array[index]?.property`
- Use exact optional property types - avoid `| undefined` when not needed
- Leverage TypeScript's strict mode for better error catching

### Module System
- Use ES modules (`import`/`export`) exclusively
- Each file is treated as a module - avoid global scope pollution
- Use `.js` extensions in imports for Node.js compatibility when needed

### Notion API Integration
- Use the official `@notionhq/client` package
- Store API tokens in environment variables via dotenv
- Follow Notion's API patterns for database queries and page manipulation
- Implement proper error handling for API calls

### File Organization (Recommendations)
```
src/
├── types/          # TypeScript type definitions
├── clients/        # Notion API client setup
├── services/       # Business logic for Notion operations
├── utils/          # Helper functions
└── index.ts        # Main entry point
```

## Task Completion Standards
Since no testing/linting is set up yet:
1. Run `npx tsc` to check for TypeScript errors
2. Test manually with `npx ts-node` 
3. Verify environment variables are properly configured
4. Ensure API calls handle errors gracefully