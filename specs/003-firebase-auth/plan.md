# Implementation Plan: Firebase Token Authentication

**Branch**: `003-firebase-auth` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-firebase-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add Firebase token authentication to the API server and adapt the web application to automatically include and manage authentication tokens. The API will validate Firebase ID tokens on protected endpoints, while the web application will automatically include tokens in requests, handle token refresh on expiration, and provide appropriate error handling. Dev login mode will bypass authentication for local development.

## Technical Context

**Language/Version**: TypeScript 5.8.2  
**Primary Dependencies**: 
- API: Fastify 5.1.0, firebase-admin 13.0.1, @fastify/cors 10.0.1
- Web: React 19.2.0, Firebase 12.6.0, Vite 6.4.1  
**Storage**: N/A (authentication state managed by Firebase)  
**Testing**: TypeScript/Node.js testing (to be determined)  
**Target Platform**: 
- API: Node.js server (Cloud Run / Firebase App Hosting)
- Web: Browser-based React application  
**Project Type**: web (frontend + backend)  
**Performance Goals**: 
- Token verification: <1s for 401 responses (SC-005)
- Authentication failure handling: <2s (SC-003)
- Token refresh: 95% success rate on expiration (SC-006)  
**Constraints**: 
- Generic error messages for security (FR-004)
- Reactive token refresh (on expiration, not proactive)
- Dev login bypasses authentication (FR-013)  
**Scale/Scope**: 
- All protected API endpoints (products, plans, licenses, logs)
- Web application API client integration
- Token management and error handling

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: Constitution file appears to be a template. No specific gates identified. Proceeding with standard best practices:
- Security: Generic error messages to prevent information leakage
- Error Handling: Consistent 401 responses for all authentication failures
- User Experience: Automatic token refresh on expiration
- Development: Dev login bypass for local testing convenience

## Project Structure

### Documentation (this feature)

```text
specs/003-firebase-auth/
├── plan.md              # This file (/speckit.plan command output) ✓
├── research.md          # Phase 0 output (/speckit.plan command) ✓
├── data-model.md        # Phase 1 output (/speckit.plan command) ✓
├── quickstart.md        # Phase 1 output (/speckit.plan command) ✓
├── contracts/           # Phase 1 output (/speckit.plan command) ✓
│   └── api-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
api/
├── middleware/
│   └── auth.ts              # Firebase token validation middleware (UPDATE)
├── routes/                  # Protected routes (already use auth middleware)
│   ├── products.ts
│   ├── plans.ts
│   ├── licenses.ts
│   └── logs.ts
├── index.ts                 # Fastify server setup (UPDATE: dev login bypass)
└── services/
    └── firestore.ts

web/
├── services/
│   ├── api.ts               # API client (UPDATE: token refresh, error handling)
│   └── firebase.ts         # Firebase initialization
├── contexts/
│   └── AuthContext.tsx     # Auth context (UPDATE: dev login detection)
└── pages/
    └── [various pages using api service]
```

**Structure Decision**: Web application structure (frontend + backend). Changes will be made to existing files:
- API middleware/auth.ts: Update error messages to be generic, handle dev login bypass
- API index.ts: Add dev login bypass logic
- Web services/api.ts: Add token refresh on 401, improve error handling
- Web contexts/AuthContext.tsx: Add dev login detection mechanism

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations. Implementation follows standard patterns:
- Existing middleware pattern (no new architectural patterns)
- Standard Firebase authentication (no custom auth implementation)
- Minimal changes to existing codebase (updates to existing files only)

---

## Phase Completion Status

### Phase 0: Research ✓
- **research.md**: Created with all technical decisions documented
- All NEEDS CLARIFICATION items resolved
- Firebase Admin SDK patterns researched
- Token refresh patterns documented
- Dev login bypass approach defined

### Phase 1: Design & Contracts ✓
- **data-model.md**: Created with transient authentication entities
- **contracts/api-contracts.md**: Created with authentication contracts
- **quickstart.md**: Created with implementation guide
- **Agent context**: Updated with TypeScript and Firebase information

### Phase 2: Tasks
- **Status**: Not created (use `/speckit.tasks` command)
- **Next Step**: Run `/speckit.tasks` to break down implementation tasks
