# Tasks: API Documentation

**Input**: Design documents from `/specs/004-swagger-docs/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Tests are NOT explicitly requested in the feature specification, so test tasks are excluded. Manual validation is expected per the plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and verify environment

- [x] T001 Install @fastify/swagger package in api/package.json
- [x] T002 [P] Install @fastify/swagger-ui package in api/package.json
- [x] T003 [P] Verify Node.js version is ≥18.17.0 for @fastify/swagger 9.x compatibility

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Swagger plugin registration that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Register @fastify/swagger plugin with OpenAPI configuration in api/index.ts
- [x] T005 Register @fastify/swagger-ui plugin with route prefix `/docs` in api/index.ts
- [x] T006 Configure OpenAPI info section (title, description, version) in api/index.ts
- [x] T007 [P] Configure OpenAPI servers section (local development URL) in api/index.ts
- [x] T008 [P] Configure OpenAPI tags section (Products, Plans, Licenses, Validation, Consumption, Logs, Health) in api/index.ts
- [x] T009 Configure OpenAPI security schemes (Bearer token authentication) in api/index.ts

**Checkpoint**: Foundation ready - Swagger plugins registered and configured. User story implementation can now begin.

---

## Phase 3: User Story 1 - Discover API Endpoints (Priority: P1) 🎯 MVP

**Goal**: Documentation lists all available API endpoints with clear descriptions, organized by functional area.

**Independent Test**: Access `http://localhost:3001/docs` and verify that all API endpoints (products, plans, licenses, validation, consume, logs, health) are listed with clear descriptions of their purpose.

### Implementation for User Story 1

- [x] T010 [US1] Add OpenAPI schema to GET /api/products route with description and tags in api/routes/products.ts
- [x] T011 [US1] Add OpenAPI schema to POST /api/products route with description and tags in api/routes/products.ts
- [x] T012 [US1] Add OpenAPI schema to DELETE /api/products/:id route with description and tags in api/routes/products.ts
- [x] T013 [P] [US1] Add OpenAPI schema to GET /api/plans route with description and tags in api/routes/plans.ts
- [x] T014 [P] [US1] Add OpenAPI schema to GET /api/plans/:id route with description and tags in api/routes/plans.ts
- [x] T015 [P] [US1] Add OpenAPI schema to POST /api/plans route with description and tags in api/routes/plans.ts
- [x] T016 [P] [US1] Add OpenAPI schema to DELETE /api/plans/:id route with description and tags in api/routes/plans.ts
- [x] T017 [P] [US1] Add OpenAPI schema to GET /api/licenses route with description and tags in api/routes/licenses.ts
- [x] T018 [P] [US1] Add OpenAPI schema to GET /api/licenses/key/:key route with description and tags in api/routes/licenses.ts
- [x] T019 [P] [US1] Add OpenAPI schema to POST /api/licenses route with description and tags in api/routes/licenses.ts
- [x] T020 [P] [US1] Add OpenAPI schema to POST /api/licenses/:id/renew route with description and tags in api/routes/licenses.ts
- [x] T021 [P] [US1] Add OpenAPI schema to POST /api/licenses/:id/cancel route with description and tags in api/routes/licenses.ts
- [x] T022 [P] [US1] Add OpenAPI schema to POST /api/licenses/:id/topup route with description and tags in api/routes/licenses.ts
- [x] T023 [P] [US1] Add OpenAPI schema to POST /api/validate route with description and tags in api/routes/validation.ts
- [x] T024 [P] [US1] Add OpenAPI schema to POST /api/consume route with description and tags in api/routes/consume.ts
- [x] T025 [P] [US1] Add OpenAPI schema to GET /api/logs route with description and tags in api/routes/logs.ts
- [x] T026 [US1] Add OpenAPI schema to GET /health route with description and tags in api/index.ts
- [ ] T027 [US1] Verify all endpoints appear in documentation at /docs route (manual validation)

**Checkpoint**: At this point, User Story 1 should be fully functional. All endpoints are listed in documentation with descriptions.

---

## Phase 4: User Story 2 - Understand Request and Response Formats (Priority: P1)

**Goal**: Documentation shows complete request/response schemas with data types, validation rules, and example payloads.

**Independent Test**: Examine documentation for any endpoint and verify that request parameters, request body schemas, response schemas, and example payloads are clearly documented.

### Implementation for User Story 2

