# Feature Specification: Firebase Token Authentication

**Feature Branch**: `003-firebase-auth`  
**Created**: 2025-12-12  
**Status**: Draft  
**Input**: User description: "as a developer I would like to add firebase authentication (token) to API and adapt web to this."

## Clarifications

### Session 2025-12-12

- Q: How should dev login handle API authentication? → A: Dev login bypasses API authentication entirely (API accepts requests without tokens from dev users)
- Q: When should the web application proactively refresh tokens? → A: Refresh only when token has already expired (reactive)
- Q: How much detail should authentication error messages include? → A: Generic messages only (e.g., "Authentication failed" for all cases)
- Q: How should the API respond when Firebase Admin SDK fails to initialize? → A: Return 401 Unauthorized (treat as authentication failure)
- Q: How should the API respond to network errors during token verification? → A: Return 401 Unauthorized (treat as authentication failure)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated API Access (Priority: P1)

A developer using the web application needs to access protected API endpoints. When they are logged in with Firebase authentication, their authentication token should be automatically included in API requests, allowing them to access protected resources without manual intervention.

**Why this priority**: This is the core functionality - without proper token transmission, users cannot access any protected API endpoints, making the application non-functional for authenticated operations.

**Independent Test**: Can be fully tested by logging in via the web application, then making any API request to a protected endpoint (e.g., fetching products). The request should succeed with the token automatically included, and fail if the token is missing or invalid.

**Acceptance Scenarios**:

1. **Given** a user is logged in to the web application with Firebase authentication, **When** they make an API request to a protected endpoint, **Then** the request includes a valid Firebase ID token in the Authorization header and the API responds successfully
2. **Given** a user is not logged in to the web application, **When** they make an API request to a protected endpoint, **Then** the request fails with a 401 Unauthorized error
3. **Given** a user's authentication token has expired, **When** they make an API request to a protected endpoint, **Then** the system automatically refreshes the token and retries the request, or prompts the user to re-authenticate

---

### User Story 2 - API Token Validation (Priority: P1)

The API server needs to validate Firebase authentication tokens on all protected endpoints to ensure only authenticated users can access sensitive operations like creating products, plans, and licenses.

**Why this priority**: Security is critical - without proper token validation, unauthorized users could access or modify sensitive data. This must work correctly from the start.

**Independent Test**: Can be fully tested by sending API requests to protected endpoints with valid tokens, invalid tokens, expired tokens, and no tokens. Only valid tokens should succeed.

**Acceptance Scenarios**:

1. **Given** an API request includes a valid Firebase ID token in the Authorization header, **When** the request reaches a protected endpoint, **Then** the token is verified and the request is processed successfully
2. **Given** an API request includes an invalid or expired Firebase ID token, **When** the request reaches a protected endpoint, **Then** the API responds with a 401 Unauthorized error with a generic authentication failure message
3. **Given** an API request does not include an Authorization header, **When** the request reaches a protected endpoint, **Then** the API responds with a 401 Unauthorized error with a generic authentication failure message
4. **Given** an API request includes a malformed Authorization header (not "Bearer <token>"), **When** the request reaches a protected endpoint, **Then** the API responds with a 401 Unauthorized error with a generic authentication failure message

---

### User Story 3 - Web Application Token Management (Priority: P2)

The web application needs to handle authentication tokens seamlessly, including automatic token refresh, error handling for authentication failures, and proper user feedback when authentication is required.

**Why this priority**: While core authentication works, proper token management improves user experience by handling edge cases like token expiration gracefully and providing clear feedback.

**Independent Test**: Can be fully tested by monitoring token behavior during normal usage, simulating token expiration, and verifying that the application handles authentication errors gracefully with appropriate user feedback.

**Acceptance Scenarios**:

1. **Given** a user is actively using the web application, **When** their Firebase token expires during an API request, **Then** the application automatically refreshes the token and retries the request without interrupting the user's workflow
2. **Given** an API request fails due to authentication error (401), **When** the user is still logged in, **Then** the application attempts to refresh the token and retry the request, or redirects to login if refresh fails
3. **Given** an API request fails due to authentication error, **When** the user is not logged in, **Then** the application displays a clear message indicating authentication is required and provides a way to log in
4. **Given** a user logs out, **When** they attempt to make API requests, **Then** no authentication token is sent and requests to protected endpoints fail appropriately

