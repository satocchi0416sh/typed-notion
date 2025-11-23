# Quick Start: NPM Package Publication Automation Pipeline

## Overview

This guide provides a step-by-step walkthrough for implementing automated CI/CD pipeline for the TypedNotion TypeScript library. The automation builds upon the existing Phase 1 foundation (package configuration, build tools, validation) to provide hands-off publishing triggered by conventional commits.

## Prerequisites

✅ **Phase 1 Foundation Already Complete:**

- Package configuration (`package.json` with exports, validation scripts) ✅
- Build pipeline (`tsup.config.ts`, TypeScript compilation) ✅
- Validation tools (`@arethetypeswrong/cli`, `publint`, `bundlesize`) ✅
- Working tests (162 tests passing) ✅

**Additional Requirements:**

- GitHub repository with appropriate permissions
- npm account with 2FA enabled and publishing access
- Git repository configured with conventional commits workflow

## Phase 1: Semantic Release Configuration

### Step 1: Install Semantic Release Dependencies

Install semantic-release and required plugins:

```bash
# Core semantic-release tools
npm install -D semantic-release @semantic-release/commit-analyzer @semantic-release/release-notes-generator

# Publishing plugins
npm install -D @semantic-release/npm @semantic-release/github

# Optional: changelog generation
npm install -D @semantic-release/changelog
```

### Step 2: Configure Semantic Release

Create `.releaserc.json` in repository root:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    [
      "@semantic-release/github",
      {
        "assets": [
          { "path": "dist/**", "label": "Distribution files" },
          { "path": "CHANGELOG.md", "label": "Changelog" }
        ]
      }
    ]
  ]
}
```

### Step 3: Update Package Scripts

Add semantic-release scripts to `package.json`:

```json
{
  "scripts": {
    "release": "semantic-release",
    "release:dry": "semantic-release --dry-run",
    "release:debug": "semantic-release --debug"
  }
}
```

## Phase 2: GitHub Actions Workflow Setup

### Step 4: Create Workflow Directory

Create GitHub Actions workflow structure:

```bash
mkdir -p .github/workflows
```

### Step 5: Configure Automated Publishing Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build package
        run: npm run build

      - name: Validate package
        run: npm run validate

  release:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
          registry-url: https://registry.npmjs.org/

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: npm run build

      - name: Semantic Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Phase 3: Repository Configuration

### Step 6: Configure GitHub Secrets

Set up required secrets in GitHub repository settings:

1. **Navigate to repository**: Settings → Secrets and variables → Actions
2. **Add NPM_TOKEN**:
   - Generate token at https://www.npmjs.com/settings/tokens
   - Select "Automation" token type
   - Add as repository secret named `NPM_TOKEN`
3. **GITHUB_TOKEN**: Automatically available, no configuration needed

### Step 7: Configure Repository Permissions

Ensure proper repository settings:

1. **Settings → Actions → General**:
   - Workflow permissions: "Read and write permissions"
   - Allow GitHub Actions to create and approve pull requests: ✓

2. **Settings → Pages** (optional):
   - Configure if documentation site needed

### Step 8: Test Automation Pipeline

Test the automation with a dry run:

```bash
# Test semantic-release configuration locally
npm run release:dry

# Test conventional commit workflow
git add .
git commit -m "feat(automation): add CI/CD pipeline for automated publishing"
git push origin main
```

## Phase 4: Conventional Commit Workflow

### Step 9: Understand Commit Types and Version Bumping

**Version Bump Rules**:

- `feat: description` → Minor version bump (1.0.0 → 1.1.0)
- `fix: description` → Patch version bump (1.0.0 → 1.0.1)
- `feat: description\n\nBREAKING CHANGE: details` → Major version bump (1.0.0 → 2.0.0)
- `docs:`, `style:`, `refactor:`, `test:` → No version bump

**Commit Format**:

```bash
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Examples**:

```bash
# Feature addition (minor bump)
git commit -m "feat(validation): add schema validation for user input"

# Bug fix (patch bump)
git commit -m "fix(auth): resolve token expiration handling"

# Breaking change (major bump)
git commit -m "feat(api): redesign authentication flow

BREAKING CHANGE: The authentication API has been redesigned.
Users must update their integration code."

# Documentation (no bump)
git commit -m "docs(readme): update installation instructions"
```