- [x] T028 [US2] Add request body schema to POST /api/products route (name, code, description) in api/routes/products.ts
- [x] T029 [US2] Add response schemas (200, 201, 400, 401, 500) to POST /api/products route in api/routes/products.ts
- [x] T030 [US2] Add response schema (200 array) to GET /api/products route in api/routes/products.ts
- [x] T031 [US2] Add path parameter schema (id) to DELETE /api/products/:id route in api/routes/products.ts
- [x] T032 [P] [US2] Add request body schema to POST /api/plans route (productId, name, defaultUsageCount/durationDays/deviceLimit, features, price) in api/routes/plans.ts
- [x] T033 [P] [US2] Add response schemas to POST /api/plans route in api/routes/plans.ts
- [x] T034 [P] [US2] Add path parameter schema (id) to GET /api/plans/:id route in api/routes/plans.ts
- [x] T035 [P] [US2] Add response schemas to GET /api/plans/:id route in api/routes/plans.ts
- [x] T036 [P] [US2] Add request body schema to POST /api/licenses route (productId, planId, userEmail) in api/routes/licenses.ts
- [x] T037 [P] [US2] Add response schemas to POST /api/licenses route in api/routes/licenses.ts
- [x] T038 [P] [US2] Add path parameter schema (key) to GET /api/licenses/key/:key route in api/routes/licenses.ts
- [x] T039 [P] [US2] Add request body schema to POST /api/licenses/:id/topup route (amount) in api/routes/licenses.ts
- [x] T040 [P] [US2] Add response schemas to POST /api/licenses/:id/topup route in api/routes/licenses.ts
- [x] T041 [P] [US2] Add request body schema to POST /api/validate route (key, deviceId) in api/routes/validation.ts
- [x] T042 [P] [US2] Add response schemas to POST /api/validate route in api/routes/validation.ts
- [x] T043 [P] [US2] Add request body schema to POST /api/consume route (key, amount) in api/routes/consume.ts
- [x] T044 [P] [US2] Add header parameter schema (product-id) to POST /api/consume route in api/routes/consume.ts
- [x] T045 [P] [US2] Add response schemas to POST /api/consume route in api/routes/consume.ts
- [x] T046 [P] [US2] Add query parameter schema (limit) to GET /api/logs route in api/routes/logs.ts
- [x] T047 [P] [US2] Add response schemas to GET /api/logs route in api/routes/logs.ts
- [x] T048 [US2] Add example request payloads to all POST endpoints that accept request bodies (products, plans, licenses, validate, consume, topup) in respective route files
- [x] T049 [US2] Add example response payloads to all endpoints in respective route files
- [ ] T050 [US2] Verify request/response schemas display correctly in documentation (manual validation)

**Checkpoint**: At this point, User Story 2 should be fully functional. All endpoints have complete request/response schemas with examples.

---

## Phase 5: User Story 3 - Understand Authentication Requirements (Priority: P1)

**Goal**: Documentation clearly indicates which endpoints require authentication and how to authenticate.

**Independent Test**: Examine documentation and verify that authentication requirements are clearly indicated for each endpoint, with instructions on how to authenticate.

### Implementation for User Story 3

- [x] T051 [US3] Add security requirement (bearerAuth) to all protected endpoint schemas (products, plans, licenses, logs) in respective route files
- [x] T052 [US3] Verify public endpoints (health, validate, consume) do NOT have security requirement in respective route files
- [x] T053 [US3] Add authentication documentation description to OpenAPI info section explaining Bearer token format in api/index.ts
- [ ] T054 [US3] Verify Swagger UI displays lock icon on protected endpoints (manual validation)
- [ ] T055 [US3] Verify Swagger UI shows "Authorize" button for Bearer token entry (manual validation)
- [ ] T056 [US3] Verify public endpoints show no lock icon in documentation (manual validation)

**Checkpoint**: At this point, User Story 3 should be fully functional. Authentication requirements are clearly indicated for all endpoints.

---

## Phase 6: User Story 4 - Test API Endpoints Interactively (Priority: P2)

**Goal**: Developers can test API endpoints directly from the documentation interface with real API responses.

**Independent Test**: Use the documentation interface to make test requests to various endpoints and verify that requests are sent and responses are displayed correctly.

### Implementation for User Story 4

- [x] T057 [US4] Configure Swagger UI to enable interactive testing in api/index.ts (uiConfig options)
- [ ] T058 [US4] Verify Swagger UI "Try it out" button is available for all endpoints (manual validation)
- [ ] T059 [US4] Test interactive request for GET /api/products endpoint with Bearer token (manual validation)
- [ ] T060 [US4] Test interactive request for POST /api/products endpoint with request body (manual validation)
- [ ] T061 [US4] Test interactive request for POST /api/validate endpoint (public, no auth) (manual validation)
- [ ] T062 [US4] Test interactive request for POST /api/consume endpoint with product-id header (manual validation)
- [ ] T063 [US4] Verify response display shows status code, headers, and response body (manual validation)
- [ ] T064 [US4] Test error response display (400, 401, 500) for various endpoints (manual validation)
- [ ] T065 [US4] Verify Bearer token entered in "Authorize" button is included in request headers (manual validation)

**Checkpoint**: At this point, User Story 4 should be fully functional. Developers can test at least 80% of endpoints interactively.

---

## Phase 7: User Story 5 - Share Documentation with Other Projects (Priority: P1)

**Goal**: Documentation is accessible via shareable URL and can be exported in OpenAPI JSON and YAML formats.

