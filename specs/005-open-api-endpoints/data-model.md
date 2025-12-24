# Data Model: Rate Limiting

**Feature**: 005-open-api-endpoints  
**Date**: 2025-01-27

## Entities

### Rate Limit Configuration

**Purpose**: Defines rate limiting parameters loaded from environment variables.

**Fields**:
- `maxRequests` (number): Maximum number of requests allowed per time window (default: 100)
- `windowMs` (number): Time window duration in milliseconds (default: 60000 = 1 minute)
- `cleanupIntervalMs` (number): Interval for cleaning up expired entries in milliseconds (default: 300000 = 5 minutes)

**Validation Rules**:
- `maxRequests` must be a positive integer
- `windowMs` must be a positive integer
- `cleanupIntervalMs` must be a positive integer
- If configuration is missing or invalid, use safe defaults and log warning (FR-015)

**Storage**: In-memory object (loaded at server startup from environment variables)

---

### Rate Limit State

**Purpose**: Tracks current request counts per client identifier within time windows.

**Fields**:
- `clientIdentifier` (string): Composite key `${ip}:${licenseKey}`
- `windowTimestamp` (number): Start timestamp of current window (milliseconds since epoch, rounded to window boundary)
- `requestCount` (number): Number of requests made in current window
- `lastRequestAt` (number): Timestamp of last request (milliseconds since epoch)

**Storage**: In-memory Map
- Key: `${clientIdentifier}:${windowTimestamp}`
- Value: `{ requestCount: number, lastRequestAt: number }`

**Lifecycle**:
- Created: When first request from client in a new window
- Updated: Increment `requestCount` on each request
- Deleted: Automatically cleaned up when window expires (older than current window)

**Validation Rules**:
- `requestCount` cannot exceed `maxRequests` (enforced by middleware)
- `windowTimestamp` must align with window boundaries (calculated as `Math.floor(now / windowMs) * windowMs`)

---

### Client Identifier

**Purpose**: Unique identifier combining IP address and license key for rate limit tracking.

**Format**: `${ipAddress}:${licenseKey}`

**Components**:
- `ipAddress` (string): Client IP address from `request.ip` (Fastify provides this)
- `licenseKey` (string): License key from request body (`request.body.key`)

**Validation Rules**:
- Both IP and license key must be present
- If license key unavailable (shouldn't happen), fallback to IP only
- License key should be masked in logs for security (show only first 8 characters)

**Examples**:
- `192.168.1.1:LICENSE-KEY-12345`
- `10.0.0.5:ABC-DEF-GHI-JKL`

---

## State Transitions

### Rate Limit Check Flow

```
Request arrives
  ↓
Extract IP address (request.ip)
  ↓
Extract license key (request.body.key)
  ↓
Create client identifier: `${ip}:${key}`
  ↓
Calculate current window timestamp
  ↓
Check Map for existing entry: `${identifier}:${windowTimestamp}`
  ↓
If entry exists:
  - Increment requestCount
  - Update lastRequestAt
  - If requestCount > maxRequests: Return 429, log violation
  - Else: Allow request to proceed
  ↓
If entry doesn't exist:
  - Create new entry with requestCount = 1
  - Allow request to proceed
```

### Window Expiration

```
Every cleanupIntervalMs:
  ↓
Get current window timestamp
  ↓
Iterate through Map entries
  ↓
If entry windowTimestamp < current window:
  - Delete entry (expired window)
  ↓
Continue until all entries checked
```

---

## Relationships

- **Rate Limit Configuration** → **Rate Limit State**: Configuration defines limits applied to state
- **Client Identifier** → **Rate Limit State**: Identifier is used as key component in state Map

---

## Data Volume Assumptions

- **Expected clients**: Moderate number of unique IP + License Key combinations
- **Memory usage**: ~100 bytes per active client per window
- **Cleanup**: Expired windows automatically removed, preventing unbounded growth
- **Peak load**: Assume 1000 unique clients simultaneously = ~100KB memory (negligible)

---

## Notes

- All data is transient (in-memory only, lost on server restart)
- No persistence required (rate limits reset on server restart, acceptable behavior)
- Thread-safe: Node.js single-threaded event loop ensures no race conditions
- No database or external storage needed (keeps implementation simple)

