import { FastifyRequest, FastifyReply } from 'fastify';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '../logger';
import { initializeFirestore } from '../services/firestore';

// Ensure Firebase Admin is initialized
// This might be redundant if it's already initialized, but safe to call
try {
  initializeFirestore();
} catch (e) {
  // Ignore error if already initialized or will be initialized later
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Authentication failed: No authorization header');
      return reply.code(401).send({ error: 'No authorization header' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: Invalid token format');
      return reply.code(401).send({ error: 'Invalid token format' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      request.user = decodedToken;
    } catch (error: any) {
      logger.error({ error }, 'Authentication failed: Invalid token');
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
    
  } catch (error) {
    logger.error({ error }, 'Authentication middleware error');
    return reply.code(500).send({ error: 'Internal server error during authentication' });
  }
};

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: any;
  }
}

