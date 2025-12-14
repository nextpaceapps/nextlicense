# Quickstart: Firebase Token Authentication

**Feature**: 003-firebase-auth  
**Date**: 2025-12-12

## Overview

This guide provides a quick reference for implementing Firebase token authentication in the API and web application.

## API Implementation

### 1. Update Authentication Middleware

**File**: `api/middleware/auth.ts`

**Changes**:
- Update error messages to be generic ("Authentication failed")
- Add dev login bypass logic
- Ensure all errors return 401 (including initialization failures)

**Key Code**:
```typescript
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  // Dev login bypass (development only)
  if (process.env.DEV_LOGIN_BYPASS === 'true' && 
      request.headers['x-dev-login'] === 'true') {
    // Allow request to proceed without token validation
    return;
  }

  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Authentication failed' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    request.user = decodedToken;
  } catch (error) {
    // Generic error message for all failures
    logger.error({ error }, 'Authentication failed');
    return reply.code(401).send({ error: 'Authentication failed' });
  }
};
```

### 2. Verify Protected Routes

**File**: `api/index.ts`

**Status**: Already configured correctly. Protected routes use `authenticate` middleware via `preHandler` hook.

**No changes needed** - routes are already protected.

---

## Web Application Implementation

### 1. Update API Client

**File**: `web/services/api.ts`

**Changes**:
- Add token refresh on 401 errors
- Improve error handling for authentication failures
- Add dev login header when dev user is active

**Key Code**:
```typescript
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from Firebase Auth
  let token: string | undefined;
  const isDevLogin = /* check if dev login is active */;
  
  if (auth?.currentUser && !isDevLogin) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
    }
  }
  
  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(isDevLogin ? { 'X-Dev-Login': 'true' } : {}),
    ...options?.headers,
  };

  // ... existing fetch logic ...

  // Handle 401 with token refresh
  if (response.status === 401 && auth?.currentUser) {
    try {
      // Force token refresh
      const newToken = await auth.currentUser.getIdToken(true);
      // Retry request with new token
      return fetchApi<T>(endpoint, {
        ...options,
        headers: {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    } catch (refreshError) {
      // Refresh failed - redirect to login
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
  }
}
```

### 2. Update Auth Context

**File**: `web/contexts/AuthContext.tsx`

**Changes**:
- Add dev login detection mechanism
- Ensure dev login state is accessible to API client

**Key Code**:
```typescript
// Add dev login state tracking
const [isDevLogin, setIsDevLogin] = useState(false);

const loginDev = () => {
  setIsDevLogin(true);
  setUser({
    email: 'dev@local.host',
    name: 'Dev Admin',
    role: 'ADMIN',
    picture: 'https://ui-avatars.com/api/?name=Dev+Admin&background=random'
  });
};

// Export isDevLogin for API client use
return (
  <AuthContext.Provider value={{ user, isLoading, loginDev, logout, isDevLogin }}>
    {children}
  </AuthContext.Provider>
);
```

---

## Environment Configuration

### API Environment Variables

**File**: `.env.local` (development)

```bash
# Enable dev login bypass (development only)
DEV_LOGIN_BYPASS=true

# Firebase Admin SDK credentials
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

**Production**: `DEV_LOGIN_BYPASS` should not be set (or set to `false`)

### Web Environment Variables

**File**: `.env.local` (development)

```bash
# Firebase configuration (already configured)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

---

## Testing Checklist

### API Testing

- [ ] Valid token → Request succeeds
- [ ] Missing Authorization header → 401
- [ ] Invalid token format → 401
- [ ] Expired token → 401
- [ ] Invalid token → 401
- [ ] Dev login bypass in dev → Request succeeds
- [ ] Dev login bypass in prod → 401

### Web Application Testing

- [ ] Logged in user → Token included in requests
- [ ] Not logged in → No token, requests fail with 401
- [ ] Token expires → Automatic refresh and retry
- [ ] Refresh fails → Redirect to login
- [ ] Dev login → Dev header sent, requests succeed
- [ ] Logout → No token sent

---

## Common Issues

### Issue: Token refresh not working

**Solution**: Ensure `getIdToken(true)` is called with `forceRefresh: true` parameter.

### Issue: Dev login not bypassing authentication

**Check**:
1. `DEV_LOGIN_BYPASS=true` environment variable is set
2. `X-Dev-Login: true` header is being sent
3. Not in production environment

### Issue: Generic error messages make debugging difficult

**Solution**: Check server logs for detailed error information. Generic messages are intentional for security.

---

## Next Steps

1. Implement API middleware changes
2. Implement web API client changes
3. Update AuthContext for dev login detection
4. Test all scenarios
5. Deploy to staging for validation
6. Deploy to production

