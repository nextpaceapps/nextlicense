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

export async function planRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get all plans
  fastify.get('/', async (request, reply) => {
    try {
      logger.info('GET /api/plans - Fetching all plans');
      const plans = await getService().getAllPlans();
      logger.info(`✅ Retrieved ${plans.length} plans`);
      return plans;
    } catch (error: any) {
      logger.error('❌ Error fetching plans:', error);
      reply.code(500).send({ error: error.message || 'Failed to fetch plans' });
    }
  });

  // Create plan
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as {
        productId: string;
        name: string;
        durationDays: number;
        deviceLimit: number;
        features: string[];
        price: number;
      };
      
      logger.info({ name: body.name, productId: body.productId }, 'POST /api/plans - Creating plan');
      
      if (!body.productId || !body.name || body.durationDays === undefined || body.deviceLimit === undefined) {
        reply.code(400).send({ error: 'Missing required fields' });
        return;
      }

      const plan = await getService().createPlan({
        productId: body.productId,
        name: body.name.trim(),
        durationDays: body.durationDays,
        deviceLimit: body.deviceLimit,
        features: body.features || [],
        price: body.price || 0,
      });
      
      logger.info(`✅ Plan created: ${plan.id}`);
      reply.code(201).send(plan);
    } catch (error: any) {
      logger.error('❌ Error creating plan:', error);
      reply.code(500).send({ error: error.message || 'Failed to create plan' });
    }
  });

  // Delete plan
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      logger.info(`DELETE /api/plans/${id} - Deleting plan`);
      
      await getService().deletePlan(id);
      logger.info(`✅ Plan deleted: ${id}`);
      reply.code(204).send();
    } catch (error: any) {
      logger.error('❌ Error deleting plan:', error);
      reply.code(500).send({ error: error.message || 'Failed to delete plan' });
    }
  });
}

