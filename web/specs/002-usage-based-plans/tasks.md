# Implementation Tasks: Usage-Based Plans and Licenses

**Feature**: 002-usage-based-plans  
**Branch**: `002-usage-based-plans`  
**Date**: 2025-12-08

## Summary

This document breaks down the implementation into actionable, dependency-ordered tasks organized by user story. Each user story phase is independently testable and can be implemented in parallel where dependencies allow.

**Total Tasks**: 41  
**User Stories**: 5 (4 P1, 1 P2)  
**MVP Scope**: User Story 1 (Plan Creation) - 15 tasks (Phase 1 + Phase 2 + Phase 3)

## Dependencies

```
Phase 1 (Setup) 
  └─> Phase 2 (Foundational)
       ├─> Phase 3 (US1: Plan Creation)
       │    └─> Phase 4 (US2: License Inheritance)
       │         ├─> Phase 5 (US4+US5: Consumption)
       │         └─> Phase 6 (US3: Topup)
       └─> Phase 5 (US4+US5: Consumption) [can start after US2]
```

**Story Completion Order**:
1. US1 (P1): Plan Creation - Foundation for all usage-based features
2. US2 (P1): License Inheritance - Depends on US1, enables consumption
3. US4+US5 (P1): Consumption - Depends on US2, core functionality
4. US3 (P2): Topup - Depends on US2, enhancement feature

## Implementation Strategy

**MVP First**: Start with User Story 1 (Plan Creation) to establish the foundation. This enables creating usage-based plans and validates the core data model.

**Incremental Delivery**: Each user story phase delivers independently testable functionality:
- US1: Admins can create usage-based plans
- US2: Licenses automatically inherit usage counts
- US4+US5: Clients can consume usages with validation
- US3: Admins can topup license usages

**Parallel Opportunities**: 
- Frontend and backend tasks within the same story can be parallelized
- Type updates can be done in parallel (api/types.ts and web/types.ts)
- Service methods and route handlers can be developed in parallel

---

## Phase 1: Setup

**Goal**: Establish type definitions and shared infrastructure required by all user stories.

**Independent Test**: Types compile without errors, no runtime functionality required.

### Tasks

- [x] T001 Update Plan type in api/types.ts to include optional defaultUsageCount field
- [x] T002 Update License type in api/types.ts to include optional currentUsageCount and totalUsageCount fields
- [x] T003 Update LogEvent type in api/types.ts to include 'CONSUME' and 'TOPUP' in type union
- [x] T004 [P] Update Plan type in web/types.ts to match api/types.ts (keep in sync)
- [x] T005 [P] Update License type in web/types.ts to match api/types.ts (keep in sync)
- [x] T006 [P] Update LogEvent type in web/types.ts to match api/types.ts (keep in sync)

---

## Phase 2: Foundational

**Goal**: Set up service layer infrastructure for usage tracking operations.

**Independent Test**: Service methods exist and can be called (implementation comes in story phases).

### Tasks

- [x] T007 Add plan type detection helper method in api/services/firestore.ts (isUsageBasedPlan)
- [x] T008 Add license usage initialization helper method in api/services/firestore.ts (initializeUsageTracking)

---

## Phase 3: User Story 1 - Admin Creates Usage-Based Plan (P1)

**Goal**: Admins can create plans with defaultUsageCount. Plans are mutually exclusive (usage-based OR time-based).

**Independent Test**: Create a plan with defaultUsageCount=1000 via API, verify plan stored correctly with defaultUsageCount value. Create plan with both defaultUsageCount and durationDays, verify rejection.

**Acceptance Criteria**:
- ✅ Plan created with defaultUsageCount stores value correctly
- ✅ Plan without defaultUsageCount for usage-based plan is rejected
- ✅ Plan with defaultUsageCount=0 or negative is rejected
- ✅ Plan with both defaultUsageCount and durationDays/deviceLimit is rejected
- ✅ Usage-based plan view displays defaultUsageCount

### Backend Tasks

