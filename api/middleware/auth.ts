import { FastifyRequest, FastifyReply } from 'fastify';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '../logger';
import { initializeFirestore } from '../services/firestore';

// Firebase Admin will be initialized lazily when needed
// Don't initialize at module load time to ensure environment variables are loaded first

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Dev login bypass (development only)
    const devLoginBypass = process.env.DEV_LOGIN_BYPASS === 'true';
    const isDevLogin = request.headers['x-dev-login'] === 'true';
    
    if (devLoginBypass && isDevLogin && process.env.NODE_ENV !== 'production') {
      // Allow request to proceed without token validation in development
      logger.info('Dev login bypass enabled - skipping authentication');
      return;
    }

    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      logger.warn({
        path: request.url,
        method: request.method,
      }, 'Authentication failed: No authorization header');
      return reply.code(401).send({ error: 'Authentication failed' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn({
        path: request.url,
        method: request.method,
      }, 'Authentication failed: Invalid token format');
      return reply.code(401).send({ error: 'Authentication failed' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      // Ensure Firebase Admin is initialized before verifying token
      // This is lazy initialization - only happens when needed, after env vars are loaded
      try {
        initializeFirestore(); // This initializes Firebase Admin as a side effect
      } catch (initError) {
        // Ignore if already initialized
      }
      
      const decodedToken = await getAuth().verifyIdToken(token);
      request.user = decodedToken;
    } catch (error: any) {
      // Generic error message for all authentication failures (per FR-004)
      logger.error({ 
        error, 
        errorCode: error?.code,
        path: request.url,
        method: request.method,
      }, 'Authentication failed: Token verification error');
      return reply.code(401).send({ error: 'Authentication failed' });
    }
    
  } catch (error) {
    // Handle Firebase Admin SDK initialization failures or other errors
    logger.error({ 
      error,
      path: request.url,
      method: request.method,
    }, 'Authentication middleware error');
    return reply.code(401).send({ error: 'Authentication failed' });
  }
};

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: any;
  }
}

