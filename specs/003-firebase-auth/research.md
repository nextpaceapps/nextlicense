# Research: Firebase Token Authentication

**Feature**: 003-firebase-auth  
**Date**: 2025-12-12

## Research Tasks

### 1. Firebase Admin SDK Token Verification

**Task**: Research Firebase Admin SDK token verification best practices and error handling patterns

**Findings**:
- Firebase Admin SDK `verifyIdToken()` throws exceptions for invalid/expired tokens
- Common error codes: `auth/argument-error`, `auth/id-token-expired`, `auth/id-token-revoked`
- Network errors during verification should be caught and handled consistently
- Token verification is synchronous with Firebase servers (no local caching of validation)

**Decision**: Use `getAuth().verifyIdToken(token)` with try-catch for all error scenarios. Return generic "Authentication failed" message for all failures per FR-004.

**Rationale**: Generic messages prevent information leakage about token state, improving security posture.

**Alternatives Considered**:
- Detailed error messages: Rejected for security reasons (spec clarification)
- Local token caching: Not applicable - Firebase requires server-side verification

---

### 2. Token Refresh Patterns in React/Firebase

**Task**: Research reactive token refresh patterns when tokens expire during API requests

**Findings**:
- Firebase Auth SDK provides `getIdToken(forceRefresh: boolean)` method
- Tokens can be refreshed automatically when expired
- Best practice: Catch 401 errors, refresh token, retry request
- Firebase handles token refresh internally when `getIdToken()` is called on expired token

**Decision**: Implement reactive refresh pattern:
1. API request fails with 401
2. Check if user is still logged in via Firebase Auth
3. Call `getIdToken(true)` to force refresh
4. Retry original request with new token
5. If refresh fails, redirect to login

**Rationale**: Reactive refresh (on expiration) was specified in clarifications. Firebase SDK handles the actual refresh mechanism automatically.

**Alternatives Considered**:
- Proactive refresh (before expiration): Rejected per spec clarification (Option A chosen)
- Manual token management: Rejected - Firebase SDK handles this better

---

### 3. Dev Login Bypass Implementation

**Task**: Research patterns for bypassing authentication in development while maintaining production security

**Findings**:
- Common patterns: Environment variable flag, special header, or user agent detection
- Must be clearly development-only (not accessible in production)
- Should be easy to disable/enable for testing

**Decision**: Use environment variable `DEV_LOGIN_BYPASS=true` in API and check for special header `X-Dev-Login: true` from web app when dev user is active. Only enabled in non-production environments.

**Rationale**: 
- Environment variable ensures it's disabled in production
- Header-based approach allows web app to signal dev mode
- Easy to test and verify

**Alternatives Considered**:
- IP-based bypass: Rejected - too complex, doesn't work with containers
- Separate dev endpoint: Rejected - adds unnecessary complexity
- No bypass (require Firebase in dev): Rejected - spec clarification requires bypass

---

### 4. Error Handling and User Feedback Patterns

**Task**: Research best practices for authentication error handling and user feedback

**Findings**:
- Generic error messages improve security but require clear user guidance
- 401 errors should trigger re-authentication flow
- Token refresh failures should redirect to login
- Network errors during auth should be handled gracefully

**Decision**: 
- API: Return generic "Authentication failed" for all auth errors (FR-004)
- Web: Detect 401, attempt token refresh, show user-friendly message if refresh fails
- Log detailed errors server-side for monitoring (FR-010)

**Rationale**: Balances security (generic messages) with user experience (clear feedback and automatic recovery).

**Alternatives Considered**:
- Detailed error messages: Rejected per spec clarification
- Silent retry without user feedback: Rejected - poor UX

---

### 5. Firebase Admin SDK Initialization Failure Handling

**Task**: Research handling of Firebase Admin SDK initialization failures

**Findings**:
- Initialization typically fails due to missing credentials or network issues
- Should fail fast on startup if credentials are missing
- Runtime initialization failures are rare but possible

**Decision**: Treat initialization failures as authentication failures (401) per spec clarification. Log detailed error for monitoring.

**Rationale**: Consistent error response (401) simplifies client-side handling. Detailed logging helps with debugging.

**Alternatives Considered**:
- 503 Service Unavailable: Rejected per spec clarification (Option A chosen)
- 500 Internal Server Error: Rejected per spec clarification

---

## Summary of Decisions

1. **Token Verification**: Use Firebase Admin SDK `verifyIdToken()` with generic error messages
2. **Token Refresh**: Reactive refresh on 401 errors using Firebase SDK's automatic refresh
3. **Dev Login Bypass**: Environment variable + header-based approach for development only
4. **Error Handling**: Generic messages to clients, detailed logging server-side
5. **Initialization Failures**: Treat as 401 authentication failures

## No Outstanding Clarifications

All technical decisions have been made based on:
- Spec requirements and clarifications
- Firebase best practices
- Security considerations
- User experience requirements