- [x] T009 [P] [US1] Add plan type exclusivity validation in api/routes/plans.ts POST endpoint (reject if both usage-based and time-based fields present)
- [x] T010 [P] [US1] Add defaultUsageCount validation in api/routes/plans.ts POST endpoint (positive integer, required for usage-based plans)
- [x] T011 [US1] Update createPlan service method in api/services/firestore.ts to accept and store defaultUsageCount field

### Frontend Tasks

- [x] T012 [P] [US1] Add plan type selector (usage-based vs time-based) to plan creation form in web/pages/Plans.tsx
- [x] T013 [P] [US1] Add defaultUsageCount input field to plan creation form in web/pages/Plans.tsx (shown only for usage-based plans)
- [x] T014 [P] [US1] Add defaultUsageCount display in plan details view in web/pages/Plans.tsx
- [x] T015 [P] [US1] Add client-side validation for plan type exclusivity in web/pages/Plans.tsx

---

## Phase 4: User Story 2 - License Inherits Default Usage from Plan (P1)

**Goal**: Licenses created from usage-based plans automatically receive currentUsageCount and totalUsageCount equal to plan's defaultUsageCount.

**Independent Test**: Create license for plan with defaultUsageCount=500, verify license has currentUsageCount=500 and totalUsageCount=500. View license details, verify usage counts displayed.

**Acceptance Criteria**:
- ✅ License from usage-based plan has currentUsageCount = plan.defaultUsageCount
- ✅ License from usage-based plan has totalUsageCount = plan.defaultUsageCount
- ✅ License from time-based plan does not have usage tracking fields
- ✅ License details display shows currentUsageCount and totalUsageCount

### Backend Tasks

- [x] T016 [US2] Update createLicense method in api/services/firestore.ts to detect usage-based plan and initialize currentUsageCount/totalUsageCount from plan.defaultUsageCount
- [x] T017 [P] [US2] Ensure createLicense in api/services/firestore.ts does not set usage fields for time-based plans

### Frontend Tasks

- [x] T018 [P] [US2] Update license display in web/pages/Licenses.tsx to show currentUsageCount and totalUsageCount for usage-based licenses
- [x] T019 [P] [US2] Add conditional rendering in web/pages/Licenses.tsx to only show usage counts when license has usage tracking fields

---

## Phase 5: User Story 4 + User Story 5 - Consumption Endpoint with Validation (P1)

**Goal**: Public consumption endpoint allows clients to consume usages. System validates product-id header matches license productId and enforces usage limits atomically.

**Independent Test**: Send consumption request with valid license key and matching product-id header, verify currentUsageCount decreases. Send request with mismatched product-id, verify rejection. Send request consuming more than available, verify rejection.

**Acceptance Criteria**:
- ✅ Consumption request with valid key and matching product-id succeeds
- ✅ Consumption request without product-id header is rejected (400)
- ✅ Consumption request with mismatched product-id is rejected
- ✅ Consumption request with insufficient usages is rejected
- ✅ Consumption request with currentUsageCount=0 is rejected
- ✅ Consumption operation is atomic (transaction prevents race conditions)
- ✅ Consumption is logged in system logs

### Backend Tasks

- [x] T020 [US4] [US5] Create new file api/routes/consume.ts with POST /api/consume endpoint handler
- [x] T021 [US4] [US5] Add product-id header validation in api/routes/consume.ts (required, must match license.productId)
- [x] T022 [US4] [US5] Add consumeUsage method in api/services/firestore.ts using Firestore transaction for atomic consumption
- [x] T023 [US4] [US5] Add license status and expiration validation in consumeUsage method (ACTIVE, not expired, usage-based: currentUsageCount > 0)
- [x] T024 [US4] [US5] Add insufficient usage validation in consumeUsage method (currentUsageCount >= amount)
- [x] T025 [US4] [US5] Add consumption logging in consumeUsage method (CONSUME log event)
- [x] T026 [US4] [US5] Register consume routes as public endpoint in api/index.ts (before protected routes, no auth required)

---

## Phase 6: User Story 3 - Admin Tops Up License Usages (P2)

**Goal**: Admins can add usages to existing ACTIVE licenses. Topup increases both currentUsageCount and totalUsageCount.

