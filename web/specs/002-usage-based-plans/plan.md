# Implementation Plan: Usage-Based Plans and Licenses

**Branch**: `002-usage-based-plans` | **Date**: 2025-12-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/web/specs/002-usage-based-plans/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement usage-based licensing system that allows admins to create plans with default usage counts, automatically assign usage quotas to licenses, enable usage topups, and provide a public consumption endpoint. The system enforces product/plan scoping through header validation and handles concurrent consumption requests atomically.

## Technical Context

**Language/Version**: TypeScript 5.8.2  
**Primary Dependencies**: Fastify 5.1.0, Firebase Admin SDK 13.0.1, Firestore  
**Storage**: Firestore (Firebase)  
**Testing**: Manual validation (no test framework currently configured)  
**Target Platform**: Node.js server (API), Web browser (React/Vite frontend)  
**Project Type**: Web application (api/ backend + web/ frontend)  
**Performance Goals**: Consumption endpoint <500ms p95 latency, handle concurrent requests without race conditions  
**Constraints**: Must maintain backward compatibility with existing time-based plans, strict TypeScript compliance  
**Scale/Scope**: Support usage counts up to millions, handle concurrent consumption requests for same license

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Architecture Separation**: ✅ Feature spans both `api/` (backend routes, services) and `web/` (frontend UI components). Clear boundaries:
- API: New `/api/consume` endpoint, plan/license service updates, topup endpoint
- Web: Plan creation form updates, license display updates, topup UI

**TypeScript Strictness**: ✅ Backend work requires strict TypeScript compliance. Verified `api/tsconfig.json` has `"strict": true` enabled.

**Testing Discipline**: Manual validation approach documented. No automated tests planned for this feature iteration.

**Code Quality**: Design follows senior engineering patterns:
- Service layer separation (FirestoreService)
- Route handlers delegate to services
- Proper error handling and logging
- Transaction-based atomic operations for concurrent safety

**Git Workflow**: ✅ No automatic pushes planned - all pushes require manual confirmation.

## Project Structure

### Documentation (this feature)

```text
web/specs/002-usage-based-plans/
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
├── routes/
│   ├── plans.ts          # Update: Add defaultUsageCount validation, plan type exclusivity
│   ├── licenses.ts       # Update: Add topup endpoint POST /api/licenses/:id/topup
│   └── consume.ts        # NEW: Public consumption endpoint POST /api/consume
├── services/
│   └── firestore.ts      # Update: Add usage tracking methods, consumption logic with transactions
├── types.ts              # Update: Add defaultUsageCount to Plan, currentUsageCount/totalUsageCount to License
└── index.ts              # Update: Register consume routes (public)

web/
├── pages/
│   ├── Plans.tsx         # Update: Add defaultUsageCount field to plan creation form
│   └── Licenses.tsx      # Update: Display usage counts, add topup UI
├── services/
│   └── api.ts            # Update: Add consume and topup API methods
└── types.ts              # Update: Sync with api/types.ts changes
```

**Structure Decision**: Web application structure with clear separation between `api/` (Fastify backend) and `web/` (React frontend). Both share types via `types.ts` files that must be kept in sync.

## Complexity Tracking

> **No violations detected - all Constitution Check items pass**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