**Independent Test**: Access documentation via shareable URL and verify that it can be accessed by others, exported, or referenced from other systems.

### Implementation for User Story 5

- [x] T066 [US5] Add route to serve OpenAPI JSON at /docs/openapi.json in api/index.ts
- [x] T067 [P] [US5] Install js-yaml package for YAML export in api/package.json
- [x] T068 [US5] Add route to serve OpenAPI YAML at /docs/openapi.yaml in api/index.ts
- [ ] T069 [US5] Verify /docs/openapi.json returns valid OpenAPI 3.0 JSON (manual validation)
- [ ] T070 [US5] Verify /docs/openapi.yaml returns valid OpenAPI 3.0 YAML (manual validation)
- [ ] T071 [US5] Verify documentation URL is shareable (e.g., http://localhost:3001/docs) (manual validation)
- [ ] T072 [US5] Test exported OpenAPI JSON can be imported into other tools (Postman, Insomnia, etc.) (manual validation)
- [ ] T073 [US5] Test exported OpenAPI YAML can be imported into other tools (manual validation)
- [ ] T074 [US5] Verify documentation automatically reflects API changes when routes are updated (manual validation)

**Checkpoint**: At this point, User Story 5 should be fully functional. Documentation is shareable and exportable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T075 [P] Verify all endpoints have complete schemas (request, response, parameters) in all route files
- [x] T076 [P] Add detailed descriptions to all endpoint schemas for better clarity in all route files
- [ ] T077 Verify documentation load time is under 3 seconds (SC-010) (manual validation)
- [ ] T078 Verify 100% of API endpoints are documented (SC-003) (manual validation)
- [ ] T079 Verify authentication requirements are clearly indicated for 100% of endpoints (SC-008) (manual validation)
- [ ] T080 Run quickstart.md validation steps to ensure implementation matches guide
- [x] T081 Update API README.md with documentation URL and usage instructions in api/README.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Builds on US1 (adds schemas to routes from US1)
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Builds on US1/US2 (adds security to existing schemas)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on Swagger UI being functional (from Foundational)
- **User Story 5 (P1)**: Can start after Foundational (Phase 2) - Adds export routes, independent of other stories

### Within Each User Story

- Core implementation before validation
- Schema additions before testing
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- Route schema additions marked [P] can run in parallel (different route files)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all route schema additions for User Story 1 together (different files):
Task: "Add OpenAPI schema to GET /api/plans route in api/routes/plans.ts"
Task: "Add OpenAPI schema to GET /api/licenses route in api/routes/licenses.ts"
Task: "Add OpenAPI schema to POST /api/validate route in api/routes/validation.ts"
Task: "Add OpenAPI schema to POST /api/consume route in api/routes/consume.ts"
Task: "Add OpenAPI schema to GET /api/logs route in api/routes/logs.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all request/response schema additions together (different files):
Task: "Add request body schema to POST /api/plans route in api/routes/plans.ts"
Task: "Add request body schema to POST /api/licenses route in api/routes/licenses.ts"
Task: "Add request body schema to POST /api/validate route in api/routes/validation.ts"
Task: "Add request body schema to POST /api/consume route in api/routes/consume.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - verify all endpoints are listed
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - endpoints listed)
3. Add User Story 2 → Test independently → Deploy/Demo (schemas complete)
4. Add User Story 3 → Test independently → Deploy/Demo (auth requirements clear)
5. Add User Story 5 → Test independently → Deploy/Demo (shareable/exportable)
6. Add User Story 4 → Test independently → Deploy/Demo (interactive testing)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (add schemas to products, plans routes)
   - Developer B: User Story 1 (add schemas to licenses, validation routes)
   - Developer C: User Story 1 (add schemas to consume, logs routes)
3. After User Story 1:
   - Developer A: User Story 2 (request/response schemas for products, plans)
   - Developer B: User Story 2 (request/response schemas for licenses, validation)
   - Developer C: User Story 3 (security requirements) + User Story 5 (export routes)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Manual validation required (no automated tests per plan)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Route schema additions can be done incrementally - start with one route module, then expand

---

## Summary

**Total Tasks**: 81
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 6 tasks
- **Phase 3 (User Story 1)**: 18 tasks
- **Phase 4 (User Story 2)**: 23 tasks
- **Phase 5 (User Story 3)**: 6 tasks
- **Phase 6 (User Story 4)**: 9 tasks
- **Phase 7 (User Story 5)**: 9 tasks
- **Phase 8 (Polish)**: 7 tasks

**Parallel Opportunities**: Many route schema tasks can run in parallel (different files)

**Suggested MVP Scope**: Phases 1-3 (Setup + Foundational + User Story 1) - Basic endpoint listing

**Independent Test Criteria**:
- US1: All endpoints listed in documentation
- US2: Request/response schemas visible for all endpoints
- US3: Authentication requirements clearly indicated
- US4: Interactive testing works for 80%+ endpoints
- US5: Documentation accessible and exportable
