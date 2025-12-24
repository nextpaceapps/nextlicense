# Implementation Plan: Open API Endpoints with Rate Limiting

**Branch**: `005-open-api-endpoints` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-open-api-endpoints/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add rate limiting middleware to public endpoints (`/api/validate` and `/api/consume`) to protect against abuse while maintaining open access without authentication. Rate limiting will use a fixed window algorithm with in-memory storage, tracking requests per client using the combination of IP address and license key. The implementation will be configurable via environment variables with safe defaults.

## Technical Context

**Language/Version**: TypeScript 5.8.2  
**Primary Dependencies**: 
- Fastify 5.1.0 (existing)
- Custom rate limiting middleware (no additional dependencies - uses Fastify hooks and in-memory Map)
**Storage**: In-memory (Map/object) for rate limit state tracking (per-instance)  
**Testing**: TypeScript/Node.js testing (to be determined)  
**Target Platform**: Node.js server (Cloud Run / Firebase App Hosting)  
**Project Type**: web (backend API only)  
**Performance Goals**: 
- Rate limit check overhead: <10ms per request (SC-003)
- 99.9% uptime for public endpoints under normal load (SC-003)
- Rate limiting must not interfere with legitimate requests (FR-014)
**Constraints**: 
- In-memory storage (per-instance, not shared) - keep it simple
- Fixed window algorithm for simplicity
- Client identifier: IP address + License Key combination
- Safe defaults if configuration missing (100 req/min, log warning)
**Scale/Scope**: 
- Two public endpoints: `/api/validate` and `/api/consume`
- Rate limit: 100 requests per minute per client (IP + License Key)
- In-memory state management (per server instance)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: Constitution file appears to be a template. No specific gates identified. Proceeding with standard best practices:
- Simplicity: In-memory storage chosen over distributed cache to keep implementation simple
- Security: Rate limiting protects endpoints from abuse without requiring authentication
- Observability: Rate limit violations logged for monitoring (FR-013)
- Configuration: Environment-based configuration with safe defaults (FR-012, FR-015)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
api/
├── middleware/
│   ├── auth.ts              # Existing authentication middleware
│   └── rateLimit.ts         # NEW: Rate limiting middleware
├── routes/
│   ├── validation.ts        # Existing (UPDATE: add rate limit middleware)
│   └── consume.ts            # Existing (UPDATE: add rate limit middleware)
├── index.ts                 # Fastify server setup (UPDATE: register rate limit middleware)
└── services/
    └── firestore.ts         # Existing Firestore service
```

**Structure Decision**: Web application structure (backend API only). Changes will be made to existing files:
- `api/middleware/rateLimit.ts`: New rate limiting middleware implementing fixed window algorithm
- `api/routes/validation.ts`: Add rate limit middleware hook
- `api/routes/consume.ts`: Add rate limit middleware hook
- `api/index.ts`: Register rate limit middleware for public endpoints

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations. Implementation follows standard patterns:
- Existing middleware pattern (similar to auth middleware)
- In-memory storage chosen for simplicity (no external dependencies)
- Fixed window algorithm for straightforward implementation
- Minimal changes to existing codebase (new middleware + hook registration)

---

## Phase Completion Status

### Phase 0: Research ✓
- **research.md**: Created with all technical decisions documented
- All NEEDS CLARIFICATION items resolved
- Rate limiting implementation approach: Custom middleware using Fastify hooks
- Fixed window algorithm documented
- Client identifier extraction (IP + License Key) documented
- Configuration and error handling patterns defined

### Phase 1: Design & Contracts ✓
- **data-model.md**: Created with rate limit entities and state transitions
- **contracts/api-contracts.md**: Created with updated endpoint contracts including rate limiting
- **quickstart.md**: Created with step-by-step implementation guide
- **Agent context**: Updated (if script available)

### Phase 2: Tasks
- **Status**: Not created (use `/speckit.tasks` command)
- **Next Step**: Run `/speckit.tasks` to break down implementation tasks
