# Data Model: API Documentation

**Feature**: API Documentation (004-swagger-docs)  
**Date**: 2025-01-27

## Overview

This feature doesn't introduce new data entities. Instead, it documents the existing API data structures through OpenAPI schemas. The documentation system generates OpenAPI 3.0 specifications from Fastify route schemas.

## API Request/Response Structures

### Product Entity

**Type**: `Product`  
**Fields**:
- `id` (string, required): Unique product identifier
- `name` (string, required): Product name
- `code` (string, required): Product code (unique identifier)
- `description` (string, optional): Product description

**Endpoints**:
- `GET /api/products` - Returns array of Product
- `POST /api/products` - Accepts Product (without id), returns Product with id
- `DELETE /api/products/:id` - Accepts id in path, returns 204 No Content

### Plan Entity

**Type**: `Plan`  
**Fields**:
- `id` (string, required): Unique plan identifier
- `productId` (string, required): Associated product ID
- `name` (string, required): Plan name
- `defaultUsageCount` (number, optional): For usage-based plans only
- `durationDays` (number, optional): For time-based plans only
- `deviceLimit` (number, optional): For time-based plans only
- `features` (string[], required): Array of feature codes
- `price` (number, required): Plan price

**Constraints**:
- Plans must be either usage-based (`defaultUsageCount`) OR time-based (`durationDays`/`deviceLimit`), not both
- Usage-based plans: `defaultUsageCount` required, `durationDays` and `deviceLimit` must be absent
- Time-based plans: `durationDays` and `deviceLimit` required, `defaultUsageCount` must be absent

**Endpoints**:
- `GET /api/plans` - Returns array of Plan
- `GET /api/plans/:id` - Returns single Plan
- `POST /api/plans` - Accepts Plan (without id), returns Plan with id
- `DELETE /api/plans/:id` - Accepts id in path, returns 204 No Content

### License Entity

**Type**: `License`  
**Fields**:
- `id` (string, required): Unique license identifier
- `key` (string, required): License key (unique, used for validation)
- `productId` (string, required): Associated product ID
- `planId` (string, required): Associated plan ID
- `userEmail` (string, required): License owner email
- `status` (LicenseStatus enum, required): ACTIVE, EXPIRED, or CANCELLED
- `issuedAt` (string, required): ISO 8601 timestamp
- `expiresAt` (string, required): ISO 8601 timestamp
- `activations` (Activation[], required): Array of device activations
- `currentUsageCount` (number, optional): For usage-based licenses only
- `totalUsageCount` (number, optional): For usage-based licenses only

**Endpoints**:
- `GET /api/licenses` - Returns array of License
- `GET /api/licenses/key/:key` - Returns single License by key
- `POST /api/licenses` - Accepts { productId, planId, userEmail }, returns License
- `POST /api/licenses/:id/renew` - Returns { success: boolean }
- `POST /api/licenses/:id/cancel` - Returns { success: boolean }
- `POST /api/licenses/:id/topup` - Accepts { amount: number }, returns { success: boolean, license: { id, currentUsageCount, totalUsageCount } }

### Activation Entity

**Type**: `Activation`  
**Fields**:
- `deviceId` (string, required): Unique device identifier
- `activatedAt` (string, required): ISO 8601 timestamp
- `lastUsedAt` (string, required): ISO 8601 timestamp

### Validation Response

**Type**: `ValidationResponse`  
**Fields**:
- `valid` (boolean, required): Whether license is valid
- `message` (string, required): Validation message
- `license` (object, optional): License details (only if valid)
  - `status` (LicenseStatus, required)
  - `productName` (string, required)
  - `planName` (string, required)
  - `expiresAt` (string, required)
  - `features` (string[], required)
  - `daysRemaining` (number, required)

**Endpoints**:
- `POST /api/validate` - Accepts { key: string, deviceId: string }, returns ValidationResponse

### Consumption Request/Response

**Request**:
- `key` (string, required): License key
- `amount` (number, required): Positive integer, amount to consume
- Header: `product-id` (string, required): Product ID for validation

**Response**:
- `success` (boolean, required)
- `remaining` (number, required): Remaining usage count
- `message` (string, required): Success message

**Endpoints**:
- `POST /api/consume` - Public endpoint, accepts consumption request, returns consumption response

### Log Event Entity

**Type**: `LogEvent`  
**Fields**:
- `id` (string, required): Unique log identifier
- `timestamp` (string, required): ISO 8601 timestamp
- `type` (enum, required): ISSUE, VALIDATE, RENEW, CANCEL, EXPIRE, ERROR, CONSUME, TOPUP
- `details` (string, required): Log message
- `relatedId` (string, optional): Related entity ID (license, product, etc.)

**Endpoints**:
- `GET /api/logs` - Accepts query parameter `limit` (number, optional, default: 100), returns array of LogEvent

### Health Check Response

**Type**: HealthStatus  
**Fields**:
- `status` (string, required): "ok"
- `timestamp` (string, required): ISO 8601 timestamp

**Endpoints**:
- `GET /health` - Public endpoint, returns HealthStatus

## Authentication

**Method**: Bearer Token (JWT)  
**Format**: `Authorization: Bearer <token>`  
**Token Source**: Firebase ID tokens  
**Protected Endpoints**: All `/api/products`, `/api/plans`, `/api/licenses`, `/api/logs` routes  
**Public Endpoints**: `/health`, `/api/validate`, `/api/consume`

## Error Response Format

**Standard Error Structure**:
- `error` (string, required): Error message
- `code` (string, optional): Error code (e.g., "VALIDATION_ERROR", "PLAN_TYPE_MISMATCH")
- `hint` (string, optional): Additional hint for debugging

**HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required/failed)
- `404` - Not Found
- `500` - Internal Server Error

## OpenAPI Schema Generation

The documentation system will generate OpenAPI 3.0 schemas from these TypeScript types and Fastify route definitions. Schemas will include:

1. **Components Section**: Reusable schema definitions for Product, Plan, License, etc.
2. **Paths Section**: All API endpoints with request/response schemas
3. **Security Schemes**: Bearer token authentication definition
4. **Tags**: Logical grouping (Products, Plans, Licenses, Validation, Consumption, Logs, Health)
