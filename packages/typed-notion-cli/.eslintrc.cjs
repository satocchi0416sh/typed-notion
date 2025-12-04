module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn', // Changed to warn to allow necessary API types
    '@typescript-eslint/no-non-null-assertion': 'error',

    // Extension rules - disable base rule to avoid conflicts
    'no-empty-function': 'off', // Must disable base rule for TypeScript extension
    '@typescript-eslint/no-empty-function': 'error',

    // General
    'no-console': 'off', // CLI tools need console output for user interaction
    'no-process-exit': 'off', // CLI tools need process.exit
    'prefer-const': 'error',
    'no-var': 'error',

    // Import/export
    'no-duplicate-imports': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '*.d.ts'],
};
