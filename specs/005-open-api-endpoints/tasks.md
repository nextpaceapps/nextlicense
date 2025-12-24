# Implementation Tasks: Open API Endpoints with Rate Limiting

**Feature**: 005-open-api-endpoints  
**Branch**: `005-open-api-endpoints`  
**Date**: 2025-01-27  
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Summary

This feature adds rate limiting to public endpoints `/api/validate` and `/api/consume` to protect against abuse while maintaining open access without authentication. Rate limiting uses a fixed window algorithm with in-memory storage, tracking requests per client using IP address + License Key combination.

**Total Tasks**: 15  
**User Stories**: 3 (2 P1, 1 P2)  
**MVP Scope**: Phase 1-3 (Setup + Rate Limiting Middleware + Validation Endpoint)

## Dependencies

**Story Completion Order**:
1. **Phase 1 (Setup)** → Must complete before all other phases
2. **Phase 2 (Foundational - Rate Limiting Middleware)** → Required for Phase 3 and Phase 4
3. **Phase 3 (User Story 1 - Validation Endpoint)** → Independent, can run in parallel with Phase 4
4. **Phase 4 (User Story 2 - Consumption Endpoint)** → Independent, can run in parallel with Phase 3
5. **Phase 5 (Polish)** → Requires Phase 2, 3, and 4 complete

**Parallel Opportunities**:
- Phase 3 and Phase 4 can be implemented in parallel (different files, no dependencies)
- Tasks within Phase 2 can be partially parallelized (interface definition before implementation)

## Implementation Strategy

**MVP First**: Implement Phase 1-3 to deliver rate-limited validation endpoint (User Story 1)
**Incremental Delivery**: 
- MVP: Setup + Rate Limiting Middleware + Validation Endpoint
- Next: Consumption Endpoint (Phase 4)
- Final: Polish and documentation (Phase 5)

---

## Phase 1: Setup

**Goal**: Prepare environment and configuration for rate limiting

**Independent Test**: Environment variables can be read and validated

### Tasks

- [x] T001 Create environment variable configuration in `api/.env.local.example` with rate limiting defaults (RATE_LIMIT_MAX_REQUESTS=100, RATE_LIMIT_WINDOW_MS=60000, RATE_LIMIT_CLEANUP_INTERVAL_MS=300000)
- [x] T002 Update `api/.env.local` (if exists) or document required environment variables for rate limiting configuration

---

## Phase 2: Foundational - Rate Limiting Middleware (User Story 3)

**Goal**: Implement rate limiting middleware with fixed window algorithm and in-memory storage

**Independent Test**: Rate limiting middleware can be instantiated, tracks requests per client (IP + License Key), enforces limits, and returns HTTP 429 with Retry-After when exceeded

**Story**: User Story 3 - Rate Limit Protection (Priority: P2)

### Tasks

- [x] T003 [US3] Create rate limiting middleware interface/types in `api/middleware/rateLimit.ts` (RateLimitConfig, RateLimitEntry interfaces, RateLimiter class structure)
- [x] T004 [US3] Implement RateLimiter class constructor in `api/middleware/rateLimit.ts` with environment variable loading, validation, and safe defaults (per FR-012, FR-015)
- [x] T005 [US3] Implement getWindowTimestamp method in `api/middleware/rateLimit.ts` to calculate fixed window boundaries (Math.floor(now / windowMs) * windowMs)
- [x] T006 [US3] Implement getClientIdentifier method in `api/middleware/rateLimit.ts` to extract IP address and license key, create composite identifier (per FR-007)
- [x] T007 [US3] Implement checkLimit method in `api/middleware/rateLimit.ts` with fixed window algorithm, Map-based state tracking, and HTTP 429 response when exceeded (per FR-005, FR-006)
- [x] T008 [US3] Implement startCleanup method in `api/middleware/rateLimit.ts` with periodic cleanup of expired window entries to prevent memory leaks
- [x] T009 [US3] Implement rateLimitMiddleware hook function in `api/middleware/rateLimit.ts` that integrates with Fastify preHandler hook pattern
- [x] T010 [US3] Add rate limit violation logging in `api/middleware/rateLimit.ts` with masked license key for security monitoring (per FR-013)

