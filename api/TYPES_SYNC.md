# Type Synchronization Guide

## Overview

The `types.ts` file is duplicated in both `license-api` and `license-ui` repositories to maintain type consistency between frontend and backend.

## Synchronization Process

### When to Synchronize

Types must be synchronized when:
- Adding new types (Product, Plan, License, etc.)
- Modifying existing type definitions
- Adding or removing fields from types
- Changing enum values

### How to Synchronize

1. **Make changes in one repository** (usually start with `license-api` since backend defines the data model)
2. **Copy the updated `types.ts`** to the other repository
3. **Verify both repositories build successfully** after synchronization
4. **Test that API contracts match** between frontend and backend

### Manual Process

```bash
# From license-api (after making changes)
cp c:/git/license-api/types.ts c:/git/license-ui/types.ts

# Or from license-ui (after making changes)
cp c:/git/license-ui/types.ts c:/git/license-api/types.ts
```

### Verification

After synchronization:
1. Run `npm run build` in both repositories
2. Verify no TypeScript errors
3. Test API calls to ensure types match

## Future Improvements

Consider implementing:
- Automated sync script
- Pre-commit hook to warn about type drift
- Shared npm package for types (if repositories become more complex)

