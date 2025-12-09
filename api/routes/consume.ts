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

export async function consumeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Consume usage from license (Public endpoint)
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as { key: string; amount: number };
      const productId = request.headers['product-id'] as string;
      
      // Validate product-id header
      if (!productId) {
        reply.code(400).send({ error: 'product-id header is required', code: 'VALIDATION_ERROR' });
        return;
      }
      
      // Validate request body
      if (!body.key || body.amount === undefined) {
        reply.code(400).send({ error: 'key and amount are required', code: 'VALIDATION_ERROR' });
        return;
      }
      
      if (body.amount <= 0 || !Number.isInteger(body.amount)) {
        reply.code(400).send({ error: 'amount must be a positive integer', code: 'VALIDATION_ERROR' });
        return;
      }
      
      logger.info(`POST /api/consume - Consuming ${body.amount} usages for license key: ${body.key.substring(0, 8)}...`);
      
      // Use service method for atomic consumption
      const result = await getService().consumeUsage(body.key, productId, body.amount);
      
      if (!result.success) {
        const statusCode = result.statusCode || 400;
        reply.code(statusCode).send({ 
          error: result.error || 'Failed to consume usage',
          code: result.code
        });
        return;
      }
      
      logger.info(`✅ Successfully consumed ${body.amount} usages, remaining: ${result.remaining}`);
      reply.code(200).send({
        success: true,
        remaining: result.remaining,
        message: `Consumed ${body.amount} usages successfully`
      });
    } catch (error: any) {
      logger.error('❌ Consumption error:', error);
      reply.code(500).send({ error: error.message || 'Failed to consume usage' });
    }
  });
}

