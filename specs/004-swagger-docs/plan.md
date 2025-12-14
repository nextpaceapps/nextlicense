# Implementation Plan: API Documentation

**Branch**: `004-swagger-docs` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-swagger-docs/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement comprehensive API documentation system using @fastify/swagger and @fastify/swagger-ui that automatically generates OpenAPI 3.0 specifications from Fastify route schemas, serves interactive documentation at `/docs` route, provides Bearer token authentication for testing protected endpoints, and supports export in OpenAPI JSON and YAML formats. Documentation automatically synchronizes with API code changes, ensuring accuracy and eliminating manual maintenance.

## Technical Context

**Language/Version**: TypeScript 5.8.2  
**Primary Dependencies**: 
- Fastify 5.1.0 (existing)
- @fastify/swagger 9.x (OpenAPI spec generation)
- @fastify/swagger-ui latest (Swagger UI interface)
- js-yaml (optional, for YAML export)  
**Storage**: N/A (documentation generated from code, no persistent storage needed)  
**Testing**: Manual validation (no test framework currently configured for API)  
**Target Platform**: Node.js server (API), Web browser (documentation UI)  
**Project Type**: web (API backend)  
**Performance Goals**: 
- Documentation load time: <3 seconds (SC-010)
- Documentation generation: Spec generated on server start, cached in memory
- Interactive testing: Real-time API responses  
**Constraints**: 
- Must auto-sync with API code changes (FR-011) - achieved via dynamic mode
- Must serve from same API server at `/docs` route (FR-020)
- Must support OpenAPI JSON and YAML export (FR-019)
- Must support manual Bearer token entry for interactive testing (FR-016)
- Node.js ≥18.17.0 required for @fastify/swagger 9.x  
**Scale/Scope**: 
- All existing API endpoints (products, plans, licenses, validation, consume, logs, health)
- Documentation accessible to external developers
- Interactive testing for 80%+ of endpoints (SC-006)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Phase 0 Status**: ✅ Passed
- Constitution file appears to be a template. No specific gates identified. Proceeding with standard best practices:
- **Code Quality**: Documentation auto-generated from code ensures accuracy and maintainability
- **TypeScript Strictness**: Must maintain strict TypeScript compliance in API codebase
- **Architecture Separation**: Documentation feature spans API layer only (no frontend changes required)
- **Simplicity**: Use established Swagger/OpenAPI tooling rather than custom documentation system

**Post-Phase 1 Status**: ✅ Passed
- **Technology Selection**: Using official @fastify/swagger and @fastify/swagger-ui plugins (maintained by Fastify org)
- **Architecture**: Documentation served from same API server, no separate services required
- **Type Safety**: OpenAPI schemas generated from TypeScript types and Fastify route schemas
- **Maintainability**: Auto-sync with code changes eliminates manual documentation maintenance
- **Simplicity**: Leverages existing Fastify schema system, minimal code changes required

## Project Structure

### Documentation (this feature)

```text
specs/004-swagger-docs/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-contracts.md
│   └── openapi-schema-example.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
api/
├── index.ts             # Update: Register @fastify/swagger and @fastify/swagger-ui
├── routes/
│   ├── products.ts     # Update: Add OpenAPI schemas to routes
│   ├── plans.ts        # Update: Add OpenAPI schemas to routes
│   ├── licenses.ts      # Update: Add OpenAPI schemas to routes
│   ├── validation.ts   # Update: Add OpenAPI schemas to routes
│   ├── consume.ts      # Update: Add OpenAPI schemas to routes
│   └── logs.ts         # Update: Add OpenAPI schemas to routes
├── package.json         # Update: Add @fastify/swagger and @fastify/swagger-ui dependencies
└── types.ts             # Existing: TypeScript types (used for schema generation)
```

**Structure Decision**: This is a web application with API backend. The documentation feature only affects the `api/` directory. No frontend changes are required. Documentation is served from the same API server at `/docs` route.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
