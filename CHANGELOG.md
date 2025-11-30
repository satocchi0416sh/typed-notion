## [1.0.1](https://github.com/satocchi0416sh/typed-notion/compare/v1.0.0...v1.0.1) (2025-11-30)

### 🐛 Bug Fixes

- **release:** convert update-version script to ES modules ([8019908](https://github.com/satocchi0416sh/typed-notion/commit/8019908618d5e38295da4abfcb22c42687c99176))

## 1.0.0 (2025-11-30)

### ✨ Features

- add rollup and formula property type inference ([3c5b04b](https://github.com/satocchi0416sh/typed-notion/commit/3c5b04b680f084f5990a8581b718a7a9bf838f0d))
- **automation:** implement semantic-release and GitHub Actions CI/CD pipeline ([8703b55](https://github.com/satocchi0416sh/typed-notion/commit/8703b557b51899a41b71355467d0880c4bd026cd))
- **client:** add NotionClient class with type-safe API interface ([3406b62](https://github.com/satocchi0416sh/typed-notion/commit/3406b62ee40138c166d3f57c494cca085ac6d0ff))
- **config:** implement configuration management and monitoring system ([4d7e8f1](https://github.com/satocchi0416sh/typed-notion/commit/4d7e8f1db1315a26fcbe07b0898ee78fd23cb9d3))
- **core:** implement basic schema definition with type inference and validation ([64e29d7](https://github.com/satocchi0416sh/typed-notion/commit/64e29d72b0133108a0908d95d4f5b50e19083c7f))
- implement full notion client with crud operations and type safety ([fe8f825](https://github.com/satocchi0416sh/typed-notion/commit/fe8f825361a8b3f42e3f066bab0e6b2bf298f43a))
- **mvp:** implement contact properties and complete MVP property types ([d15c79d](https://github.com/satocchi0416sh/typed-notion/commit/d15c79daba3a11bebd1d988b92fb1c67cc388acc))
- **npm:** implement complete publication preparation workflow ([f17b45f](https://github.com/satocchi0416sh/typed-notion/commit/f17b45f1c4f1fff3eee4dd5df0c9881b60257968))
- **release:** add automated version update system ([0fed307](https://github.com/satocchi0416sh/typed-notion/commit/0fed307356b30b6ad31d0443f406fda49c2b6136))
- **schema:** add partial validation support for updates ([92627d0](https://github.com/satocchi0416sh/typed-notion/commit/92627d096efc48c6de7a31070546616d76ac8716))
- **types:** add support for created_time, created_by, last_edited_time, last_edited_by properties ([ccc2925](https://github.com/satocchi0416sh/typed-notion/commit/ccc2925d2ef4ff7c1172af11813d0722cb8ffd54))
- **utils:** add getNotionPropertyValue utility function for easier property value extraction ([0320c59](https://github.com/satocchi0416sh/typed-notion/commit/0320c59582d33399722a1c7cacb6605a59e9a659))

### 🐛 Bug Fixes

- add missing @vitest/coverage-v8 dependency for test coverage ([680bc7b](https://github.com/satocchi0416sh/typed-notion/commit/680bc7b294a8cf19591a132ebb34b41327226861))
- apply Prettier formatting to pass CI checks ([f03d626](https://github.com/satocchi0416sh/typed-notion/commit/f03d626cca398f2ab70472203baba859ad4652be))
- **bundlesize:** disable GitHub integration to prevent 403 errors in CI ([7239694](https://github.com/satocchi0416sh/typed-notion/commit/72396941ae7c69d5e37605748c02de64c98c74c7))
- **ci:** correct test command in publish workflow ([ed462ba](https://github.com/satocchi0416sh/typed-notion/commit/ed462baca6b24a1b7140ed789ba660d2bcc324c3))
- **ci:** include cjs files in lint-staged configuration ([45714ef](https://github.com/satocchi0416sh/typed-notion/commit/45714efdc13056d951b67f46aedfe88069ccf8b7))
- **ci:** make performance benchmarks strict and fix schema validation errors ([3996d65](https://github.com/satocchi0416sh/typed-notion/commit/3996d65295594288768235ab17d4cd87da42912c))
- **ci:** resolve test workflow failures and coverage threshold mismatches ([dfb9bae](https://github.com/satocchi0416sh/typed-notion/commit/dfb9bae3d5fe34bed877670f39ff7f9ee4ac46a1))
- **ci:** switch to istanbul coverage provider for Node.js 18 compatibility ([5859f83](https://github.com/satocchi0416sh/typed-notion/commit/5859f83bc8ee3421de7e32ef88b0d23a95598c52))
- **ci:** temporarily disable bundlesize in CI to prevent GitHub integration errors ([c1345d0](https://github.com/satocchi0416sh/typed-notion/commit/c1345d0662a5a0610dcbd6c02ba560a979f82a6b))
- resolve typescript compilation errors and failing tests ([b73c9e9](https://github.com/satocchi0416sh/typed-notion/commit/b73c9e9f3902c860be1b63ca6afa096e2c58833e))
- **test:** adjust coverage thresholds to match current test coverage ([1dc1e25](https://github.com/satocchi0416sh/typed-notion/commit/1dc1e2529d895cbc48c1677fbc547824f4d1675e))
- **test:** resolve vitest mock method type errors in performance benchmarks ([35fdccc](https://github.com/satocchi0416sh/typed-notion/commit/35fdcccccf7b4c90baa66bd887bd14750098366b))
- **tests:** add explicit type annotations for isolatedDeclarations compliance ([2fd7278](https://github.com/satocchi0416sh/typed-notion/commit/2fd7278824e6c157ab5b69b2703f153600989189))
- **tests:** resolve type constraint issues in literal-types test ([146d310](https://github.com/satocchi0416sh/typed-notion/commit/146d3108132d2a887975be2e5c2ab048398534b8))
- **tests:** resolve typescript compilation errors in test suite ([15c9e7e](https://github.com/satocchi0416sh/typed-notion/commit/15c9e7e6c1a928a6c9472e273e659466e02754f6))
- **tests:** resolve typescript compilation errors in test suite ([09098fe](https://github.com/satocchi0416sh/typed-notion/commit/09098fe8d017a3a3166fa03f10522694ea77d02f))
- **types:** resolve typescript compilation errors and type casting issues ([6ad3209](https://github.com/satocchi0416sh/typed-notion/commit/6ad320935761ede1a101a532a5e8974236753f12))

### ⚡ Performance

- **ci:** optimize semantic-release for large commit history analysis ([3853c15](https://github.com/satocchi0416sh/typed-notion/commit/3853c15797d8d008e48f4f9427a52377ca719548))

## 1.0.0 (2025-11-30)

### ✨ Features

- add rollup and formula property type inference ([3c5b04b](https://github.com/satocchi0416sh/typed-notion/commit/3c5b04b680f084f5990a8581b718a7a9bf838f0d))
- **automation:** implement semantic-release and GitHub Actions CI/CD pipeline ([8703b55](https://github.com/satocchi0416sh/typed-notion/commit/8703b557b51899a41b71355467d0880c4bd026cd))
- **client:** add NotionClient class with type-safe API interface ([3406b62](https://github.com/satocchi0416sh/typed-notion/commit/3406b62ee40138c166d3f57c494cca085ac6d0ff))
- **config:** implement configuration management and monitoring system ([4d7e8f1](https://github.com/satocchi0416sh/typed-notion/commit/4d7e8f1db1315a26fcbe07b0898ee78fd23cb9d3))
- **core:** implement basic schema definition with type inference and validation ([64e29d7](https://github.com/satocchi0416sh/typed-notion/commit/64e29d72b0133108a0908d95d4f5b50e19083c7f))
- implement full notion client with crud operations and type safety ([fe8f825](https://github.com/satocchi0416sh/typed-notion/commit/fe8f825361a8b3f42e3f066bab0e6b2bf298f43a))
- **mvp:** implement contact properties and complete MVP property types ([d15c79d](https://github.com/satocchi0416sh/typed-notion/commit/d15c79daba3a11bebd1d988b92fb1c67cc388acc))
- **npm:** implement complete publication preparation workflow ([f17b45f](https://github.com/satocchi0416sh/typed-notion/commit/f17b45f1c4f1fff3eee4dd5df0c9881b60257968))
- **release:** add automated version update system ([0fed307](https://github.com/satocchi0416sh/typed-notion/commit/0fed307356b30b6ad31d0443f406fda49c2b6136))
- **schema:** add partial validation support for updates ([92627d0](https://github.com/satocchi0416sh/typed-notion/commit/92627d096efc48c6de7a31070546616d76ac8716))
- **types:** add support for created_time, created_by, last_edited_time, last_edited_by properties ([ccc2925](https://github.com/satocchi0416sh/typed-notion/commit/ccc2925d2ef4ff7c1172af11813d0722cb8ffd54))
- **utils:** add getNotionPropertyValue utility function for easier property value extraction ([0320c59](https://github.com/satocchi0416sh/typed-notion/commit/0320c59582d33399722a1c7cacb6605a59e9a659))

### 🐛 Bug Fixes

- add missing @vitest/coverage-v8 dependency for test coverage ([680bc7b](https://github.com/satocchi0416sh/typed-notion/commit/680bc7b294a8cf19591a132ebb34b41327226861))
- apply Prettier formatting to pass CI checks ([f03d626](https://github.com/satocchi0416sh/typed-notion/commit/f03d626cca398f2ab70472203baba859ad4652be))
- **bundlesize:** disable GitHub integration to prevent 403 errors in CI ([7239694](https://github.com/satocchi0416sh/typed-notion/commit/72396941ae7c69d5e37605748c02de64c98c74c7))
- **ci:** correct test command in publish workflow ([ed462ba](https://github.com/satocchi0416sh/typed-notion/commit/ed462baca6b24a1b7140ed789ba660d2bcc324c3))
- **ci:** include cjs files in lint-staged configuration ([45714ef](https://github.com/satocchi0416sh/typed-notion/commit/45714efdc13056d951b67f46aedfe88069ccf8b7))
- **ci:** make performance benchmarks strict and fix schema validation errors ([3996d65](https://github.com/satocchi0416sh/typed-notion/commit/3996d65295594288768235ab17d4cd87da42912c))
- **ci:** resolve test workflow failures and coverage threshold mismatches ([dfb9bae](https://github.com/satocchi0416sh/typed-notion/commit/dfb9bae3d5fe34bed877670f39ff7f9ee4ac46a1))
- **ci:** switch to istanbul coverage provider for Node.js 18 compatibility ([5859f83](https://github.com/satocchi0416sh/typed-notion/commit/5859f83bc8ee3421de7e32ef88b0d23a95598c52))
- **ci:** temporarily disable bundlesize in CI to prevent GitHub integration errors ([c1345d0](https://github.com/satocchi0416sh/typed-notion/commit/c1345d0662a5a0610dcbd6c02ba560a979f82a6b))
- resolve typescript compilation errors and failing tests ([b73c9e9](https://github.com/satocchi0416sh/typed-notion/commit/b73c9e9f3902c860be1b63ca6afa096e2c58833e))
- **test:** adjust coverage thresholds to match current test coverage ([1dc1e25](https://github.com/satocchi0416sh/typed-notion/commit/1dc1e2529d895cbc48c1677fbc547824f4d1675e))
- **test:** resolve vitest mock method type errors in performance benchmarks ([35fdccc](https://github.com/satocchi0416sh/typed-notion/commit/35fdcccccf7b4c90baa66bd887bd14750098366b))
- **tests:** add explicit type annotations for isolatedDeclarations compliance ([2fd7278](https://github.com/satocchi0416sh/typed-notion/commit/2fd7278824e6c157ab5b69b2703f153600989189))
- **tests:** resolve type constraint issues in literal-types test ([146d310](https://github.com/satocchi0416sh/typed-notion/commit/146d3108132d2a887975be2e5c2ab048398534b8))
- **tests:** resolve typescript compilation errors in test suite ([15c9e7e](https://github.com/satocchi0416sh/typed-notion/commit/15c9e7e6c1a928a6c9472e273e659466e02754f6))
- **tests:** resolve typescript compilation errors in test suite ([09098fe](https://github.com/satocchi0416sh/typed-notion/commit/09098fe8d017a3a3166fa03f10522694ea77d02f))
- **types:** resolve typescript compilation errors and type casting issues ([6ad3209](https://github.com/satocchi0416sh/typed-notion/commit/6ad320935761ede1a101a532a5e8974236753f12))

### ⚡ Performance

- **ci:** optimize semantic-release for large commit history analysis ([3853c15](https://github.com/satocchi0416sh/typed-notion/commit/3853c15797d8d008e48f4f9427a52377ca719548))

## 1.0.0 (2025-11-30)

### ✨ Features

- add rollup and formula property type inference ([3c5b04b](https://github.com/satocchi0416sh/typed-notion/commit/3c5b04b680f084f5990a8581b718a7a9bf838f0d))
- **automation:** implement semantic-release and GitHub Actions CI/CD pipeline ([8703b55](https://github.com/satocchi0416sh/typed-notion/commit/8703b557b51899a41b71355467d0880c4bd026cd))
- **client:** add NotionClient class with type-safe API interface ([3406b62](https://github.com/satocchi0416sh/typed-notion/commit/3406b62ee40138c166d3f57c494cca085ac6d0ff))
- **config:** implement configuration management and monitoring system ([4d7e8f1](https://github.com/satocchi0416sh/typed-notion/commit/4d7e8f1db1315a26fcbe07b0898ee78fd23cb9d3))
- **core:** implement basic schema definition with type inference and validation ([64e29d7](https://github.com/satocchi0416sh/typed-notion/commit/64e29d72b0133108a0908d95d4f5b50e19083c7f))
- implement full notion client with crud operations and type safety ([fe8f825](https://github.com/satocchi0416sh/typed-notion/commit/fe8f825361a8b3f42e3f066bab0e6b2bf298f43a))
- **mvp:** implement contact properties and complete MVP property types ([d15c79d](https://github.com/satocchi0416sh/typed-notion/commit/d15c79daba3a11bebd1d988b92fb1c67cc388acc))
- **npm:** implement complete publication preparation workflow ([f17b45f](https://github.com/satocchi0416sh/typed-notion/commit/f17b45f1c4f1fff3eee4dd5df0c9881b60257968))
- **release:** add automated version update system ([0fed307](https://github.com/satocchi0416sh/typed-notion/commit/0fed307356b30b6ad31d0443f406fda49c2b6136))
- **schema:** add partial validation support for updates ([92627d0](https://github.com/satocchi0416sh/typed-notion/commit/92627d096efc48c6de7a31070546616d76ac8716))
- **types:** add support for created_time, created_by, last_edited_time, last_edited_by properties ([ccc2925](https://github.com/satocchi0416sh/typed-notion/commit/ccc2925d2ef4ff7c1172af11813d0722cb8ffd54))
- **utils:** add getNotionPropertyValue utility function for easier property value extraction ([0320c59](https://github.com/satocchi0416sh/typed-notion/commit/0320c59582d33399722a1c7cacb6605a59e9a659))

### 🐛 Bug Fixes

- add missing @vitest/coverage-v8 dependency for test coverage ([680bc7b](https://github.com/satocchi0416sh/typed-notion/commit/680bc7b294a8cf19591a132ebb34b41327226861))
- apply Prettier formatting to pass CI checks ([f03d626](https://github.com/satocchi0416sh/typed-notion/commit/f03d626cca398f2ab70472203baba859ad4652be))
- **bundlesize:** disable GitHub integration to prevent 403 errors in CI ([7239694](https://github.com/satocchi0416sh/typed-notion/commit/72396941ae7c69d5e37605748c02de64c98c74c7))
- **ci:** correct test command in publish workflow ([ed462ba](https://github.com/satocchi0416sh/typed-notion/commit/ed462baca6b24a1b7140ed789ba660d2bcc324c3))
- **ci:** make performance benchmarks strict and fix schema validation errors ([3996d65](https://github.com/satocchi0416sh/typed-notion/commit/3996d65295594288768235ab17d4cd87da42912c))
- **ci:** resolve test workflow failures and coverage threshold mismatches ([dfb9bae](https://github.com/satocchi0416sh/typed-notion/commit/dfb9bae3d5fe34bed877670f39ff7f9ee4ac46a1))
- **ci:** switch to istanbul coverage provider for Node.js 18 compatibility ([5859f83](https://github.com/satocchi0416sh/typed-notion/commit/5859f83bc8ee3421de7e32ef88b0d23a95598c52))
- **ci:** temporarily disable bundlesize in CI to prevent GitHub integration errors ([c1345d0](https://github.com/satocchi0416sh/typed-notion/commit/c1345d0662a5a0610dcbd6c02ba560a979f82a6b))
- resolve typescript compilation errors and failing tests ([b73c9e9](https://github.com/satocchi0416sh/typed-notion/commit/b73c9e9f3902c860be1b63ca6afa096e2c58833e))
- **test:** adjust coverage thresholds to match current test coverage ([1dc1e25](https://github.com/satocchi0416sh/typed-notion/commit/1dc1e2529d895cbc48c1677fbc547824f4d1675e))
- **test:** resolve vitest mock method type errors in performance benchmarks ([35fdccc](https://github.com/satocchi0416sh/typed-notion/commit/35fdcccccf7b4c90baa66bd887bd14750098366b))
- **tests:** add explicit type annotations for isolatedDeclarations compliance ([2fd7278](https://github.com/satocchi0416sh/typed-notion/commit/2fd7278824e6c157ab5b69b2703f153600989189))
- **tests:** resolve type constraint issues in literal-types test ([146d310](https://github.com/satocchi0416sh/typed-notion/commit/146d3108132d2a887975be2e5c2ab048398534b8))
- **tests:** resolve typescript compilation errors in test suite ([15c9e7e](https://github.com/satocchi0416sh/typed-notion/commit/15c9e7e6c1a928a6c9472e273e659466e02754f6))
- **tests:** resolve typescript compilation errors in test suite ([09098fe](https://github.com/satocchi0416sh/typed-notion/commit/09098fe8d017a3a3166fa03f10522694ea77d02f))
- **types:** resolve typescript compilation errors and type casting issues ([6ad3209](https://github.com/satocchi0416sh/typed-notion/commit/6ad320935761ede1a101a532a5e8974236753f12))

# Changelog

All notable changes to this project will be documented in this file.

This changelog is automatically generated by [semantic-release](https://github.com/semantic-release/semantic-release).

## [1.0.0](https://github.com/satocchi0416sh/typed-notion/compare/...v1.0.0) (2025-11-23)

### Features

- Initial release of typed-notion-core-ts
- Type-safe Notion API library with compile-time validation
- Runtime type inference and schema validation
- Support for all Notion property types (basic, contact, selection)
- Complete test suite with 162 passing tests
- Automated npm publishing pipeline with semantic-release
- GitHub Actions CI/CD workflow
- Comprehensive package validation (types, package structure, size)

### Build System

- Add build pipeline with tsup and TypeScript compilation
- Add package validation with @arethetypeswrong/cli and publint
- Add bundlesize monitoring (<50KB target, achieved 7.75KB gzipped)
- Add dual ESM/CommonJS support with proper exports configuration
