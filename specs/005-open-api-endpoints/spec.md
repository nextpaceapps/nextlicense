# Feature Specification: Open API Endpoints with Rate Limiting

**Feature Branch**: `005-open-api-endpoints`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "make consume and validate endpoints open and without auth, but with request rate limit to provent load. these endpoints can be accessed from outside. as long as different projects are going to use it, it means that we don't need request user auth. If user got license he should be able to validate and consume it."

## Clarifications

### Session 2025-01-27

- Q: What client identifier method should be used for rate limiting? → A: Combination (IP address + License Key) - Protects endpoint from overload by preventing abuse through multiple license keys from the same IP, ensuring system protection rather than just per-license tracking.
- Q: What storage strategy should be used for rate limit state? → A: In-memory storage only - Keep it simple, rate limit state stored in server memory per-instance.
- Q: What rate limit algorithm should be used? → A: Fixed window - Count requests in fixed time intervals, simpler to implement with in-memory storage.
- Q: What should happen if rate limit configuration is missing or invalid? → A: Use safe defaults (100 req/min), log warning - Ensures protection remains active while alerting operators to configuration issues.
- Q: How should CORS preflight requests be handled for rate limiting? → A: Not applicable - Requests come from browser extensions which don't trigger CORS preflight requests.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Public License Validation (Priority: P1)

A developer with a valid license key needs to validate their license from their application without requiring user authentication. The system should allow public access to the validation endpoint while preventing abuse through rate limiting.

**Why this priority**: This is the core functionality - enabling external applications to validate licenses without authentication barriers. This is essential for the product to be usable by third-party developers.

**Independent Test**: Can be fully tested by making a POST request to `/api/validate` with a valid license key and device ID. The endpoint should return validation status without requiring authentication headers, and should respect rate limits when exceeded.

**Acceptance Scenarios**:

1. **Given** a developer has a valid license key, **When** they make a POST request to `/api/validate` without authentication headers, **Then** the system validates the license and returns the validation result
2. **Given** a developer makes multiple validation requests rapidly, **When** they exceed the rate limit threshold, **Then** the system returns a rate limit error (429) with appropriate retry information
3. **Given** a developer has an invalid or expired license key, **When** they make a validation request, **Then** the system returns validation failure without requiring authentication

---

### User Story 2 - Public Usage Consumption (Priority: P1)

A developer with a usage-based license needs to consume usage credits from their application without requiring user authentication. The system should allow public access to the consumption endpoint while preventing abuse through rate limiting.

**Why this priority**: This is equally critical as validation - enabling external applications to consume usage from licenses. Both endpoints are fundamental to the public API functionality.

**Independent Test**: Can be fully tested by making a POST request to `/api/consume` with a valid license key, product ID, and consumption amount. The endpoint should process the consumption without requiring authentication headers, and should respect rate limits when exceeded.

**Acceptance Scenarios**:

1. **Given** a developer has a valid usage-based license with available credits, **When** they make a POST request to `/api/consume` without authentication headers, **Then** the system consumes the specified amount and returns the remaining balance
2. **Given** a developer makes multiple consumption requests rapidly, **When** they exceed the rate limit threshold, **Then** the system returns a rate limit error (429) with appropriate retry information
3. **Given** a developer attempts to consume more credits than available, **When** they make a consumption request, **Then** the system returns an error indicating insufficient credits without requiring authentication

---

### User Story 3 - Rate Limit Protection (Priority: P2)

The system needs to protect public endpoints from abuse and excessive load by implementing rate limiting that prevents individual clients from overwhelming the service.

**Why this priority**: While not blocking core functionality, rate limiting is essential for system stability and preventing abuse. It ensures fair usage and protects the service from being overwhelmed.

**Independent Test**: Can be fully tested by making rapid successive requests to either public endpoint and verifying that rate limit errors are returned after exceeding the threshold, with appropriate retry-after information.

**Acceptance Scenarios**:

1. **Given** a client makes requests within the rate limit, **When** they access validation or consumption endpoints, **Then** requests are processed normally
2. **Given** a client exceeds the rate limit threshold, **When** they make additional requests, **Then** the system returns HTTP 429 (Too Many Requests) with retry-after information
3. **Given** a client receives a rate limit error, **When** they wait for the specified retry period, **Then** they can successfully make requests again
4. **Given** multiple different clients (identified by IP or other identifier), **When** they each make requests within their individual limits, **Then** rate limiting is applied per-client, not globally

