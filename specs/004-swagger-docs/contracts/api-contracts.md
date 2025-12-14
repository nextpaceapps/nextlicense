# API Contracts: API Documentation

**Feature**: API Documentation (004-swagger-docs)  
**Date**: 2025-01-27

## Overview

This feature implements API documentation through OpenAPI 3.0 specification generation. The contracts are automatically generated from Fastify route schemas using @fastify/swagger.

## Contract Generation Approach

### Automatic Generation

- **Source**: Fastify route schema definitions
- **Generator**: @fastify/swagger plugin
- **Format**: OpenAPI 3.0 specification
- **Output**: JSON (default) and YAML (via export route)

### Schema Requirements

Each route must define a schema object with:

1. **Metadata**:
   - `description`: What the endpoint does
   - `summary`: Brief endpoint description
   - `tags`: Logical grouping (Products, Plans, Licenses, etc.)

2. **Request Schema**:
   - `params`: Path parameters (e.g., `:id`)
   - `querystring`: Query parameters
   - `body`: Request body structure
   - `headers`: Required headers (e.g., `product-id`)

3. **Response Schema**:
   - `response`: Status code → schema mapping
   - Include success (200, 201, 204) and error (400, 401, 404, 500) responses

4. **Security**:
   - `security`: Array of security schemes (e.g., `[{ bearerAuth: [] }]`)
   - Omit for public endpoints

## Contract Structure

### OpenAPI 3.0 Components

1. **Info Section**: API metadata (title, description, version)
2. **Servers Section**: Base URLs (development, production)
3. **Tags Section**: Logical endpoint groupings
4. **Paths Section**: All API endpoints with request/response schemas
5. **Components Section**:
   - `schemas`: Reusable data structures (Product, Plan, License, etc.)
   - `securitySchemes`: Authentication definitions (Bearer token)
   - `responses`: Reusable error responses

### Endpoint Coverage

All existing endpoints must be documented:

**Products**:
- `GET /api/products`
- `POST /api/products`
- `DELETE /api/products/:id`

**Plans**:
- `GET /api/plans`
- `GET /api/plans/:id`
- `POST /api/plans`
- `DELETE /api/plans/:id`

**Licenses**:
- `GET /api/licenses`
- `GET /api/licenses/key/:key`
- `POST /api/licenses`
- `POST /api/licenses/:id/renew`
- `POST /api/licenses/:id/cancel`
- `POST /api/licenses/:id/topup`

**Validation** (Public):
- `POST /api/validate`

**Consumption** (Public):
- `POST /api/consume`

**Logs**:
- `GET /api/logs`

**Health** (Public):
- `GET /health`

## Authentication Contract

**Security Scheme**: Bearer Token (JWT)
- **Type**: `http`
- **Scheme**: `bearer`
- **Bearer Format**: `JWT`
- **Description**: Firebase ID token authentication

**Application**:
- Applied to all protected endpoints via `security: [{ bearerAuth: [] }]`
- Not applied to public endpoints (`/health`, `/api/validate`, `/api/consume`)

## Export Contracts

### JSON Export

**Endpoint**: `GET /docs/openapi.json`  
**Content-Type**: `application/json`  
**Response**: OpenAPI 3.0 specification in JSON format

### YAML Export

**Endpoint**: `GET /docs/openapi.yaml`  
**Content-Type**: `text/yaml`  
**Response**: OpenAPI 3.0 specification in YAML format

## Contract Validation

### Automatic Validation

- OpenAPI spec generated from route schemas ensures consistency
- Fastify validates requests against schemas at runtime
- Documentation reflects actual API behavior

### Manual Validation

1. Access `/docs` and verify all endpoints listed
2. Test each endpoint interactively
3. Verify request/response schemas match actual API behavior
4. Test authentication requirements
5. Verify export formats are valid OpenAPI 3.0

## Contract Maintenance

### Synchronization

- Contracts automatically sync with code changes (FR-011)
- When route schemas are updated, OpenAPI spec regenerates
- No manual OpenAPI file editing required

### Versioning

- API version tracked in OpenAPI `info.version` field
- Currently: `1.0.0`
- Update when making breaking changes

## Example Contract

See `contracts/openapi-schema-example.yaml` for a complete example of the generated OpenAPI specification structure.
