# Quick Start: Fix Delete Product API Request

**Date**: 2025-01-25  
**Feature**: Fix DELETE request Content-Type header issue

## Implementation Overview

Fix the `fetchApi` function in `services/api.ts` to conditionally include the `Content-Type: application/json` header only when a request body is present.

## Step-by-Step Implementation

### 1. Locate the File

Open `services/api.ts` in your editor.

### 2. Modify the `fetchApi` Function

Find the `fetchApi` function (lines 13-56) and locate the headers construction (lines 32-36).

**Current Code**:
```typescript
headers: {
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  ...options?.headers,
},
```

**Fixed Code**:
```typescript
const headers: Record<string, string> = {
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  ...options?.headers,
};

if (options?.body) {
  headers['Content-Type'] = 'application/json';
}
```

Then update the fetch call to use the `headers` variable:
```typescript
const response = await fetch(url, {
  ...options,
  headers,
});
```

### 3. Verify the Change

The complete modified section should look like:

```typescript
const headers: Record<string, string> = {
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  ...options?.headers,
};

if (options?.body) {
  headers['Content-Type'] = 'application/json';
}

try {
  const response = await fetch(url, {
    ...options,
    headers,
  });
  // ... rest of the function
}
```

### 4. Test the Fix

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test Product Deletion**:
   - Navigate to the Products page
   - Click delete on a product
   - Confirm deletion
   - Verify: Product is removed without errors
   - Check browser DevTools Network tab: DELETE request should succeed (200/204) without 400 error

3. **Test Plan Deletion**:
   - Navigate to the Plans page
   - Click delete on a plan
   - Confirm deletion
   - Verify: Plan is removed without errors
   - Check browser DevTools Network tab: DELETE request should succeed (200/204) without 400 error

4. **Verify Other Operations Still Work**:
   - Test creating a product (POST with body should still include Content-Type)
   - Test creating a plan (POST with body should still include Content-Type)
   - Test GET operations (should work as before)

### 5. Verify Network Requests

In browser DevTools → Network tab, verify:

**DELETE requests** (products, plans):
- ✅ Should NOT include `Content-Type: application/json` header
- ✅ Should include `Authorization: Bearer {token}` header
- ✅ Should return 200 or 204 status

**POST requests** (create product, create plan):
- ✅ Should include `Content-Type: application/json` header
- ✅ Should include `Authorization: Bearer {token}` header
- ✅ Should include request body
- ✅ Should return 200 or 201 status

## Expected Behavior After Fix

- ✅ DELETE requests for products succeed without 400 errors
- ✅ DELETE requests for plans succeed without 400 errors
- ✅ All existing POST/PUT requests continue to work (still include Content-Type)
- ✅ All GET requests continue to work (unchanged)
- ✅ Error handling remains functional
- ✅ User feedback (success/error messages) works as before

## Rollback Plan

If issues occur, revert the change in `services/api.ts` to the original header construction. The bug will return, but the application will function as it did before this fix.

