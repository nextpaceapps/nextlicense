# API Contracts: Fix Delete Product API Request

**Date**: 2025-01-25  
**Feature**: Fix DELETE request Content-Type header issue

## Overview

The API contracts themselves do not change. This document describes the corrected client-side request format to match the backend expectations.

## DELETE /api/products/:id

### Request (Corrected)

```http
DELETE /api/products/{id} HTTP/1.1
Host: licenses-web--license-513ef.europe-west4.hosted.app
Authorization: Bearer {token}
```

**Key Change**: `Content-Type: application/json` header is **NOT** included when no body is present.

### Response

**Success (200 OK or 204 No Content)**:
```http
HTTP/1.1 204 No Content
```

**Error (400 Bad Request)** - Should no longer occur due to content-type issue:
```json
{
  "statusCode": 400,
  "code": "FST_ERR_CTP_EMPTY_JSON_BODY",
  "error": "Bad Request",
  "message": "Body cannot be empty when content-type is set to 'application/json'"
}
```

**Error (404 Not Found)**:
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Product not found"
}
```

## DELETE /api/plans/:id

### Request (Corrected)

```http
DELETE /api/plans/{id} HTTP/1.1
Host: licenses-web--license-513ef.europe-west4.hosted.app
Authorization: Bearer {token}
```

**Key Change**: `Content-Type: application/json` header is **NOT** included when no body is present.

### Response

**Success (200 OK or 204 No Content)**:
```http
HTTP/1.1 204 No Content
```

**Error (400 Bad Request)** - Should no longer occur due to content-type issue:
```json
{
  "statusCode": 400,
  "code": "FST_ERR_CTP_EMPTY_JSON_BODY",
  "error": "Bad Request",
  "message": "Body cannot be empty when content-type is set to 'application/json'"
}
```

**Error (404 Not Found)**:
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Plan not found"
}
```

## Implementation Notes

- All DELETE requests should follow this pattern (no Content-Type header when no body)
- POST/PUT requests with bodies should continue to include `Content-Type: application/json`
- GET requests should not include Content-Type header (unchanged)

