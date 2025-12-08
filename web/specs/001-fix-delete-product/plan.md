# Implementation Plan: Fix Delete Product API Request

**Branch**: `001-fix-delete-product` | **Date**: 2025-01-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-delete-product/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix the DELETE request bug where the `Content-Type: application/json` header is sent with empty bodies, causing 400 Bad Request errors from the Fastify backend. The fix modifies the `fetchApi` function in `services/api.ts` to conditionally include the Content-Type header only when a request body is present. This applies to all DELETE operations (products, plans, and any future DELETE endpoints) to maintain consistency and prevent the same bug elsewhere.

## Technical Context

**Language/Version**: TypeScript 5.8  
**Primary Dependencies**: React 19, Vite 6.4, Firebase 12.6.0  
**Storage**: Firebase Firestore (backend), not directly modified by this fix  
**Testing**: Manual testing via browser DevTools and UI interaction (no test framework currently configured)  
**Target Platform**: Modern web browsers (ES2022+)  
**Project Type**: Single-page web application (React SPA)  
**Performance Goals**: DELETE requests complete in under 2 seconds under normal network conditions  
**Constraints**: Must maintain backward compatibility with existing API calls, no breaking changes  
**Scale/Scope**: Bug fix affecting 2 DELETE endpoints (products, plans), single file modification (`services/api.ts`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 (Initial Check)

**Code Quality**: ✅ PASS
- TypeScript strict mode compliance: No new code, modification to existing typed function
- Explicit error handling: Existing error handling preserved, no changes needed
- Component organization: Change is isolated to service layer, maintains project structure

**UX Consistency**: ✅ PASS
- No UI changes required
- Existing error messages and user feedback mechanisms remain unchanged
- Loading states and error handling already implemented in UI components

**Performance**: ✅ PASS
- No bundle size impact (code reduction, not addition)
- No new dependencies required
- No impact on code splitting or route loading
- Fix may slightly improve performance by reducing unnecessary header overhead

**Technology Stack**: ✅ PASS
- No new dependencies required
- Uses existing React 19, TypeScript 5.8, Vite 6.4 stack
- No architectural changes

### Post-Phase 1 (After Design)

**Code Quality**: ✅ PASS
- Design confirms minimal change: conditional header setting in existing function
- Type safety maintained: using `Record<string, string>` for headers object
- Error handling unchanged: existing try-catch and error propagation preserved

**UX Consistency**: ✅ PASS
- No UI changes confirmed in design phase
- User experience improves (deletion now works without errors)
- Existing feedback mechanisms remain functional

**Performance**: ✅ PASS
- Implementation reduces header overhead (removes unnecessary Content-Type)
- No bundle size increase confirmed
- No new dependencies required

**Technology Stack**: ✅ PASS
- No new dependencies identified in research phase
- Uses existing Fetch API and TypeScript patterns
- No architectural changes required

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-delete-product/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
services/
└── api.ts               # Single file modification - fetchApi function

pages/
├── Products.tsx         # Uses api.products.delete - no changes needed
└── Plans.tsx            # Uses api.plans.delete - no changes needed
```

**Structure Decision**: Single project structure. The fix is isolated to the `services/api.ts` file where the `fetchApi` helper function is defined. All DELETE operations (and any future DELETE operations) will automatically benefit from the fix since they all use this shared function.

## Complexity Tracking

> **No violations** - This is a simple bug fix with no complexity additions. The change is minimal, isolated, and maintains all existing patterns.