---

### Edge Cases

- What happens when the Firebase Admin SDK is not properly initialized on the API server? → API responds with 401 Unauthorized (treated as authentication failure)
- How does the system handle network errors during token verification? → API responds with 401 Unauthorized (treated as authentication failure)
- What happens if a user's Firebase account is disabled or deleted while they have an active session?
- How does the system handle concurrent requests with the same token?
- What happens when the web application loses connection to Firebase Auth service?
- How does the system handle malformed tokens or tokens from a different Firebase project?
- What happens when a token is valid but the user has been removed from the system's user database?
- How does the system distinguish dev login requests from production authentication requests?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: API MUST require a valid Firebase ID token in the Authorization header for all protected endpoints
- **FR-002**: API MUST verify Firebase ID tokens using Firebase Admin SDK before processing protected requests
- **FR-003**: API MUST respond with 401 Unauthorized when authentication token is missing, invalid, expired, when Firebase Admin SDK initialization fails, or when network errors occur during token verification
- **FR-004**: API MUST include generic error messages in authentication failure responses (e.g., "Authentication failed" without distinguishing between missing, invalid, or expired tokens)
- **FR-005**: Web application MUST automatically include Firebase ID tokens in Authorization headers for all API requests to protected endpoints
- **FR-006**: Web application MUST retrieve Firebase ID tokens from the authenticated user's session
- **FR-007**: Web application MUST handle authentication errors gracefully and provide appropriate user feedback
- **FR-008**: Web application MUST automatically refresh expired tokens when detected (reactive refresh on expiration)
- **FR-009**: Web application MUST redirect to login or prompt for re-authentication when token refresh fails
- **FR-010**: System MUST log authentication failures for security monitoring
- **FR-011**: Public API endpoints (validation, consumption) MUST remain accessible without authentication
- **FR-012**: Protected API endpoints (products, plans, licenses, logs) MUST require authentication
- **FR-013**: Dev login mode MUST bypass API authentication (API accepts requests without tokens when dev login is active)

### Key Entities *(include if feature involves data)*

- **Authentication Token**: A Firebase ID token that proves a user's identity, contains user information (UID, email, etc.), and has an expiration time
- **Authenticated Request**: An API request that includes a valid Firebase ID token in the Authorization header
- **User Session**: The web application's representation of a logged-in user, including their Firebase authentication state

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of protected API endpoints successfully validate Firebase tokens before processing requests
- **SC-002**: All authenticated API requests from the web application include valid Firebase ID tokens in the Authorization header
- **SC-003**: Authentication failures are detected and handled within 2 seconds of the API request
- **SC-004**: Users can successfully access protected endpoints after logging in without manual token management
- **SC-005**: Invalid or missing authentication tokens result in 401 responses within 1 second
- **SC-006**: Token refresh occurs automatically without user intervention when tokens expire during active API requests in 95% of cases
- **SC-007**: Authentication errors are clearly communicated to users with actionable feedback in 100% of cases

## Assumptions

- Firebase Admin SDK is properly configured on the API server with appropriate service account credentials
- Firebase Authentication is properly configured in the web application with correct API keys and project settings
- Users authenticate through Firebase Authentication (Google Sign-In or other supported providers)
- Public endpoints (validation, consumption) are intentionally accessible without authentication for license validation use cases
- Token expiration follows Firebase's standard expiration times (typically 1 hour)
- The web application has access to Firebase Auth SDK to retrieve and refresh tokens
- Dev login is a development-only feature that bypasses Firebase authentication for local testing

## Dependencies

- Firebase Admin SDK must be initialized and configured on the API server
- Firebase Authentication must be configured in the web application
- API and web application must share the same Firebase project for token validation to work
- Network connectivity between web application and Firebase Auth service for token operations
- Network connectivity between web application and API server for authenticated requests