## Phase 5: Monitoring and Troubleshooting

### Step 10: Monitor Release Pipeline

**GitHub Actions Monitoring**:

- Navigate to repository → Actions tab
- Monitor workflow runs for build/release status
- Check logs for detailed execution information

**NPM Registry Verification**:

```bash
# Check published package
npm view typed-notion-core-ts

# Verify latest version
npm view typed-notion-core-ts version
```

**GitHub Releases Verification**:

- Navigate to repository → Releases tab
- Verify releases are created automatically
- Check release notes generation

### Common Issues and Solutions

**Issue: semantic-release does not create release**

- **Cause**: No conventional commits since last release
- **Solution**: Ensure commits follow conventional format
- **Debug**: Run `npm run release:debug` locally

**Issue: npm publish permission denied**

- **Cause**: Invalid or expired NPM_TOKEN
- **Solution**: Regenerate npm token and update GitHub secret
- **Verification**: Check npm token permissions include publish access

**Issue: GitHub release creation fails**

- **Cause**: Insufficient repository permissions
- **Solution**: Verify GITHUB_TOKEN has contents:write permission
- **Check**: Repository Settings → Actions → General → Workflow permissions

**Issue: Build fails in CI but works locally**

- **Cause**: Environment differences or missing dependencies
- **Solution**: Check Node.js version consistency, verify package-lock.json
- **Debug**: Review GitHub Actions logs for specific error messages

## Validation Checklist

Before going live with automation, verify:

- [ ] `npm run release:dry` completes without errors
- [ ] GitHub Actions workflow syntax is valid (check Actions tab)
- [ ] NPM_TOKEN is properly configured with publish permissions
- [ ] Repository permissions allow workflow to write contents
- [ ] Conventional commits are being used consistently
- [ ] Build and test commands pass in CI environment
- [ ] Package validation (`npm run validate`) succeeds
- [ ] All Phase 1 infrastructure is working correctly

## Testing the Full Automation

### Manual Integration Test

1. **Create feature branch:**

   ```bash
   git checkout -b test-automation
   ```

2. **Make a small change and commit:**

   ```bash
   echo "# Automation Test" >> README.md
   git add README.md
   git commit -m "docs(readme): add automation test note"
   ```

3. **Push and create PR:**

   ```bash
   git push origin test-automation
   # Create PR via GitHub UI
   ```

4. **Verify PR validation:**
   - Check that GitHub Actions runs validation jobs
   - Verify build, test, and validation steps pass
   - Confirm no release job runs for PR

5. **Merge to main:**

   ```bash
   git checkout main
   git pull origin main
   ```

6. **Verify automated release:**
   - Check GitHub Actions for release job execution
   - Verify package version was not bumped (docs change)
   - Confirm no npm publish occurred

### Live Release Test

1. **Make a feature change:**

   ```bash
   git checkout -b add-feature-test
   echo "export const testFeature = true;" >> src/index.ts
   git add src/index.ts
   git commit -m "feat(core): add test feature flag for automation validation"
   ```

2. **Push and merge:**

   ```bash
   git push origin add-feature-test
   # Create and merge PR
   ```

3. **Verify automated release:**
   - [ ] GitHub Actions release job completes successfully
   - [ ] Package version increments (minor bump for `feat:`)
   - [ ] npm package publishes automatically
   - [ ] GitHub release created with changelog
   - [ ] CHANGELOG.md updated automatically

## Next Steps

After successful automation setup:

1. **Monitor package metrics** on npm registry
2. **Set up package health monitoring** for download/usage tracking
3. **Configure automated security updates** with Dependabot
4. **Establish contributor guidelines** for conventional commits
5. **Consider advanced features**:
   - Multi-environment releases (beta, alpha)
   - Automated documentation updates
   - Integration with package analysis tools

**Automation pipeline now fully operational!** 🚀

Future commits following conventional format will automatically:

- Build and validate code quality
- Determine appropriate version bump
- Publish to npm registry
- Create GitHub releases with changelogs
- Maintain version history and documentation
