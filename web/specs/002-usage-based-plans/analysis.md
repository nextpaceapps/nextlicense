# Consistency Analysis: Usage-Based Plans and Licenses

**Feature**: 002-usage-based-plans  
**Date**: 2025-12-08  
**Branch**: `002-usage-based-plans`

## Executive Summary

✅ **Overall Status**: READY FOR IMPLEMENTATION

The specification, plan, tasks, and codebase are consistent. All required artifacts are present and aligned. No blocking inconsistencies detected. Minor recommendations provided for implementation guidance.

---

## 1. Specification ↔ Plan Consistency

### ✅ PASS: All Requirements Mapped

| Spec Requirement | Plan Coverage | Status |
|-----------------|---------------|--------|
| Plan type exclusivity (FR-002) | Documented in plan, research.md | ✅ |
| Usage tracking fields (FR-003) | Data model defined | ✅ |
| Topup functionality (FR-004) | Endpoint and service methods planned | ✅ |
| Consumption endpoint (FR-006) | New route file planned | ✅ |
| Product-id header validation (FR-007, FR-008) | Contract and implementation planned | ✅ |
| Atomic operations (FR-016) | Firestore transactions documented | ✅ |

**Findings**: All functional requirements from spec are covered in the plan with clear implementation paths.

---

## 2. Plan ↔ Tasks Consistency

### ✅ PASS: All Plan Components Have Tasks

| Plan Component | Task Coverage | Status |
|----------------|---------------|--------|
| Type updates (api/types.ts, web/types.ts) | T001-T006 | ✅ |
| Plan creation validation | T009-T011, T012-T015 | ✅ |
| License usage initialization | T016-T019 | ✅ |
| Consumption endpoint | T020-T026 | ✅ |
| Topup endpoint | T027-T036 | ✅ |
| Service layer methods | T007-T008, T016, T022, T028 | ✅ |

**Findings**: Every component mentioned in the plan has corresponding tasks with specific file paths.

### ⚠️ MINOR: Helper Methods

**Issue**: Plan mentions helper methods (T007-T008) but they may not be strictly necessary.

**Recommendation**: These can be implemented inline if preferred, or kept as helpers for code organization. Not a blocker.

---

## 3. Tasks ↔ Codebase Consistency

### ✅ PASS: File Paths Valid

All task file paths exist and are correct:
- ✅ `api/types.ts` - exists
- ✅ `web/types.ts` - exists  
- ✅ `api/routes/plans.ts` - exists
- ✅ `api/routes/licenses.ts` - exists
- ✅ `api/services/firestore.ts` - exists
- ✅ `api/index.ts` - exists
- ✅ `web/pages/Plans.tsx` - exists
- ✅ `web/pages/Licenses.tsx` - exists
- ✅ `web/services/api.ts` - exists (referenced in tasks)

### ✅ PASS: Codebase Patterns Match Tasks

**Transaction Pattern**: 
- ✅ Existing code uses `db.runTransaction()` (see `renewLicense` method)
- ✅ Tasks correctly specify Firestore transactions for consumption and topup
- ✅ Pattern is consistent with existing implementation

**Route Registration Pattern**:
- ✅ Public routes registered before protected routes (validation endpoint)
- ✅ Tasks correctly specify consumption routes as public
- ✅ Pattern matches existing `api/index.ts` structure

**Service Layer Pattern**:
- ✅ Service methods in `FirestoreService` class
- ✅ Route handlers delegate to service methods
- ✅ Tasks follow this pattern correctly

### ⚠️ MINOR: Type Synchronization Note

**Issue**: Both `api/types.ts` and `web/types.ts` have sync comments, but tasks update them separately.

**Recommendation**: 
- Complete T001-T003 first (api/types.ts)
- Then immediately complete T004-T006 (web/types.ts) to keep in sync
- Consider adding a pre-commit hook or script to verify sync in future

---

## 4. Type Definitions Consistency

### ✅ PASS: Current Types Match Base Structure

**Current State**:
- ✅ `Plan` type exists with `durationDays`, `deviceLimit` (time-based fields)
- ✅ `License` type exists without usage tracking fields
- ✅ `LogEvent` type exists with current log types

**Required Changes** (from tasks):
- ⏳ Add `defaultUsageCount?: number` to `Plan` (T001, T004)
- ⏳ Add `currentUsageCount?: number` and `totalUsageCount?: number` to `License` (T002, T005)
- ⏳ Add `'CONSUME' | 'TOPUP'` to `LogEvent.type` (T003, T006)

**Backward Compatibility**: ✅ All new fields are optional, maintaining compatibility with existing time-based plans/licenses.

---

## 5. Implementation Readiness

### ✅ READY: All Prerequisites Met

| Prerequisite | Status | Notes |
|--------------|--------|-------|
| TypeScript strict mode | ✅ | `api/tsconfig.json` has `"strict": true` |
| Firestore setup | ✅ | FirestoreService class exists and is initialized |
| Fastify routes | ✅ | Route structure established |
| React components | ✅ | Plans.tsx and Licenses.tsx exist |
| Authentication | ✅ | Auth middleware exists for protected routes |
| Logging | ✅ | Logger and log service exist |

### ✅ READY: Dependencies Available

