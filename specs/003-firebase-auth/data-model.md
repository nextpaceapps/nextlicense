# Data Model: Firebase Token Authentication

**Feature**: 003-firebase-auth  
**Date**: 2025-12-12

## Overview

This feature does not introduce new persistent data entities. Authentication state is managed by Firebase Authentication service. The data model focuses on transient authentication tokens and request context.

## Entities

### Authentication Token (Transient)

**Description**: Firebase ID token used to authenticate API requests. Not persisted; generated and validated per request.

**Attributes**:
- `token` (string): The Firebase ID token string
- `decodedToken` (object): Decoded token containing:
  - `uid` (string): Firebase user ID
  - `email` (string, optional): User email
  - `exp` (number): Token expiration timestamp
  - `iat` (number): Token issued at timestamp
  - Additional Firebase claims

**Lifecycle**:
- Generated: When user authenticates with Firebase
- Transmitted: Included in `Authorization: Bearer <token>` header
- Validated: Verified by API using Firebase Admin SDK
- Expired: Automatically refreshed by Firebase SDK or user re-authenticates

**Validation Rules**:
- Must be valid Firebase ID token format
- Must not be expired (checked by Firebase Admin SDK)
- Must be from the same Firebase project as API

---

### Authenticated Request (Transient)

**Description**: API request context that includes authentication information.

**Attributes**:
- `authorizationHeader` (string, optional): `Authorization: Bearer <token>` header value
- `token` (string, optional): Extracted token from header
- `user` (object, optional): Decoded token user information (set after validation)
- `isDevLogin` (boolean): Flag indicating dev login bypass (development only)

**State Transitions**:
1. Request received → Extract authorization header
2. Header present → Extract token
3. Token extracted → Validate with Firebase Admin SDK
4. Validation success → Set user context, proceed
5. Validation failure → Return 401, log error

---

### User Session (Web Application State)

**Description**: Client-side representation of authenticated user state.

**Attributes**:
- `user` (UserProfile | null): User profile information
  - `email` (string): User email
  - `name` (string): User display name
  - `picture` (string, optional): User profile picture URL
  - `role` (string): User role (ADMIN/VIEWER)
- `isLoading` (boolean): Loading state during authentication check
- `isDevLogin` (boolean): Flag indicating dev login mode (development only)

**State Transitions**:
1. Initial → `isLoading: true`, `user: null`
2. Firebase auth check → `isLoading: false`, `user: <firebase user>` or `user: null`
3. Dev login → `isDevLogin: true`, `user: <dev user>`
4. Logout → `user: null`, `isDevLogin: false`

---

## Relationships

- **Authentication Token** → **Authenticated Request**: Token is included in request header
- **User Session** → **Authentication Token**: Session provides token via `getIdToken()`
- **Authenticated Request** → **User Session**: Request uses token from active session

## No Persistent Storage

This feature does not require database changes. All authentication state is:
- Managed by Firebase Authentication service (user accounts, tokens)
- Stored in memory (API request context, web application session state)
- Transmitted via HTTP headers (tokens in Authorization header)

## Validation Rules

### Token Validation (API)
- Token must be present in `Authorization` header with `Bearer ` prefix
- Token must be valid Firebase ID token format
- Token must not be expired (checked by Firebase Admin SDK)
- Token must be from same Firebase project

### Dev Login Bypass (Development Only)
- `DEV_LOGIN_BYPASS` environment variable must be set to `true`
- Request must include `X-Dev-Login: true` header
- Only applies in non-production environments

## Edge Cases Handled

- Missing authorization header → 401
- Malformed authorization header → 401
- Expired token → 401 (web app refreshes and retries)
- Invalid token → 401
- Network error during verification → 401
- Firebase Admin SDK initialization failure → 401
- Dev login in production → Authentication required (bypass disabled)

