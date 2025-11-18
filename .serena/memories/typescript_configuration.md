# TypeScript Configuration

## Key Configuration Settings
- **Module System**: `"nodenext"` - Modern Node.js module resolution
- **Target**: `"esnext"` - Latest JavaScript features
- **Strict Mode**: Enabled with additional strict checks:
  - `noUncheckedIndexedAccess: true` - Requires checking array access
  - `exactOptionalPropertyTypes: true` - Strict optional property handling
- **Module Detection**: `"force"` - Forces all files to be treated as modules
- **JSX**: `"react-jsx"` - Suggests React might be used in the future
- **Output**: Source maps and declaration files enabled
- **Isolation**: `isolatedModules: true` - Each file can be transpiled independently

## Code Style Implications
- Strict null checks enabled
- Array access must be safely checked
- Optional properties require exact typing
- All files treated as ES modules
- Modern JavaScript features available