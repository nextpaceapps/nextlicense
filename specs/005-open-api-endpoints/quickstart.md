# Quickstart: Implementing Rate Limiting for Public Endpoints

**Feature**: 005-open-api-endpoints  
**Date**: 2025-01-27

## Overview

This guide provides step-by-step instructions for implementing rate limiting on the public endpoints `/api/validate` and `/api/consume`.

## Implementation Steps

### 1. Create Rate Limiting Middleware

Create `api/middleware/rateLimit.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  cleanupIntervalMs: number;
}

interface RateLimitEntry {
  requestCount: number;
  lastRequestAt: number;
}

class RateLimiter {
  private config: RateLimitConfig;
  private state: Map<string, RateLimitEntry>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Load configuration from environment variables with safe defaults
    this.config = {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      cleanupIntervalMs: parseInt(process.env.RATE_LIMIT_CLEANUP_INTERVAL_MS || '300000', 10),
    };

    // Validate configuration
    if (this.config.maxRequests <= 0 || this.config.windowMs <= 0) {
      logger.warn('Invalid rate limit configuration, using defaults');
      this.config = { maxRequests: 100, windowMs: 60000, cleanupIntervalMs: 300000 };
    }

    if (process.env.RATE_LIMIT_MAX_REQUESTS === undefined) {
      logger.warn('RATE_LIMIT_MAX_REQUESTS not set, using default: 100');
    }

    this.state = new Map();
    this.startCleanup();
  }

  private getWindowTimestamp(now: number): number {
    return Math.floor(now / this.config.windowMs) * this.config.windowMs;
  }

  private getClientIdentifier(request: FastifyRequest): string {
    const ip = request.ip || 'unknown';
    const body = request.body as { key?: string } | null;
    const licenseKey = body?.key || 'no-key';
    return `${ip}:${licenseKey}`;
  }

  private getStateKey(clientId: string, windowTimestamp: number): string {
    return `${clientId}:${windowTimestamp}`;
  }

  checkLimit(request: FastifyRequest, reply: FastifyReply): boolean {
    try {
      const now = Date.now();
      const windowTimestamp = this.getWindowTimestamp(now);
      const clientId = this.getClientIdentifier(request);
      const stateKey = this.getStateKey(clientId, windowTimestamp);

      const entry = this.state.get(stateKey);

      if (entry) {
        entry.requestCount++;
        entry.lastRequestAt = now;

        if (entry.requestCount > this.config.maxRequests) {
          const retryAfter = Math.ceil((windowTimestamp + this.config.windowMs - now) / 1000);
          
          // Log violation (mask license key for security)
          const maskedKey = clientId.split(':')[1]?.substring(0, 8) + '...' || 'unknown';
          logger.warn({
            clientId: clientId.split(':')[0],
            licenseKey: maskedKey,
            requestCount: entry.requestCount,
            path: request.url,
          }, 'Rate limit exceeded');

          reply.code(429).header('Retry-After', retryAfter.toString()).send({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
          });
          return false;
        }
      } else {
        // New entry for this window
        this.state.set(stateKey, {
          requestCount: 1,
          lastRequestAt: now,
        });
      }

      return true;
    } catch (error) {
      // Fail open: allow request if rate limiting fails
      logger.error({ error, path: request.url }, 'Rate limit check failed, allowing request');
      return true;
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const currentWindow = this.getWindowTimestamp(now);
      
      for (const [key, entry] of this.state.entries()) {
        const windowTimestamp = parseInt(key.split(':').pop() || '0', 10);
        if (windowTimestamp < currentWindow) {
          this.state.delete(key);
        }
      }
    }, this.config.cleanupIntervalMs);
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton instance
let rateLimiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter();
  }
  return rateLimiter;
}

export const rateLimitMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const limiter = getRateLimiter();
  const allowed = limiter.checkLimit(request, reply);
  if (!allowed) {
    return; // Response already sent
  }
  // Request allowed, continue to handler
};
```

### 2. Apply Rate Limiting to Validation Endpoint

Update `api/routes/validation.ts`:

```typescript
import { rateLimitMiddleware } from '../middleware/rateLimit';

export async function validationRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Add rate limiting hook
  fastify.addHook('preHandler', rateLimitMiddleware);

  // Existing validation route
  fastify.post('/', {
    // ... existing schema ...
  }, async (request, reply) => {
    // ... existing handler ...
  });
}
```

### 3. Apply Rate Limiting to Consumption Endpoint

Update `api/routes/consume.ts`:

```typescript
import { rateLimitMiddleware } from '../middleware/rateLimit';

export async function consumeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Add rate limiting hook
  fastify.addHook('preHandler', rateLimitMiddleware);

  // Existing consumption route
  fastify.post('/', {
    // ... existing schema ...
  }, async (request, reply) => {
    // ... existing handler ...
  });
}
```

### 4. Update OpenAPI Schema (Optional)

Update `api/index.ts` to document rate limiting in Swagger:

```typescript
// In fastifySwagger configuration, add rate limit responses to schema
components: {
  responses: {
    RateLimitExceeded: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Rate limit exceeded' },
              code: { type: 'string', example: 'RATE_LIMIT_EXCEEDED' },
              retryAfter: { type: 'number', example: 30 },
            },
          },
        },
      },
    },
  },
},
```

Then reference in route schemas:

```typescript
response: {
  200: { /* ... */ },
  429: { $ref: '#/components/responses/RateLimitExceeded' },
  400: { /* ... */ },
}
```

### 5. Environment Variables

Add to `.env.local` (development) or set in production:

```bash
# Rate limiting configuration
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_CLEANUP_INTERVAL_MS=300000
```

## Testing

### Manual Testing

1. **Test within limit**:
   ```bash
   # Make 50 requests (within 100 req/min limit)
   for i in {1..50}; do
     curl -X POST http://localhost:3001/api/validate \
       -H "Content-Type: application/json" \
       -d '{"key":"TEST-KEY","deviceId":"device-1"}'
   done
   ```

2. **Test rate limit exceeded**:
   ```bash
   # Make 101 requests (exceeds 100 req/min limit)
   for i in {1..101}; do
     curl -X POST http://localhost:3001/api/validate \
       -H "Content-Type: application/json" \
       -d '{"key":"TEST-KEY","deviceId":"device-1"}'
   done
   # 101st request should return 429
   ```

3. **Test different clients**:
   ```bash
   # Different IP + Key combination should have separate limit
   curl -X POST http://localhost:3001/api/validate \
     -H "Content-Type: application/json" \
     -d '{"key":"DIFFERENT-KEY","deviceId":"device-1"}'
   ```

### Verify Logging

Check logs for:
- Rate limit violations (should log with masked license key)
- Configuration warnings (if defaults used)
- Rate limit check failures (should be rare)

## Deployment Notes

- Rate limits are per-server-instance (not shared across instances)
- Rate limits reset on server restart
- Memory usage is minimal (~100 bytes per active client)
- Cleanup runs every 5 minutes to prevent memory leaks

## Troubleshooting

**Issue**: Rate limiting not working
- Check middleware is registered (hooks added to routes)
- Verify environment variables are set
- Check logs for configuration warnings

**Issue**: Rate limits too strict/lenient
- Adjust `RATE_LIMIT_MAX_REQUESTS` environment variable
- Adjust `RATE_LIMIT_WINDOW_MS` for different window duration

**Issue**: Memory usage growing
- Verify cleanup is running (check logs)
- Adjust `RATE_LIMIT_CLEANUP_INTERVAL_MS` if needed

