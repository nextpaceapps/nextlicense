# Tasks: Fix Delete Product API Request

**Input**: Design documents from `/specs/001-fix-delete-product/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual testing via browser DevTools and UI interaction (no automated test framework currently configured)

**Organization**: Tasks are organized by user story to enable independent verification of each story, though both stories are fixed by the same implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `services/` at repository root
- Paths shown below use actual project structure

---

## Phase 1: Implementation (Fixes Both User Stories)

**Purpose**: Fix the `fetchApi` function to conditionally include Content-Type header only when request body is present. This single fix addresses both User Story 1 (Delete Products) and User Story 2 (Delete Plans) since they share the same `fetchApi` helper function.

**Goal**: Modify `services/api.ts` to fix DELETE request Content-Type header issue

**Independent Test**: After this phase, both product and plan deletion should work without 400 Bad Request errors

### Implementation Tasks

- [x] T001 [US1] [US2] Modify `fetchApi` function in `services/api.ts` to conditionally include `Content-Type: application/json` header only when `options.body` is present

**Checkpoint**: Implementation complete - both DELETE operations (products and plans) should now work correctly

---

## Phase 2: Verification - User Story 1 (Delete Products) (Priority: P1) 🎯 MVP

**Goal**: Verify that product deletion works correctly after the fix

**Independent Test**: Can be fully tested by attempting to delete a product through the Products page UI and verifying the product is removed from the list without errors

### Verification Tasks for User Story 1

- [ ] T002 [US1] Start development server using `npm run dev`
- [ ] T003 [US1] Navigate to Products page in browser
- [ ] T004 [US1] Click delete button on a product and confirm deletion
- [ ] T005 [US1] Verify product is removed from the list without error messages displayed
- [ ] T006 [US1] Check browser DevTools Network tab: Verify DELETE request to `/api/products/{id}` returns 200 or 204 status (not 400)
- [ ] T007 [US1] Verify DELETE request does NOT include `Content-Type: application/json` header in Network tab
- [ ] T008 [US1] Verify DELETE request includes `Authorization: Bearer {token}` header in Network tab
- [ ] T009 [US1] Refresh Products page and verify deleted product no longer appears in the list

**Checkpoint**: User Story 1 verified - product deletion works correctly

---

## Phase 3: Verification - User Story 2 (Delete Plans) (Priority: P1)

**Goal**: Verify that plan deletion works correctly after the fix

**Independent Test**: Can be fully tested by attempting to delete a plan through the Plans page UI and verifying the plan is removed from the list without errors

### Verification Tasks for User Story 2

- [ ] T010 [US2] Navigate to Plans page in browser
- [ ] T011 [US2] Click delete button on a plan and confirm deletion
- [ ] T012 [US2] Verify plan is removed from the list without error messages displayed
- [ ] T013 [US2] Check browser DevTools Network tab: Verify DELETE request to `/api/plans/{id}` returns 200 or 204 status (not 400)
- [ ] T014 [US2] Verify DELETE request does NOT include `Content-Type: application/json` header in Network tab
- [ ] T015 [US2] Verify DELETE request includes `Authorization: Bearer {token}` header in Network tab
- [ ] T016 [US2] Refresh Plans page and verify deleted plan no longer appears in the list

**Checkpoint**: User Story 2 verified - plan deletion works correctly

---

## Phase 4: Regression Testing & Verification

**Purpose**: Ensure the fix does not break existing functionality

### Regression Testing Tasks

- [ ] T017 [P] Verify creating a product (POST request) still works: Navigate to Products page, create new product, verify it appears in list
- [ ] T018 [P] Verify creating a plan (POST request) still works: Navigate to Plans page, create new plan, verify it appears in list
- [ ] T019 [P] Check browser DevTools Network tab: Verify POST requests to `/api/products` and `/api/plans` still include `Content-Type: application/json` header
- [ ] T020 [P] Verify POST requests include request body in Network tab
- [ ] T021 [P] Verify GET requests (loading products, plans, licenses) still work correctly
- [ ] T022 [P] Verify GET requests do not include `Content-Type: application/json` header (unchanged behavior)

**Checkpoint**: All existing functionality verified - no regressions introduced

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and code quality checks

### Polish Tasks

- [ ] T023 Code quality review: Verify TypeScript strict mode compliance in `services/api.ts`
- [ ] T024 Code quality review: Verify explicit error handling is preserved in `services/api.ts`
- [ ] T025 UX consistency audit: Verify existing error messages and user feedback mechanisms remain functional
- [ ] T026 Performance check: Verify no bundle size increase (code reduction, not addition)
- [ ] T027 Performance check: Verify no impact on code splitting or route loading
- [ ] T028 Run quickstart.md validation: Follow all steps in `specs/001-fix-delete-product/quickstart.md` and verify expected behavior
- [ ] T029 Verify edge cases: Test deletion with invalid product ID (should return 404, not 400 due to content-type)
- [ ] T030 Verify edge cases: Test deletion with invalid plan ID (should return 404, not 400 due to content-type)
- [ ] T031 Verify edge cases: Test network failure scenario (should show user-friendly error message)

**Checkpoint**: All polish tasks complete - feature ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Implementation (Phase 1)**: No dependencies - can start immediately
- **Verification - User Story 1 (Phase 2)**: Depends on Phase 1 completion
- **Verification - User Story 2 (Phase 3)**: Depends on Phase 1 completion (can run in parallel with Phase 2)
- **Regression Testing (Phase 4)**: Depends on Phase 1 completion (can run in parallel with Phases 2-3)
- **Polish (Phase 5)**: Depends on all previous phases completion

### User Story Dependencies

- **User Story 1 (P1)**: Fixed by Phase 1 implementation, verified in Phase 2
- **User Story 2 (P1)**: Fixed by Phase 1 implementation (same code change), verified in Phase 3
- Both stories share the same root cause and fix, so one implementation addresses both

### Within Each Phase

- Phase 1: Single implementation task (T001) fixes both stories
- Phase 2: Sequential verification tasks for User Story 1
- Phase 3: Sequential verification tasks for User Story 2
- Phase 4: Parallel regression testing tasks
- Phase 5: Parallel polish tasks

### Parallel Opportunities

- Phase 2 (US1 verification) and Phase 3 (US2 verification) can run in parallel after Phase 1
- All Phase 4 regression testing tasks marked [P] can run in parallel
- All Phase 5 polish tasks marked [P] can run in parallel
- Different verification scenarios can be tested by different team members simultaneously

---

## Parallel Example: After Implementation

```bash
# After Phase 1 completes, these can run in parallel:

