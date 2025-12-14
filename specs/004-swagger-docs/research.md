# Research: API Documentation Implementation

**Date**: 2025-01-27  
**Feature**: API Documentation (004-swagger-docs)

## Technology Selection

### Decision: Use @fastify/swagger and @fastify/swagger-ui

**Rationale**:
- Official Fastify plugins maintained by the Fastify organization
- Designed specifically for Fastify 5.x compatibility
- Automatic OpenAPI specification generation from route schemas
- Built-in Swagger UI for interactive testing
- Supports Bearer token authentication for protected endpoints
- Can export OpenAPI JSON/YAML formats
- Minimal configuration required
- Active maintenance and community support

**Alternatives Considered**:
1. **fastify-swagger** (older package) - Deprecated in favor of @fastify/swagger
2. **Custom documentation system** - Too complex, reinventing the wheel
3. **Separate documentation service** - Violates requirement to serve from same API server (FR-020)
4. **Static OpenAPI files** - Doesn't support auto-sync with code changes (FR-011)

## Implementation Approach

### Decision: Dynamic Mode with Route Schema Annotations

**Rationale**:
- Fastify's dynamic mode automatically generates OpenAPI spec from route schemas
- Ensures documentation stays synchronized with code (FR-011)
- No manual OpenAPI file maintenance required
- Changes to routes automatically reflected in documentation

**How it works**:
1. Routes define JSON schemas for params, body, query, and responses
2. @fastify/swagger scans all registered routes and generates OpenAPI 3.0 spec
3. @fastify/swagger-ui serves the spec via Swagger UI interface
4. Developers can view, test, and export documentation

### Decision: Route Prefix `/docs`

**Rationale**:
- Common convention for API documentation
- Clear and intuitive URL path
- Doesn't conflict with existing API routes (all under `/api/`)
- Easy to remember and share

### Decision: Manual Bearer Token Entry for Interactive Testing

**Rationale**:
- Matches clarification requirement (manual token entry)
- Flexible - works with any Bearer token source
- No complex authentication integration needed
- Swagger UI supports "Authorize" button for Bearer tokens
- Developers can paste tokens from Firebase Auth or other sources

## OpenAPI Export Formats

### Decision: Support Both JSON and YAML

**Rationale**:
- OpenAPI specification supports both formats
- JSON is more common for programmatic use
- YAML is more human-readable
- Both can be generated from the same OpenAPI spec object
- @fastify/swagger generates JSON spec, can be converted to YAML

**Implementation**:
- Swagger UI provides built-in export/download functionality
- Can add custom routes to serve `/docs/openapi.json` and `/docs/openapi.yaml`
- Both formats generated from same source (ensures consistency)

## Route Schema Requirements

### Decision: Add JSON Schemas to Existing Routes

**Rationale**:
- Fastify already uses JSON Schema for validation
- Can reuse existing validation schemas for documentation
- Minimal code changes required
- Ensures documentation matches actual validation rules

**What needs to be added**:
- `description` fields for routes and parameters
- `summary` for route descriptions
- `tags` for logical grouping (products, plans, licenses, etc.)
- Response schemas (currently only request validation exists)
- Example values in schemas
- Security definitions for protected endpoints

## Authentication Documentation

### Decision: Use OpenAPI Security Schemes

**Rationale**:
- OpenAPI 3.0 standard for documenting authentication
- Swagger UI automatically shows "Authorize" button
- Supports Bearer token format (matches Firebase Auth)
- Can mark endpoints as requiring authentication

**Implementation**:
- Define security scheme: `type: http, scheme: bearer, bearerFormat: JWT`
- Apply security to protected route schemas
- Swagger UI will show lock icon and "Authorize" button
- Users can enter Bearer token manually

## Performance Considerations

### Decision: Generate Spec on Server Start (Not on Every Request)

**Rationale**:
- OpenAPI spec generation is lightweight
- Routes don't change at runtime
- Caching spec in memory is sufficient
- Meets performance goal of <3s load time (SC-010)

**Implementation**:
- @fastify/swagger generates spec during plugin registration
- Spec cached in memory
- Swagger UI fetches spec once on page load
- No runtime overhead for documentation requests

## Edge Cases Handling

### Conditional Required Fields
- OpenAPI supports `oneOf`, `anyOf`, `allOf` for conditional schemas
- Can document plan type exclusivity (usage-based vs time-based) using `oneOf`

### Varying Response Schemas
- OpenAPI supports multiple response schemas per status code
- Can use `oneOf` or separate status codes for different response types
- Document plan-specific response variations

### Complex Nested Structures
- OpenAPI supports nested object schemas
- Can reference shared schema components using `$ref`
- Swagger UI renders nested structures with expand/collapse

### Deprecated Endpoints
- OpenAPI supports `deprecated: true` flag
- Can mark endpoints as deprecated in schema
- Swagger UI shows visual indicator for deprecated endpoints

## Dependencies

### Required Packages
- `@fastify/swagger` - OpenAPI spec generation
- `@fastify/swagger-ui` - Swagger UI interface
- `js-yaml` (optional) - For YAML export if not built into swagger-ui

### Version Compatibility
- Fastify 5.1.0 (existing)
- @fastify/swagger 9.x (compatible with Fastify 5.x)
- @fastify/swagger-ui latest (compatible with @fastify/swagger 9.x)
- Node.js ≥18.17.0 (required by @fastify/swagger 9.x)

## Integration Points

### Route Registration Order
1. Register @fastify/swagger first (generates spec)
2. Register @fastify/swagger-ui second (serves UI using spec)
3. Register route modules (they get scanned by swagger)

### Existing Route Structure
- Routes already use Fastify's route registration
- Need to add schema definitions to route handlers
- Can add schemas incrementally (not all at once)

### CORS Configuration
- Swagger UI makes requests to API endpoints
- Existing CORS configuration should allow Swagger UI origin
- May need to add documentation route to CORS allowed origins

## Testing Strategy

### Manual Validation
- Access `/docs` route and verify all endpoints listed
- Test interactive requests for each endpoint type
- Verify Bearer token authentication works
- Test export functionality (JSON and YAML)
- Verify documentation updates when routes change

### Success Criteria Validation
- SC-001: Verify endpoint discovery time <2 minutes
- SC-002: Verify first API request success <5 minutes
- SC-003: Verify 100% endpoint coverage
- SC-006: Verify 80%+ endpoints testable interactively
- SC-010: Verify load time <3 seconds
