# Tasks: Firebase Token Authentication

**Input**: Design documents from `/specs/003-firebase-auth/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Tests are NOT explicitly requested in the feature specification, so test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment configuration and project setup

- [x] T001 Configure environment variables for dev login bypass in api/.env.local
- [x] T002 [P] Verify Firebase Admin SDK credentials configuration in api/
- [x] T003 [P] Verify Firebase Authentication configuration in web/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core authentication middleware that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Update authentication middleware with generic error messages in api/middleware/auth.ts
- [x] T005 Add dev login bypass logic to authentication middleware in api/middleware/auth.ts
- [x] T006 Add authentication failure logging in api/middleware/auth.ts

**Checkpoint**: Foundation ready - API authentication middleware updated. User story implementation can now begin.

---

## Phase 3: User Story 2 - API Token Validation (Priority: P1) 🎯 MVP

**Goal**: API server validates Firebase authentication tokens on all protected endpoints to ensure only authenticated users can access sensitive operations.

**Independent Test**: Send API requests to protected endpoints with valid tokens, invalid tokens, expired tokens, and no tokens. Only valid tokens should succeed. All failures return 401 with generic "Authentication failed" message.

### Implementation for User Story 2

- [x] T007 [US2] Verify protected routes are using authentication middleware in api/index.ts
- [ ] T008 [US2] Test authentication middleware with valid Firebase token (requires manual testing or test suite)
- [ ] T009 [US2] Test authentication middleware with missing Authorization header (requires manual testing or test suite)
- [ ] T010 [US2] Test authentication middleware with malformed Authorization header (requires manual testing or test suite)
- [ ] T011 [US2] Test authentication middleware with invalid token (requires manual testing or test suite)
- [ ] T012 [US2] Test authentication middleware with expired token (requires manual testing or test suite)
- [ ] T013 [US2] Test authentication middleware error handling for Firebase Admin SDK initialization failures (requires manual testing or test suite)
- [ ] T014 [US2] Test authentication middleware error handling for network errors during token verification (requires manual testing or test suite)
- [x] T015 [US2] Verify all protected endpoints (products, plans, licenses, logs) require authentication (verified in code)
- [x] T016 [US2] Verify public endpoints (validation, consumption) remain accessible without authentication (verified in code)

**Checkpoint**: At this point, User Story 2 should be fully functional. API validates tokens correctly and returns appropriate 401 responses for all failure scenarios.

---

## Phase 4: User Story 1 - Authenticated API Access (Priority: P1) 🎯 MVP

**Goal**: Web application automatically includes Firebase ID tokens in API requests to protected endpoints when user is logged in.

**Independent Test**: Log in via the web application, then make any API request to a protected endpoint (e.g., fetching products). The request should succeed with the token automatically included, and fail if the token is missing or invalid.

### Implementation for User Story 1

- [x] T017 [US1] Update API client to retrieve Firebase ID token from authenticated user in web/services/api.ts
- [x] T018 [US1] Update API client to include Authorization header with Bearer token in web/services/api.ts
- [x] T019 [US1] Update API client to handle dev login mode (include X-Dev-Login header) in web/services/api.ts
- [x] T020 [US1] Update AuthContext to track dev login state in web/contexts/AuthContext.tsx
- [x] T021 [US1] Export dev login state from AuthContext for API client use in web/contexts/AuthContext.tsx
- [ ] T022 [US1] Test API client includes token when user is logged in (requires manual testing or test suite)
- [ ] T023 [US1] Test API client does not include token when user is not logged in (requires manual testing or test suite)
- [ ] T024 [US1] Test API client includes X-Dev-Login header when dev login is active (requires manual testing or test suite)
- [ ] T025 [US1] Verify protected endpoint requests succeed with valid token (requires manual testing or test suite)
- [ ] T026 [US1] Verify protected endpoint requests fail with 401 when not logged in (requires manual testing or test suite)

**Checkpoint**: At this point, User Story 1 should be fully functional. Web application automatically includes tokens in API requests, and requests succeed when authenticated.

---

## Phase 5: User Story 3 - Web Application Token Management (Priority: P2)

**Goal**: Web application handles authentication tokens seamlessly, including automatic token refresh on expiration, error handling for authentication failures, and proper user feedback when authentication is required.

**Independent Test**: Monitor token behavior during normal usage, simulate token expiration, and verify that the application handles authentication errors gracefully with appropriate user feedback.

### Implementation for User Story 3

- [x] T027 [US3] Implement token refresh on 401 error in web/services/api.ts
- [x] T028 [US3] Add retry logic for failed requests after token refresh in web/services/api.ts
- [x] T029 [US3] Implement redirect to login when token refresh fails in web/services/api.ts
- [x] T030 [US3] Add user-friendly error messages for authentication failures in web/services/api.ts
- [ ] T031 [US3] Test automatic token refresh when token expires during API request (requires manual testing or test suite)
- [ ] T032 [US3] Test token refresh failure handling (redirect to login) (requires manual testing or test suite)
- [ ] T033 [US3] Test error message display when user is not logged in (requires manual testing or test suite)
- [ ] T034 [US3] Test no token sent when user logs out (requires manual testing or test suite)
- [ ] T035 [US3] Verify token refresh occurs automatically without user intervention (requires manual testing or test suite)

**Checkpoint**: At this point, User Story 3 should be fully functional. Token refresh works automatically, errors are handled gracefully, and users receive appropriate feedback.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T036 [P] Verify all authentication failures are logged with detailed information (per FR-010) - Implemented in middleware
- [x] T037 [P] Verify generic error messages are returned for all authentication failures (per FR-004) - Implemented in middleware
- [x] T038 [P] Verify dev login bypass only works in development environment - Implemented with NODE_ENV check
- [x] T039 [P] Verify dev login bypass is disabled in production - Implemented with NODE_ENV check
- [ ] T040 [P] Run quickstart.md validation scenarios (requires manual testing)
- [ ] T041 [P] Verify performance goals: 401 responses within 1 second (SC-005) (requires performance testing)
- [ ] T042 [P] Verify performance goals: Authentication failures handled within 2 seconds (SC-003) (requires performance testing)
- [x] T043 [P] Code review and cleanup - Linter checks passed
- [x] T044 [P] Update documentation if needed - Implementation complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 2 (Phase 3) can start immediately after Foundational
  - User Story 1 (Phase 4) can start after Foundational (can run in parallel with US2)
  - User Story 3 (Phase 5) depends on User Story 1 completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Can run in parallel with US2
- **User Story 3 (P2)**: Depends on User Story 1 completion - Needs token inclusion working before implementing refresh

### Within Each User Story

- Core implementation before testing
- Implementation before integration verification
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel (different directories)
- **Phase 2**: All tasks are sequential (same file)
- **Phase 3 (US2)**: Testing tasks T008-T016 can be done in parallel after implementation
- **Phase 4 (US1)**: T017, T018, T019 can be done in parallel (different parts of same file, but sequential is safer)
- **Phase 5 (US3)**: T031-T035 can be done in parallel (different test scenarios)
- **Phase 6**: All tasks marked [P] can run in parallel

### Story Execution Strategy

**Option 1: Sequential (Recommended for MVP)**
1. Complete Setup + Foundational
2. Complete User Story 2 (API validation)
3. Complete User Story 1 (Web token inclusion)
4. Complete User Story 3 (Token management)
5. Polish

**Option 2: Parallel (If multiple developers)**
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (API validation)
   - Developer B: User Story 1 (Web token inclusion) - can start in parallel
3. After US1 completes:
   - Developer C: User Story 3 (Token management)
4. All complete: Polish phase

---

## Parallel Example: User Story 2

```bash
# After implementation, test all scenarios in parallel:
Task: "Test authentication middleware with valid Firebase token"
Task: "Test authentication middleware with missing Authorization header"
Task: "Test authentication middleware with malformed Authorization header"
Task: "Test authentication middleware with invalid token"
Task: "Test authentication middleware with expired token"
```

---

## Parallel Example: User Story 3

```bash
# Test all token management scenarios in parallel:
Task: "Test automatic token refresh when token expires during API request"
Task: "Test token refresh failure handling (redirect to login)"
Task: "Test error message display when user is not logged in"
Task: "Test no token sent when user logs out"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 - Both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 2 (API validation)
4. Complete Phase 4: User Story 1 (Web token inclusion)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 2 → Test independently → API validates tokens (MVP part 1)
3. Add User Story 1 → Test independently → Web includes tokens (MVP part 2)
4. Add User Story 3 → Test independently → Token refresh works (Enhancement)
5. Polish → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (API validation)
   - Developer B: User Story 1 (Web token inclusion) - can start in parallel
3. After US1 completes:
   - Developer C: User Story 3 (Token management)
4. All complete: Polish phase together

---

## Notes

- [P] tasks = different files or independent test scenarios, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- User Stories 1 and 2 are both P1 and can be considered MVP together
- User Story 3 is P2 and adds token refresh functionality

---

## Task Summary

- **Total Tasks**: 44
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 3 tasks
- **Phase 3 (US2 - API Validation)**: 10 tasks
- **Phase 4 (US1 - Web Token Inclusion)**: 10 tasks
- **Phase 5 (US3 - Token Management)**: 9 tasks
- **Phase 6 (Polish)**: 9 tasks

**Parallel Opportunities**: 
- Phase 1: 2 parallel tasks
- Phase 3: 9 parallel test tasks (after implementation)
- Phase 5: 5 parallel test tasks
- Phase 6: 9 parallel validation tasks

**Suggested MVP Scope**: Phases 1-4 (Setup, Foundational, US2, US1) - This delivers complete authentication functionality. Phase 5 (US3) adds token refresh enhancement.

