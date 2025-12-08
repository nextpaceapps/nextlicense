# Research: Fix Delete Product API Request

**Date**: 2025-01-25  
**Feature**: Fix DELETE request Content-Type header issue

## Research Tasks

### Task 1: HTTP DELETE Request Best Practices

**Decision**: DELETE requests should not include `Content-Type: application/json` header when no request body is present.

**Rationale**: 
- HTTP DELETE requests typically do not include request bodies (RFC 7231)
- Setting `Content-Type: application/json` without a body violates HTTP semantics
- Fastify (the backend framework) explicitly rejects empty JSON bodies with this error: `FST_ERR_CTP_EMPTY_JSON_BODY`
- The Fetch API and most HTTP clients do not require Content-Type for requests without bodies

**Alternatives considered**:
- Sending an empty JSON object `{}` as body: Rejected - violates REST principles and adds unnecessary payload
- Removing Content-Type only for DELETE: Rejected - should apply to all requests without bodies for consistency
- Backend modification: Rejected - spec states no backend changes required, and the backend behavior is correct

**References**:
- RFC 7231 Section 4.3.5 (DELETE method)
- Fastify documentation on content-type parsing
- MDN Web Docs: Using Fetch API

### Task 2: Fastify Content-Type Parsing Behavior

**Decision**: Fastify correctly rejects empty JSON bodies when Content-Type is set to `application/json`.

**Rationale**:
- Fastify's content-type parser expects a body when `Content-Type: application/json` is present
- Error code `FST_ERR_CTP_EMPTY_JSON_BODY` is the expected behavior for this scenario
- The fix should be on the client side to not send the header when no body exists

**Alternatives considered**:
- Configuring Fastify to allow empty JSON bodies: Rejected - would require backend changes, and the current behavior is correct
- Sending a different Content-Type: Rejected - unnecessary workaround, better to fix the root cause

### Task 3: Conditional Header Setting Pattern

**Decision**: Conditionally set `Content-Type: application/json` header only when `options.body` is present and truthy.

**Rationale**:
- Simple conditional check: `if (options?.body) { headers['Content-Type'] = 'application/json' }`
- Maintains backward compatibility for all existing POST/PUT requests that have bodies
- Automatically fixes all current and future DELETE operations
- No breaking changes to existing API calls

**Alternatives considered**:
- Method-based check (only for DELETE): Rejected - less maintainable, doesn't handle edge cases like POST without body
- Explicit list of methods that need Content-Type: Rejected - more complex, harder to maintain
- Always include Content-Type: Rejected - causes the current bug

**Implementation Pattern**:
```typescript
const headers: Record<string, string> = {
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  ...options?.headers,
};

if (options?.body) {
  headers['Content-Type'] = 'application/json';
}
```

## Summary

All research tasks resolved. The fix is straightforward: conditionally include the `Content-Type: application/json` header only when a request body is present. This follows HTTP best practices, fixes the Fastify error, and maintains backward compatibility.