---

## Phase 3: User Story 1 - Public License Validation

**Goal**: Apply rate limiting to validation endpoint while maintaining existing functionality

**Independent Test**: POST request to `/api/validate` without auth headers validates license and respects rate limits (100 req/min per IP + License Key), returns 429 when exceeded

**Story**: User Story 1 - Public License Validation (Priority: P1)

### Tasks

- [x] T011 [US1] Import rateLimitMiddleware in `api/routes/validation.ts`
- [x] T012 [US1] Add preHandler hook with rateLimitMiddleware to validation route in `api/routes/validation.ts`
- [x] T013 [US1] Verify validation endpoint remains accessible without authentication headers (per FR-001, FR-008)

---

## Phase 4: User Story 2 - Public Usage Consumption

**Goal**: Apply rate limiting to consumption endpoint while maintaining existing functionality

**Independent Test**: POST request to `/api/consume` without auth headers consumes usage and respects rate limits (100 req/min per IP + License Key), returns 429 when exceeded

**Story**: User Story 2 - Public Usage Consumption (Priority: P1)

### Tasks

- [x] T014 [US2] Import rateLimitMiddleware in `api/routes/consume.ts`
- [x] T015 [US2] Add preHandler hook with rateLimitMiddleware to consumption route in `api/routes/consume.ts`
- [x] T016 [US2] Verify consumption endpoint remains accessible without authentication headers (per FR-002, FR-009)

---

## Phase 5: Polish & Cross-Cutting Concerns

**Goal**: Complete documentation, update OpenAPI schema, and ensure all requirements met

**Independent Test**: All endpoints documented, OpenAPI schema updated, rate limiting behavior verified end-to-end

### Tasks

- [x] T017 Update OpenAPI schema in `api/index.ts` to document 429 rate limit responses for `/api/validate` and `/api/consume` endpoints
- [x] T018 Add rate limiting documentation to API README or update `api/README.md` with rate limit configuration and behavior
- [x] T019 Verify all functional requirements met: FR-001 through FR-015 (checklist validation)
- [x] T020 Test rate limiting with multiple clients (different IP + License Key combinations) to verify per-client limits (per SC-005)

---

## Task Summary

| Phase | Tasks | Story | Priority |
|-------|-------|-------|----------|
| Phase 1: Setup | T001-T002 | - | - |
| Phase 2: Rate Limiting Middleware | T003-T010 | US3 | P2 |
| Phase 3: Validation Endpoint | T011-T013 | US1 | P1 |
| Phase 4: Consumption Endpoint | T014-T016 | US2 | P1 |
| Phase 5: Polish | T017-T020 | - | - |
| **Total** | **20 tasks** | **3 stories** | **2 P1, 1 P2** |

## Parallel Execution Examples

### Example 1: Phase 3 and Phase 4 in Parallel
```
Developer A: T011-T013 (Validation endpoint)
Developer B: T014-T016 (Consumption endpoint)
```
Both can work simultaneously as they modify different files with no dependencies.

### Example 2: Phase 2 Partial Parallelization
```
Developer A: T003-T005 (Interface and window calculation)
Developer B: T006-T007 (Client identifier and limit checking) - after T003
Developer C: T008-T010 (Cleanup and logging) - after T007
```

## Notes

- All tasks follow strict checklist format with Task ID, Story label, and file paths
- Rate limiting middleware (Phase 2) must complete before Phase 3 and Phase 4
- Phase 3 and Phase 4 are independent and can be parallelized
- MVP scope: Phases 1-3 deliver rate-limited validation endpoint
- No tests requested in spec - tasks focus on implementation only

