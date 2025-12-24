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
    if (this.config.maxRequests <= 0 || this.config.windowMs <= 0 || this.config.cleanupIntervalMs <= 0) {
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

