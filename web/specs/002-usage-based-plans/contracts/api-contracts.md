# API Contracts: Usage-Based Plans and Licenses

**Feature**: 002-usage-based-plans  
**Date**: 2025-12-08  
**Base URL**: `/api`

## Updated Endpoints

### POST /api/plans

**Description**: Create a new plan. Updated to support usage-based plans with `defaultUsageCount`.

**Authentication**: Required (Bearer token)

**Request Body**:

```typescript
{
  productId: string;
  name: string;
  // Usage-based plan fields:
  defaultUsageCount?: number;  // Required for usage-based plans
  // Time-based plan fields:
  durationDays?: number;        // Required for time-based plans
  deviceLimit?: number;        // Required for time-based plans
  features?: string[];
  price?: number;
}
```

**Validation Rules**:
- Plan must be either usage-based OR time-based (mutually exclusive)
- Usage-based: `defaultUsageCount` required (positive integer), `durationDays` and `deviceLimit` must be absent
- Time-based: `durationDays` and `deviceLimit` required (positive integers), `defaultUsageCount` must be absent

**Response**: `201 Created`

```typescript
{
  id: string;
  productId: string;
  name: string;
  defaultUsageCount?: number;
  durationDays?: number;
  deviceLimit?: number;
  features: string[];
  price: number;
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (plan type exclusivity violation, missing required fields, invalid values)
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

### POST /api/licenses

**Description**: Create a new license. Updated to automatically initialize usage counts for usage-based plans.

**Authentication**: Required (Bearer token)

**Request Body**:

```typescript
{
  productId: string;
  planId: string;
  userEmail: string;
}
```

**Response**: `201 Created`

```typescript
{
  id: string;
  key: string;
  productId: string;
  planId: string;
  userEmail: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  issuedAt: string;
  expiresAt: string;
  activations: Activation[];
  currentUsageCount?: number;  // Present for usage-based licenses
  totalUsageCount?: number;    // Present for usage-based licenses
}
```

**Behavior**:
- If plan is usage-based: `currentUsageCount` and `totalUsageCount` are set to `plan.defaultUsageCount`
- If plan is time-based: `currentUsageCount` and `totalUsageCount` are not set

**Error Responses**:
- `400 Bad Request`: Missing required fields, plan not found
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

### POST /api/licenses/:id/topup

**Description**: Add usages to an existing license (NEW endpoint).

**Authentication**: Required (Bearer token)

**Path Parameters**:
- `id`: License ID (string)

**Request Body**:

```typescript
{
  amount: number;  // Positive integer
}
```

**Response**: `200 OK`

```typescript
{
  success: boolean;
  license: {
    id: string;
    currentUsageCount: number;
    totalUsageCount: number;
  };
}
```

**Validation Rules**:
- License must exist
- License status must be ACTIVE
- License must be from usage-based plan (have usage tracking fields)
- `amount` must be positive integer

**Behavior**:
- `currentUsageCount` += `amount`
- `totalUsageCount` += `amount`
- Operation is atomic (transaction)
- Logs TOPUP event

**Error Responses**:
- `400 Bad Request`: Invalid amount, license not from usage-based plan
- `404 Not Found`: License not found
- `409 Conflict`: License not ACTIVE (expired or cancelled)
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

## New Endpoints

### POST /api/consume

**Description**: Consume usages from a license (NEW public endpoint).

**Authentication**: None (public endpoint)

**Request Headers**:
- `product-id`: Product ID (string, required)

**Request Body**:

```typescript
{
  key: string;      // License key
  amount: number;   // Positive integer, number of usages to consume
}
```

**Response**: `200 OK`

```typescript
{
  success: boolean;
  remaining: number;  // Remaining currentUsageCount after consumption
  message: string;
}
```

**Validation Rules**:
- `product-id` header required
- License key must exist
- `product-id` header must match `license.productId`
- License status must be ACTIVE
- License must not be expired:
  - Usage-based: `currentUsageCount > 0`
  - Time-based: `expiresAt > now`
- `currentUsageCount >= amount`
- `amount` must be positive integer

**Behavior**:
- `currentUsageCount` -= `amount`
- Operation is atomic (Firestore transaction)
- If `currentUsageCount` reaches 0, license is considered expired (usage-based)
- Logs CONSUME event

**Error Responses**:
- `400 Bad Request`: Missing product-id header, invalid amount, product mismatch, insufficient usages
- `404 Not Found`: License not found
- `409 Conflict`: License not ACTIVE or expired
- `500 Internal Server Error`: Server error

**Example Request**:

```bash
curl -X POST http://localhost:3001/api/consume \
  -H "Content-Type: application/json" \
  -H "product-id: prod-123" \
  -d '{
    "key": "LICENSE-KEY-HERE",
    "amount": 5
  }'
```

**Example Response**:

```json
{
  "success": true,
  "remaining": 95,
  "message": "Consumed 5 usages successfully"
}
```

---

## Updated Response Types

### Plan Response

```typescript
type Plan = {
  id: string;
  productId: string;
  name: string;
  defaultUsageCount?: number;  // NEW: For usage-based plans
  durationDays?: number;        // For time-based plans
  deviceLimit?: number;        // For time-based plans
  features: string[];
  price: number;
};
```

### License Response

```typescript
type License = {
  id: string;
  key: string;
  productId: string;
  planId: string;
  userEmail: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  issuedAt: string;
  expiresAt: string;
  activations: Activation[];
  currentUsageCount?: number;  // NEW: For usage-based licenses
  totalUsageCount?: number;    // NEW: For usage-based licenses
};
```

### LogEvent Type

```typescript
type LogEvent = {
  id: string;
  timestamp: string;
  type: 'ISSUE' | 'VALIDATE' | 'RENEW' | 'CANCEL' | 'EXPIRE' | 'ERROR' | 'CONSUME' | 'TOPUP';  // NEW types
  details: string;
  relatedId?: string;
};
```

---

## Error Response Format

All error responses follow this format:

```typescript
{
  error: string;  // Human-readable error message
  code?: string; // Optional error code for programmatic handling
}
```

**Common Error Codes**:
- `VALIDATION_ERROR`: Request validation failed
- `PLAN_TYPE_MISMATCH`: Plan type exclusivity violation
- `LICENSE_NOT_FOUND`: License does not exist
- `LICENSE_INACTIVE`: License is not ACTIVE
- `LICENSE_EXPIRED`: License has expired
- `INSUFFICIENT_USAGE`: Not enough usages available
- `PRODUCT_MISMATCH`: product-id header doesn't match license
- `NOT_USAGE_BASED`: License is not from usage-based plan