# Developer A: Verify User Story 1 (Product deletion)
Task: "Navigate to Products page in browser"
Task: "Click delete button on a product and confirm deletion"
Task: "Verify product is removed from the list without error messages displayed"

# Developer B: Verify User Story 2 (Plan deletion)
Task: "Navigate to Plans page in browser"
Task: "Click delete button on a plan and confirm deletion"
Task: "Verify plan is removed from the list without error messages displayed"

# Developer C: Regression testing
Task: "Verify creating a product (POST request) still works"
Task: "Verify creating a plan (POST request) still works"
Task: "Verify GET requests still work correctly"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Implementation (fixes both stories, but we verify US1 first)
2. Complete Phase 2: Verify User Story 1
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Deploy/demo if ready (product deletion now works)

### Incremental Delivery

1. Complete Phase 1 → Implementation ready (both stories fixed)
2. Add Phase 2 → Verify User Story 1 → Deploy/Demo (MVP - product deletion works!)
3. Add Phase 3 → Verify User Story 2 → Deploy/Demo (plan deletion also works)
4. Add Phase 4 → Regression testing → Verify no regressions
5. Add Phase 5 → Polish → Final verification
6. Each phase adds confidence without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. **Developer A**: Complete Phase 1 (implementation)
2. Once Phase 1 is done:
   - **Developer A**: Phase 2 (Verify User Story 1)
   - **Developer B**: Phase 3 (Verify User Story 2)
   - **Developer C**: Phase 4 (Regression testing)
3. All developers: Phase 5 (Polish together)

---

## Notes

- [P] tasks = different files, no dependencies, can run simultaneously
- [Story] label maps task to specific user story for traceability
- Both user stories are fixed by the same implementation (T001) since they share `fetchApi`
- Each user story should be independently verifiable
- Manual testing via browser DevTools is the primary verification method
- Commit after Phase 1 (implementation) and after each verification phase
- Stop at any checkpoint to validate independently
- Avoid: skipping verification steps, not checking Network tab, not testing edge cases