---

### Edge Cases

- What happens when rate limiting is triggered during a valid license validation?
- How does the system handle rate limit bypass attempts? (IP rotation alone will not bypass since identifier includes license key; both IP and key must change)
- What happens if rate limit configuration is misconfigured or missing? (System uses safe default limits of 100 req/min and logs a warning)
- How does the system handle rate limit errors for clients that don't understand HTTP 429?
- What happens when a client exceeds rate limit but has a critical license validation need?
- How does rate limiting interact with CORS preflight requests? (Not applicable - requests come from browser extensions which don't trigger CORS preflight)
- What happens when rate limit storage/state is unavailable? (In-memory storage failure would indicate server failure; rate limiting would be unavailable until server restarts)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow access to `/api/validate` endpoint without requiring user authentication
- **FR-002**: System MUST allow access to `/api/consume` endpoint without requiring user authentication
- **FR-003**: System MUST implement rate limiting on `/api/validate` endpoint to prevent abuse
- **FR-004**: System MUST implement rate limiting on `/api/consume` endpoint to prevent abuse
- **FR-005**: System MUST return HTTP 429 (Too Many Requests) status code when rate limit is exceeded
- **FR-006**: System MUST include retry-after information in rate limit error responses
- **FR-007**: System MUST apply rate limiting per client identifier using the combination of IP address and license key to protect the endpoint from overload
- **FR-008**: System MUST allow license validation based solely on license key validity, not user authentication
- **FR-009**: System MUST allow usage consumption based solely on license key validity and available credits, not user authentication
- **FR-010**: System MUST maintain existing license validation logic (status checks, expiration, device limits)
- **FR-011**: System MUST maintain existing usage consumption logic (credit checks, atomic operations)
- **FR-012**: Rate limiting MUST be configurable (limits, time windows) without code changes
- **FR-015**: If rate limit configuration is missing or invalid, system MUST use safe default limits (100 requests per minute) and log a warning
- **FR-013**: System MUST log rate limit violations for monitoring and analysis
- **FR-014**: Rate limiting MUST not interfere with legitimate requests that are within limits

### Key Entities *(include if feature involves data)*

- **Rate Limit Configuration**: Defines the maximum number of requests allowed per time window, the time window duration, and the client identification method
- **Rate Limit State**: Tracks current request counts per client identifier within the current time window
- **Client Identifier**: Unique identifier used to track rate limits, consisting of the combination of IP address and license key from the request

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Public endpoints (`/api/validate` and `/api/consume`) are accessible without authentication headers, with 100% of valid license requests succeeding when within rate limits
- **SC-002**: Rate limiting prevents abuse by rejecting requests that exceed 100 requests per minute per client with HTTP 429 responses
- **SC-003**: System maintains 99.9% uptime for public endpoints under normal load conditions (requests within rate limits)
- **SC-004**: Rate limit errors include actionable retry information, enabling clients to automatically retry after the specified period
- **SC-005**: Rate limiting is applied per-client, allowing multiple legitimate clients to use the service simultaneously without interfering with each other
- **SC-006**: License validation and consumption functionality remains unchanged - all existing validation rules (expiration, device limits, credit availability) continue to work correctly
- **SC-007**: Rate limit violations are logged and trackable for security monitoring and abuse detection

## Assumptions

- Rate limiting will be implemented using a fixed window algorithm (counts reset at fixed interval boundaries)
- Client identification will use the combination of IP address and license key as the identifier
- Rate limit configuration will be environment-based (environment variables or configuration files)
- Rate limiting will use in-memory storage for state management (per-instance, not shared across instances)
- Existing license validation and consumption business logic will remain unchanged
- Requests will come from browser extensions (no CORS preflight requests expected)
- Rate limit errors will follow standard HTTP 429 response format with Retry-After header

## Dependencies

- Existing license validation endpoint (`/api/validate`)
- Existing usage consumption endpoint (`/api/consume`)
- License and plan data models in Firestore
- Existing logging infrastructure

## Out of Scope

- Authentication for other endpoints (products, plans, licenses management remain protected)
- API key-based authentication as an alternative to rate limiting
- Different rate limits for different license types or plans
- Rate limit analytics dashboard or UI
- Automatic rate limit adjustment based on system load
- Whitelisting specific IPs or clients to bypass rate limits

