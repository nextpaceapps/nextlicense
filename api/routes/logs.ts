import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FirestoreService, getFirestoreInstance } from '../services/firestore';
import { logger } from '../logger';

let firestoreService: FirestoreService | null = null;

function getService(): FirestoreService {
  if (!firestoreService) {
    const db = getFirestoreInstance();
    firestoreService = new FirestoreService(db);
  }
  return firestoreService;
}

export async function logRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get all logs
  fastify.get('/', async (request, reply) => {
    try {
      const limit = parseInt((request.query as any)?.limit || '100', 10);
      logger.info(`GET /api/logs - Fetching logs (limit: ${limit})`);
      
      const logs = await getService().getAllLogs(limit);
      logger.info(`✅ Retrieved ${logs.length} logs`);
      return logs;
    } catch (error: any) {
      logger.error('❌ Error fetching logs:', error);
      reply.code(500).send({ error: error.message || 'Failed to fetch logs' });
    }
  });
}