- ✅ Fastify 5.1.0 (installed)
- ✅ Firebase Admin SDK 13.0.1 (installed)
- ✅ Firestore (available via Firebase Admin)
- ✅ React 19.2.0 (installed)
- ✅ TypeScript 5.8.2 (installed)

---

## 6. Potential Issues & Recommendations

### ⚠️ MINOR: Plan Type Detection Logic

**Issue**: Tasks T007-T008 create helper methods, but plan type detection can be done inline.

**Recommendation**: 
- Option A: Keep helpers for cleaner code (as planned)
- Option B: Inline detection using `plan.defaultUsageCount !== undefined`
- **Decision**: Either approach works. Helpers improve readability.

### ⚠️ MINOR: License Expiration Logic

**Issue**: `createLicense` currently always sets `expiresAt` based on `durationDays`, but usage-based licenses don't need this.

**Recommendation**: 
- Task T016 should conditionally set `expiresAt`:
  - Usage-based: Set to far future or current date + 100 years (for display purposes)
  - Time-based: Calculate from `durationDays` (existing logic)
- This maintains backward compatibility while supporting usage-based expiration.

### ✅ GOOD: Transaction Usage

**Finding**: Existing `renewLicense` method demonstrates correct Firestore transaction pattern.

**Recommendation**: Use same pattern for `consumeUsage` and `topupLicense`:
```typescript
return this.db.runTransaction(async (transaction) => {
  // Read license
  // Validate
  // Update atomically
});
```

### ⚠️ MINOR: Error Response Consistency

**Issue**: Tasks don't specify error response format consistency.

**Recommendation**: 
- Follow existing pattern: `{ error: string, code?: string }`
- Use error codes from contracts: `INSUFFICIENT_USAGE`, `PRODUCT_MISMATCH`, etc.
- Ensure all new endpoints return consistent error format.

---

## 7. Missing Components Check

### ✅ COMPLETE: All Required Files Accounted For

| Component | Status | Task Reference |
|-----------|--------|----------------|
| New route file (consume.ts) | ⏳ Planned | T020 |
| Type updates | ⏳ Planned | T001-T006 |
| Service methods | ⏳ Planned | T007-T008, T016, T022, T028 |
| Route updates | ⏳ Planned | T009-T011, T027 |
| Frontend updates | ⏳ Planned | T012-T015, T018-T019, T033-T036 |
| Route registration | ⏳ Planned | T026 |

**No missing components detected.**

---

## 8. Task Dependency Validation

### ✅ PASS: Dependencies Are Correct

**Verified Dependency Chain**:
1. ✅ Phase 1 (Types) → Phase 2 (Helpers) - Types needed for helpers
2. ✅ Phase 2 → Phase 3 (US1) - Helpers used in plan creation
3. ✅ Phase 3 → Phase 4 (US2) - Plans needed for license creation
4. ✅ Phase 4 → Phase 5 (US4+US5) - Licenses needed for consumption
5. ✅ Phase 4 → Phase 6 (US3) - Licenses needed for topup

**Parallel Opportunities Correctly Identified**:
- ✅ Backend and frontend tasks can be parallelized within same story
- ✅ Type updates (T004-T006) can be done in parallel
- ✅ Validation tasks (T009-T010) can be done in parallel

---

## 9. Code Quality Alignment

### ✅ PASS: Follows Existing Patterns

| Pattern | Existing Code | Tasks Follow | Status |
|---------|---------------|--------------|--------|
| Error handling | try/catch with logger | ✅ Specified | ✅ |
| Service delegation | Routes → Services | ✅ Specified | ✅ |
| Transaction usage | `db.runTransaction()` | ✅ Specified | ✅ |
| Logging | `createLog()` calls | ✅ Specified | ✅ |
| Type safety | TypeScript types | ✅ Specified | ✅ |
| Validation | Route-level checks | ✅ Specified | ✅ |

---

## 10. Recommendations Summary

### 🟢 HIGH PRIORITY (Before Implementation)

1. **Type Synchronization**: Complete T001-T003, then immediately T004-T006 to keep types in sync
2. **License Expiration**: Update T016 to handle `expiresAt` for usage-based licenses (set far future or current date)

### 🟡 MEDIUM PRIORITY (During Implementation)

3. **Error Codes**: Use consistent error codes from contracts (INSUFFICIENT_USAGE, PRODUCT_MISMATCH, etc.)
4. **Helper Methods**: Decide whether to keep T007-T008 helpers or inline the logic

### 🔵 LOW PRIORITY (Nice to Have)

5. **Type Sync Verification**: Consider adding automated check to ensure api/types.ts and web/types.ts stay in sync
6. **Documentation**: Update API documentation comments as you implement

---

## Final Verdict

✅ **APPROVED FOR IMPLEMENTATION**

The specification, plan, and tasks are consistent and ready for implementation. All file paths are valid, patterns match existing codebase, and dependencies are correctly identified. Minor recommendations provided but no blocking issues.

**Suggested Next Step**: Begin with Phase 1 (Type Updates) following the task order in `tasks.md`.

---

## Analysis Metadata

- **Analysis Date**: 2025-12-08
- **Spec Version**: Draft (2025-12-08)
- **Plan Version**: Complete (2025-12-08)
- **Tasks Version**: Complete (2025-12-08)
- **Codebase Snapshot**: Current branch `002-usage-based-plans`

