# Suggested Commands

## Development Commands
Since this is a fresh project with minimal package.json scripts, here are the essential commands:

### TypeScript Execution
```bash
npx ts-node <file>  # Run TypeScript files directly
npx tsc             # Compile TypeScript (check for errors)
npx tsc --watch     # Watch mode compilation
```

### Package Management
```bash
npm install         # Install dependencies
npm update          # Update dependencies
```

### Notion API Development
```bash
# Set up environment variables (create .env file)
# Required: NOTION_TOKEN=<your_integration_token>
# Optional: NOTION_DATABASE_ID=<database_id>
```

### Future Development Commands (to be added to package.json)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Development server with hot reload
- `npm run test` - Run tests
- `npm run lint` - Code linting
- `npm start` - Start the application

## System Commands (macOS/Darwin)
- `ls -la` - List files including hidden
- `find . -name "*.ts" -type f` - Find TypeScript files
- `grep -r "pattern" .` - Search for patterns (use rg if available)