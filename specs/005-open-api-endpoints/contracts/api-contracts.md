# API Contracts: Rate Limiting for Public Endpoints

**Feature**: 005-open-api-endpoints  
**Date**: 2025-01-27  
**Base URL**: `/api`

## Updated Endpoints

### POST /api/validate

**Description**: Validate a license key and register device activation. Now includes rate limiting.

**Authentication**: Not required (public endpoint)

**Rate Limiting**: 
- Limit: 100 requests per minute per client (IP address + License Key combination)
- Window: 1 minute (fixed window)
- Applied: Before request processing

**Request Body**:

```typescript
{
  key: string;        // License key (required)
  deviceId: string;   // Device identifier (required)
}
```

**Response**: `200 OK` (if within rate limit)

```typescript
{
  valid: boolean;
  message: string;
  license?: {
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    productName: string;
    planName: string;
    expiresAt: string;  // ISO 8601 date-time
    features: string[];
    daysRemaining: number;
  };
}
```

**Rate Limit Exceeded Response**: `429 Too Many Requests`

```typescript
{
  error: "Rate limit exceeded";
  code: "RATE_LIMIT_EXCEEDED";
  retryAfter: number;  // Seconds until next window
}
```

**Headers**:
- `Retry-After: <seconds>` - Time until rate limit resets

**Error Responses**:
- `400 Bad Request`: Missing required fields (key, deviceId)
- `429 Too Many Requests`: Rate limit exceeded (new)
- `500 Internal Server Error`: Server error

---

### POST /api/consume

**Description**: Consume a specified amount of usage from a usage-based license. Now includes rate limiting.

**Authentication**: Not required (public endpoint)

**Rate Limiting**: 
- Limit: 100 requests per minute per client (IP address + License Key combination)
- Window: 1 minute (fixed window)
- Applied: Before request processing

**Request Headers**:
- `product-id` (string, required): Product ID for validation

**Request Body**:

```typescript
{
  key: string;    // License key (required)
  amount: number; // Amount to consume (required, positive integer)
}
```

**Response**: `200 OK` (if within rate limit)

```typescript
{
  success: boolean;
  remaining: number;  // Remaining usage count
  message: string;
}
```

**Rate Limit Exceeded Response**: `429 Too Many Requests`

```typescript
{
  error: "Rate limit exceeded";
  code: "RATE_LIMIT_EXCEEDED";
  retryAfter: number;  // Seconds until next window
}
```

**Headers**:
- `Retry-After: <seconds>` - Time until rate limit resets

**Error Responses**:
- `400 Bad Request`: Missing required fields, invalid amount, or insufficient credits
- `429 Too Many Requests`: Rate limit exceeded (new)
- `500 Internal Server Error`: Server error

---

## Rate Limiting Behavior

### Client Identification

Rate limits are applied per unique combination of:
- **IP Address**: Extracted from `request.ip` (Fastify provides this automatically)
- **License Key**: Extracted from request body (`request.body.key`)

**Identifier Format**: `${ipAddress}:${licenseKey}`

**Examples**:
- Client at `192.168.1.1` with key `LICENSE-123` → Identifier: `192.168.1.1:LICENSE-123`
- Client at `192.168.1.1` with key `LICENSE-456` → Identifier: `192.168.1.1:LICENSE-456` (different limit)
- Client at `10.0.0.5` with key `LICENSE-123` → Identifier: `10.0.0.5:LICENSE-123` (different limit)

### Rate Limit Window

- **Algorithm**: Fixed window
- **Duration**: 1 minute (60000 milliseconds)
- **Window Boundaries**: Aligned to minute boundaries (e.g., 0:00-0:59, 1:00-1:59)
- **Reset**: Counters reset at window boundaries

### Rate Limit Response

When rate limit is exceeded:
- **Status Code**: `429 Too Many Requests`
- **Response Body**: JSON with error message, code, and retryAfter
- **Retry-After Header**: Seconds until current window expires
- **Logging**: Rate limit violation logged with masked license key

### Configuration

Rate limiting is configurable via environment variables:
- `RATE_LIMIT_MAX_REQUESTS` (default: 100): Maximum requests per window
- `RATE_LIMIT_WINDOW_MS` (default: 60000): Window duration in milliseconds

If configuration is missing or invalid, safe defaults are used and a warning is logged.

---

## Notes

- Rate limiting is applied **before** request processing (in `preHandler` hook)
- Rate limit violations are logged for monitoring (FR-013)
- Rate limiting does not interfere with legitimate requests within limits (FR-014)
- In-memory storage means rate limits are per-server-instance (not shared across instances)
- Rate limits reset on server restart (acceptable behavior for this use case)

