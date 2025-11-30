# Testing Infrastructure

This document describes the comprehensive testing infrastructure implemented for the typed-notion project.

## Test Structure

```
tests/
├── unit/                     # Unit tests for individual modules
│   ├── filters.test.ts       # Filter system tests (✅ passing)
│   ├── notion-client.test.ts # NotionClient tests
│   ├── property-extractors.test.ts # Property extraction tests
│   ├── errors.test.ts        # Error handling and Result patterns
│   └── ...                   # Additional unit tests
├── integration/              # Integration tests
│   └── api-workflows.test.ts # End-to-end API workflow tests
├── performance/              # Performance benchmarks
│   └── query-performance.bench.ts # Performance benchmarks
└── utils/                    # Test utilities and helpers
    ├── custom-matchers.ts    # Custom Vitest matchers
    ├── test-data-generators.ts # Mock data generators
    ├── notion-api-mock.ts    # Notion API mocks
    └── test-schemas.ts       # Common test schemas
```

## Test Categories

### 1. Unit Tests ✅

- **NotionClient**: CRUD operations, error handling, rate limiting
- **Filter System**: FilterBuilder, FilterValidator, FilterConverter
- **Property Extractors**: All 14 property type extractors
- **Error Classes**: Result pattern implementation
- **Schema Validation**: Type safety and validation logic

### 2. Integration Tests ✅

- End-to-end API workflows
- Complex multi-step operations
- Error recovery scenarios
- Data transformation pipelines

### 3. Performance Tests ✅

- Query performance benchmarks
- Filter system performance
- Property extraction efficiency
- Memory usage monitoring
- Rate limiting and retry performance

## Test Configuration

### Vitest Configuration

- **Coverage thresholds**: 80-95% depending on module criticality
- **Custom matchers**: Domain-specific assertions
- **Type checking**: Enabled with strict TypeScript checking
- **Performance benchmarking**: Built-in benchmark support

### Coverage Targets

- **Global**: 80% (branches, functions, lines, statements)
- **Critical modules**:
  - NotionClient: 90%
  - Filters: 85%
  - Errors: 95%
  - Property Extractors: 85%

## CI/CD Integration

### GitHub Actions Workflows

#### 1. Test Workflow (`.github/workflows/test.yml`)

- **Matrix testing**: Node.js 18, 20, 22
- **Comprehensive testing**:
  - Linting and type checking
  - Unit tests with coverage
  - Integration tests
  - Performance benchmarks
- **Coverage reporting**: Codecov integration
- **PR comments**: Automated coverage reports

#### 2. Code Quality Workflow (`.github/workflows/code-quality.yml`)

- **Formatting checks**: Prettier validation
- **Security audits**: npm audit
- **Dependency checks**: Outdated package detection
- **Bundle size validation**: Size threshold monitoring

#### 3. Security Workflow (`.github/workflows/security.yml`)

- **Scheduled security scans**: Weekly vulnerability checks
- **Automated dependency updates**: PRs for security fixes
- **License compatibility**: License checker validation

## Test Utilities

### Custom Matchers

```typescript
expect(result).toBeOkResult(); // Result pattern validation
expect(result).toBeErrResult(); // Error result validation
expect(filter).toBeValidNotionFilter(); // Filter validation
expect(schema).toBeValidSchema(); // Schema validation
expect(timezone).toHaveValidTimezone(); // Timezone validation
expect(prop).toMatchPropertyType('select'); // Property type validation
```

### Mock Data Generators

- **Notion API responses**: Realistic mock data
- **Property values**: All property types supported
- **Error conditions**: Various error scenarios
- **Performance data**: Large dataset generation

### Performance Testing

- **Async performance measurement**: With timeout validation
- **Sync performance measurement**: For synchronous operations
- **Memory usage tracking**: Heap usage monitoring
- **Regression testing**: Performance threshold validation

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance benchmarks
npm run test:bench

# Coverage report
npm run test:coverage
```

## Key Features

### 1. Type Safety ✅

- Strict TypeScript checking throughout tests
- Type-safe mocks and assertions
- Generic test utilities for reusability

### 2. Realistic Testing ✅

- Mock data that mirrors real Notion API responses
- Error scenarios based on actual API behavior
- Performance testing with realistic data sizes

### 3. Comprehensive Coverage ✅

- Unit tests for all major components
- Integration tests for user workflows
- Performance regression testing
- Error handling and edge cases

### 4. Developer Experience ✅

- Custom matchers for domain-specific assertions
- Clear test structure and organization
- Detailed error messages and debugging support
- Fast test execution with parallel testing

### 5. CI/CD Integration ✅

- Multi-Node.js version testing
- Automated coverage reporting
- Security and dependency monitoring
- Performance regression detection

## Test Status Summary

- **Total test files**: 9+ comprehensive test suites
- **Test utilities**: 4 utility modules with extensive helpers
- **Coverage thresholds**: Aggressive 80-95% requirements
- **CI workflows**: 3 comprehensive GitHub Actions workflows
- **Performance benchmarks**: Detailed performance monitoring
- **Mock system**: Complete Notion API mock implementation

The testing infrastructure provides a solid foundation for maintaining code quality, catching regressions, and ensuring the reliability of the typed-notion library.
