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
  fastify.get('/', {
    schema: {
      description: 'Retrieve event logs with optional limit',
      tags: ['Logs'],
      summary: 'List event logs',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', description: 'Maximum number of logs to return', minimum: 1, maximum: 1000, default: 100 },
        },
      },
      response: {
        200: {
          description: 'List of event logs',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              type: { type: 'string', enum: ['ISSUE', 'VALIDATE', 'RENEW', 'CANCEL', 'EXPIRE', 'ERROR', 'CONSUME', 'TOPUP'] },
              details: { type: 'string' },
              relatedId: { type: 'string', nullable: true },
            },
          },
        },
        401: {
          description: 'Authentication required',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
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

