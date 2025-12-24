# Research: Rate Limiting for Public API Endpoints

**Feature**: 005-open-api-endpoints  
**Date**: 2025-01-27

## Technical Decisions

### Rate Limiting Implementation Approach

**Decision**: Implement custom rate limiting middleware using Fastify hooks (preHandler) with in-memory storage.

**Rationale**: 
- Fastify provides hooks (onRequest, preHandler) for middleware-like functionality
- Custom implementation allows full control over client identifier logic (IP + License Key combination)
- In-memory storage aligns with "keep it simple" principle (no external dependencies)
- Fixed window algorithm is straightforward to implement and maintain
- Existing codebase already uses custom middleware pattern (see `middleware/auth.ts`)

**Alternatives considered**:
- `@fastify/rate-limit` plugin: Provides rate limiting but may not support custom client identifier (IP + License Key combination) easily
- Redis-based rate limiting: Adds external dependency, more complex, not needed for single-instance deployment
- Third-party rate limiting services: Adds external dependency and cost, overkill for current needs

**Implementation**: Create `api/middleware/rateLimit.ts` that:
1. Uses Fastify `preHandler` hook to intercept requests
2. Extracts IP address from request and license key from request body
3. Creates composite identifier: `${ip}:${licenseKey}`
4. Implements fixed window algorithm using in-memory Map
5. Returns HTTP 429 with Retry-After header when limit exceeded
6. Logs rate limit violations for monitoring

### Fixed Window Algorithm Implementation

**Decision**: Use fixed window algorithm with 1-minute windows.

**Rationale**:
- Simpler to implement than sliding window
- Aligns with "keep it simple" principle
- Sufficient for 100 req/min limit (burst protection less critical)
- Easy to understand and debug
- Low memory overhead (one counter per client per window)

**Alternatives considered**:
- Sliding window: More accurate but requires storing timestamps per request, more complex
- Token bucket: More sophisticated but adds complexity without significant benefit for this use case

**Implementation**: 
- Track requests per client in 1-minute windows
- Window boundaries: 0:00-0:59, 1:00-1:59, etc.
- Reset counters at window boundaries
- Use Map with key: `${ip}:${licenseKey}:${windowTimestamp}`

### Client Identifier Extraction

**Decision**: Extract IP address from request headers/connection and license key from request body.

**Rationale**:
- IP address available from `request.ip` or `request.headers['x-forwarded-for']`
- License key required in request body for both endpoints (validation and consumption)
- Combination provides protection against both IP rotation and multiple license key abuse

**Alternatives considered**:
- IP only: Vulnerable to license key rotation abuse
- License key only: Vulnerable to IP rotation abuse
- API key header: Would require additional authentication mechanism, out of scope

**Implementation**:
- Extract IP: `request.ip` (Fastify provides this automatically)
- Extract license key: From `request.body.key` (after body parsing)
- Handle case where body not yet parsed (preHandler runs after preParsing, so body should be available)
- Fallback: If license key unavailable, use IP only (shouldn't happen in normal flow)

### Rate Limit Configuration

**Decision**: Use environment variables with safe defaults.

**Rationale**:
- Environment variables align with existing codebase pattern (see `index.ts`)
- No code changes needed to adjust limits
- Safe defaults ensure protection even if configuration missing
- Matches FR-012 requirement for configurability without code changes

**Alternatives considered**:
- Configuration file: Adds file I/O complexity, environment variables simpler
- Hard-coded values: Not configurable, violates FR-012

**Implementation**:
- Environment variables: `RATE_LIMIT_MAX_REQUESTS` (default: 100), `RATE_LIMIT_WINDOW_MS` (default: 60000)
- Load configuration on server startup
- Log warning if using defaults (per FR-015)
- Validate configuration values (positive integers)

### Rate Limit Response Format

**Decision**: Return HTTP 429 with standard Retry-After header and JSON error body.

**Rationale**:
- HTTP 429 is standard for rate limiting (per FR-005)
- Retry-After header provides actionable information (per FR-006)
- JSON error body consistent with existing API error responses
- Follows Fastify error response patterns

**Alternatives considered**:
- Plain text error: Less structured, inconsistent with API
- Custom headers only: Less discoverable for clients

**Implementation**:
- Status code: 429
- Headers: `Retry-After: <seconds>` (time until next window)
- Body: `{ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED", retryAfter: <seconds> }`
- Log violation with client identifier (masked license key for security)

### Memory Management

**Decision**: Clean up expired window entries periodically to prevent memory leaks.

**Rationale**:
- In-memory Map will grow over time if entries not cleaned
- Long-running server could accumulate stale entries
- Periodic cleanup prevents unbounded memory growth

**Alternatives considered**:
- No cleanup: Risk of memory leaks over time
- Cleanup on every request: Adds overhead, cleanup can be batched

**Implementation**:
- Run cleanup every 5 minutes (or configurable interval)
- Remove entries older than current window
- Use setTimeout/setInterval for periodic cleanup
- Consider using WeakMap if entries can be garbage collected naturally (but Map is simpler for this use case)

### Error Handling

**Decision**: If rate limiting fails (e.g., memory issues), allow request to proceed but log error.

**Rationale**:
- Rate limiting is protection mechanism, not core functionality
- Failing open (allowing request) is safer than failing closed (blocking all requests)
- Logging ensures operators are aware of issues
- Aligns with FR-014: rate limiting must not interfere with legitimate requests

**Alternatives considered**:
- Fail closed: Could block legitimate requests if rate limiter fails
- Fail silently: Operators wouldn't know rate limiting is broken

**Implementation**:
- Wrap rate limit check in try-catch
- On error, log error and allow request to proceed
- Monitor error logs for rate limiting failures

