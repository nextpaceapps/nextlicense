# API Contracts: Firebase Token Authentication

**Feature**: 003-firebase-auth  
**Date**: 2025-12-12

## Overview

This document defines the authentication contracts for protected API endpoints. All protected endpoints follow the same authentication pattern.

## Authentication Header

### Request Header

**Header Name**: `Authorization`  
**Format**: `Bearer <firebase-id-token>`

**Example**:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9...
```

**Requirements**:
- Must be present for all protected endpoints
- Must start with "Bearer " (case-sensitive)
- Token must be a valid Firebase ID token
- Exception: Dev login bypass (development only, see below)

---

## Protected Endpoints

All endpoints under these prefixes require authentication:
- `/api/products/*`
- `/api/plans/*`
- `/api/licenses/*`
- `/api/logs/*`

### Authentication Flow

1. Client includes `Authorization: Bearer <token>` header
2. API middleware extracts token from header
3. API validates token using Firebase Admin SDK
4. On success: Request proceeds with `request.user` set to decoded token
5. On failure: API returns 401 Unauthorized

---

## Response Contracts

### Success Response

**Status Code**: 200, 201, 204 (depending on endpoint)

**Headers**: Standard response headers

**Body**: Endpoint-specific response (unchanged by authentication)

**Example**:
```json
{
  "id": "product-123",
  "name": "My Product",
  ...
}
```

---

### Authentication Failure Response

**Status Code**: `401 Unauthorized`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "error": "Authentication failed"
}
```

**Error Message**: Always generic "Authentication failed" (per FR-004)

**Failure Scenarios** (all return same response):
- Missing `Authorization` header
- Malformed `Authorization` header (not "Bearer <token>")
- Invalid token format
- Expired token
- Invalid token (not from correct Firebase project)
- Token revoked
- Network error during token verification
- Firebase Admin SDK initialization failure

---

## Dev Login Bypass (Development Only)

### Request Header

**Header Name**: `X-Dev-Login`  
**Value**: `true`

**Requirements**:
- Only works when `DEV_LOGIN_BYPASS=true` environment variable is set
- Only works in non-production environments
- Must be combined with dev login user state in web application

**Example**:
```
X-Dev-Login: true
```

**Behavior**:
- When present and environment allows: Authentication middleware bypasses token validation
- Request proceeds as if authenticated
- `request.user` may be set to a mock dev user or remain undefined

**Production**: This header is ignored in production; authentication is always required.

---

## Token Refresh Flow (Web Application)

### Automatic Token Refresh

When an API request fails with 401:

1. Web application checks if user is still logged in via Firebase Auth
2. If logged in:
   - Call `auth.currentUser.getIdToken(true)` to force refresh
   - Retry original request with new token
   - If refresh succeeds: Request proceeds normally
   - If refresh fails: Redirect to login page
3. If not logged in:
   - Display authentication required message
   - Provide login option

### Token Retrieval

**Method**: `auth.currentUser.getIdToken(forceRefresh?: boolean)`

**Usage**:
```typescript
const token = await auth.currentUser.getIdToken();
// Include in Authorization header
headers['Authorization'] = `Bearer ${token}`;
```

**Refresh on Expiration**:
```typescript
// Force refresh when 401 detected
const token = await auth.currentUser.getIdToken(true);
```

---

## Public Endpoints (No Authentication)

These endpoints do NOT require authentication:
- `/health` - Health check
- `/api/validate` - License validation
- `/api/consume` - Usage consumption

These endpoints remain unchanged and accessible without tokens.

---

## Error Logging

**Server-Side Logging** (per FR-010):
- All authentication failures are logged with:
  - Request path
  - Error type (missing header, invalid token, expired, etc.)
  - Timestamp
  - User agent (if available)

**Client-Side Logging**:
- Network errors during token refresh
- Authentication state changes

---

## Security Considerations

1. **Generic Error Messages**: All authentication failures return the same generic message to prevent information leakage
2. **Token Validation**: All tokens are validated server-side using Firebase Admin SDK
3. **HTTPS Required**: Tokens should only be transmitted over HTTPS in production
4. **Token Expiration**: Tokens expire after 1 hour (Firebase default)
5. **Dev Login**: Only available in development environments

---

## Testing Contracts

### Test Cases

1. **Valid Token**: Request with valid token → 200/201/204
2. **Missing Header**: Request without Authorization header → 401
3. **Invalid Format**: Request with malformed header → 401
4. **Expired Token**: Request with expired token → 401 (web app refreshes)
5. **Invalid Token**: Request with invalid token → 401
6. **Dev Login**: Request with dev login header in dev environment → 200 (bypass)
7. **Dev Login in Prod**: Request with dev login header in production → 401

### Mock Tokens

For testing, use Firebase test tokens or mock the Firebase Admin SDK verification.