**Independent Test**: Topup license with 200 usages, verify currentUsageCount and totalUsageCount both increase by 200. Attempt topup on expired license, verify rejection. View license after topup, verify updated counts displayed.

**Acceptance Criteria**:
- ✅ Topup increases currentUsageCount by amount
- ✅ Topup increases totalUsageCount by amount
- ✅ Topup on expired/cancelled license is rejected
- ✅ Topup on non-usage-based license is rejected
- ✅ Topup with 0 or negative amount is rejected
- ✅ Topup operation is logged
- ✅ License details show updated counts after topup

### Backend Tasks

- [x] T027 [P] [US3] Add POST /api/licenses/:id/topup endpoint in api/routes/licenses.ts
- [x] T028 [US3] Add topupLicense method in api/services/firestore.ts using Firestore transaction for atomic topup
- [x] T029 [P] [US3] Add license status validation in topupLicense method (must be ACTIVE)
- [x] T030 [P] [US3] Add usage-based plan validation in topupLicense method (must have currentUsageCount/totalUsageCount fields)
- [x] T031 [P] [US3] Add topup amount validation in api/routes/licenses.ts (positive integer)
- [x] T032 [P] [US3] Add topup logging in topupLicense method (TOPUP log event)

### Frontend Tasks

- [x] T033 [P] [US3] Add topup API method in web/services/api.ts (POST /api/licenses/:id/topup)
- [x] T034 [P] [US3] Add topup button/action in web/pages/Licenses.tsx (shown only for usage-based ACTIVE licenses)
- [x] T035 [P] [US3] Add topup modal/form in web/pages/Licenses.tsx with amount input
- [x] T036 [P] [US3] Add topup success handling in web/pages/Licenses.tsx (refresh license list, show updated counts)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Finalize implementation, ensure consistency, and handle edge cases.

**Independent Test**: All user stories work together, edge cases handled, UI is consistent.

### Tasks

- [x] T037 Verify backward compatibility: existing time-based plans/licenses continue to work
- [x] T038 Add error handling for edge cases: very large usage counts, concurrent consumption scenarios
- [x] T039 Update API documentation/comments to reflect new endpoints and fields
- [x] T040 Verify type synchronization: api/types.ts and web/types.ts remain in sync
- [x] T041 Manual testing: Create usage-based plan, create license, consume usages, topup license, verify all flows work end-to-end

---

## Parallel Execution Examples

### User Story 1 (Plan Creation)
**Parallel Group A** (Backend):
- T009, T010, T011 can be done in parallel (different validation aspects)

**Parallel Group B** (Frontend):
- T012, T013, T014, T015 can be done in parallel (different UI components)

**Cross-group**: Backend and Frontend can be developed in parallel after T009-T011 complete

### User Story 2 (License Inheritance)
**Parallel Group**:
- T016, T017 (backend service) can be done in parallel with T018, T019 (frontend display)

### User Story 4+5 (Consumption)
**Sequential within story**: T020-T026 must be done in order due to dependencies

### User Story 3 (Topup)
**Parallel Group A** (Backend):
- T027, T028, T029, T030, T031, T032 can be developed together

**Parallel Group B** (Frontend):
- T033, T034, T035, T036 can be developed together

**Cross-group**: Backend and Frontend can be developed in parallel

---

## Task Count Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | 6 | Type definitions |
| Phase 2: Foundational | 2 | Service infrastructure |
| Phase 3: US1 | 7 | Plan creation |
| Phase 4: US2 | 4 | License inheritance |
| Phase 5: US4+US5 | 7 | Consumption endpoint |
| Phase 6: US3 | 10 | Topup functionality |
| Phase 7: Polish | 5 | Finalization |
| **Total** | **41** | |

**By User Story**:
- US1: 7 tasks
- US2: 4 tasks
- US3: 10 tasks
- US4+US5: 7 tasks
- Setup/Foundational: 8 tasks
- Polish: 5 tasks

**MVP Scope** (User Story 1 only): 15 tasks (Phase 1 + Phase 2 + Phase 3)

