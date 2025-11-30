# Semantic-Release Troubleshooting Guide

## Common Issues and Solutions

### Issue: Workflow Hanging During Commit Analysis

**Symptoms:**

- GitHub Actions workflow runs for 15+ minutes without completing
- Last log entry shows "Retrieving commits since last release"
- No progress indicators after initial plugin loading

**Root Cause:** Large commit history (55+ commits) causing performance issues in semantic-release commit analysis.

**Solution Applied:**

1. **15-minute timeout** prevents infinite hanging
2. **Branch scanning optimization** limits analysis to `main` branch only
3. **Performance environment variables** (CI=true, DEBUG=false)
4. **Optimized commit parser** with efficient header pattern matching

### Issue: Module Import Errors

**Symptoms:**

- Error: "Cannot find module 'conventional-changelog-conventionalcommits'"
- Semantic-release fails during plugin loading

**Solution:**
Ensure `conventional-changelog-conventionalcommits` is installed:

```bash
npm install --save-dev conventional-changelog-conventionalcommits
```

### Issue: Release Configuration Validation Errors

**Symptoms:**

- Invalid configuration warnings in dry-run mode
- Unexpected behavior during release process

**Solution:**
Validate configuration against schema:

```bash
# Test configuration
npm run release:dry

# Debug mode for detailed logging
npm run release:debug
```

## Fallback Strategies

### Strategy 1: Manual Initial Tag (If Hanging Persists)

If optimization doesn't resolve hanging during initial release:

```bash
# Create manual initial tag to limit commit scope
git tag v1.0.0
git push origin v1.0.0

# Future releases will only analyze commits since this tag
npm run release
```

### Strategy 2: Temporary Debug Mode

For troubleshooting configuration issues:

1. Enable debug mode temporarily in `.releaserc.cjs`:

```javascript
module.exports = {
  debug: true, // Temporarily enable
  // ... rest of config
};
```

2. Run release to see detailed logging:

```bash
npm run release:debug
```

3. **Important:** Disable debug mode after troubleshooting:

```javascript
module.exports = {
  debug: false, // Restore performance optimization
  // ... rest of config
};
```

### Strategy 3: Rollback Procedure

If configuration changes cause issues:

1. **Restore from backup:**

```bash
cp backups/pre-semantic-release-fix/.releaserc.cjs .
cp backups/pre-semantic-release-fix/workflows/* .github/workflows/
cp backups/pre-semantic-release-fix/package.json .
```

2. **Revert commits:**

```bash
git revert HEAD~3..HEAD  # Adjust range as needed
```

3. **Test restored configuration:**

```bash
npm run release:dry
```

## Performance Monitoring

### Expected Performance Metrics

- **Commit Analysis**: < 5 minutes
- **Full Workflow**: < 10 minutes
- **Plugin Loading**: < 30 seconds
- **Publishing**: < 2 minutes

### Monitoring Commands

```bash
# Time the dry-run process
time npm run release:dry

# Monitor workflow execution in GitHub Actions
# Expected: No hanging, completion within timeout
```

### Warning Signs

- Workflow exceeding 10 minutes
- Log stuck on "Retrieving commits" for >2 minutes
- Memory usage spikes in CI environment
- Timeout warnings in GitHub Actions

## Configuration Validation Checklist

- [ ] `.releaserc.cjs` contains `ci: true` and `debug: false`
- [ ] GitHub Actions workflow has `timeout-minutes: 15`
- [ ] Branch scanning limited to `['main']` only
- [ ] Environment variables include `CI=true, DEBUG=false`
- [ ] Git committer information properly configured
- [ ] Conditional execution prevents infinite loops
- [ ] All semantic-release plugins properly installed

## Emergency Contacts

For critical release failures:

1. Check GitHub Actions logs for specific error messages
2. Run `npm run release:debug` locally for detailed diagnostics
3. Validate configuration with `npm run release:dry`
4. Use manual tagging fallback if automated process fails
5. Refer to semantic-release documentation for plugin-specific issues

## Version History

- **v1.0**: Initial troubleshooting guide with hanging fix solutions
- **Created**: 2025-11-30 during semantic-release optimization implementation
