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
  fastify.get('/', {
    schema: {
      description: 'Retrieve all plans in the system',
      tags: ['Plans'],
      summary: 'List all plans',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of plans',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              productId: { type: 'string' },
              name: { type: 'string' },
              defaultUsageCount: { type: 'integer', nullable: true },
              durationDays: { type: 'integer', nullable: true },
              deviceLimit: { type: 'integer', nullable: true },
              features: { type: 'array', items: { type: 'string' } },
              price: { type: 'number' },
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
  fastify.post('/', {
    schema: {
      description: 'Create a new plan (usage-based or time-based) for a product',
      tags: ['Plans'],
      summary: 'Create a new plan',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['productId', 'name'],
        properties: {
          productId: { type: 'string', description: 'Associated product ID' },
          name: { type: 'string', description: 'Plan name' },
          defaultUsageCount: { type: 'integer', description: 'For usage-based plans only', minimum: 1 },
          durationDays: { type: 'integer', description: 'For time-based plans only', minimum: 1 },
          deviceLimit: { type: 'integer', description: 'For time-based plans only', minimum: 0 },
          features: { type: 'array', items: { type: 'string' }, description: 'Array of feature codes' },
          price: { type: 'number', description: 'Plan price', minimum: 0 },
        },
      },
      response: {
        201: {
          description: 'Plan created successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            name: { type: 'string' },
            defaultUsageCount: { type: 'integer', nullable: true },
            durationDays: { type: 'integer', nullable: true },
            deviceLimit: { type: 'integer', nullable: true },
            features: { type: 'array', items: { type: 'string' } },
            price: { type: 'number' },
          },
        },
        400: {
          description: 'Bad request - validation error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string', nullable: true },
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
      const body = request.body as {
        productId: string;
        name: string;
        defaultUsageCount?: number;
        durationDays?: number;
        deviceLimit?: number;
        features?: string[];
        price?: number;
      };
      
      logger.info({ name: body.name, productId: body.productId }, 'POST /api/plans - Creating plan');
      
      if (!body.productId || !body.name) {
        reply.code(400).send({ error: 'Missing required fields: productId and name are required' });
        return;
      }

      // Plan type exclusivity validation
      const isUsageBased = body.defaultUsageCount !== undefined;
      const isTimeBased = body.durationDays !== undefined || body.deviceLimit !== undefined;

      if (isUsageBased && isTimeBased) {
        reply.code(400).send({ error: 'Plan cannot be both usage-based and time-based. Plans must be either usage-based (defaultUsageCount) OR time-based (durationDays/deviceLimit), but not both.', code: 'PLAN_TYPE_MISMATCH' });
        return;
      }

      // Usage-based plan validation
      if (isUsageBased) {
        if (body.defaultUsageCount === undefined || body.defaultUsageCount <= 0 || !Number.isInteger(body.defaultUsageCount)) {
          reply.code(400).send({ error: 'defaultUsageCount must be a positive integer for usage-based plans', code: 'VALIDATION_ERROR' });
          return;
        }
        // Ensure time-based fields are not set
        if (body.durationDays !== undefined || body.deviceLimit !== undefined) {
          reply.code(400).send({ error: 'Usage-based plans cannot have durationDays or deviceLimit', code: 'PLAN_TYPE_MISMATCH' });
          return;
        }
      }

      // Time-based plan validation
      if (isTimeBased) {
        if (body.durationDays === undefined || body.deviceLimit === undefined) {
          reply.code(400).send({ error: 'durationDays and deviceLimit are required for time-based plans', code: 'VALIDATION_ERROR' });
          return;
        }
        if (body.durationDays <= 0 || !Number.isInteger(body.durationDays)) {
          reply.code(400).send({ error: 'durationDays must be a positive integer', code: 'VALIDATION_ERROR' });
          return;
        }
        if (body.deviceLimit < 0 || !Number.isInteger(body.deviceLimit)) {
          reply.code(400).send({ error: 'deviceLimit must be a non-negative integer', code: 'VALIDATION_ERROR' });
          return;
        }
        // Ensure usage-based fields are not set
        if (body.defaultUsageCount !== undefined) {
          reply.code(400).send({ error: 'Time-based plans cannot have defaultUsageCount', code: 'PLAN_TYPE_MISMATCH' });
          return;
        }
      }

      // If neither type is specified, default to time-based for backward compatibility
      if (!isUsageBased && !isTimeBased) {
        reply.code(400).send({ error: 'Plan must be either usage-based (defaultUsageCount) or time-based (durationDays/deviceLimit)', code: 'VALIDATION_ERROR' });
        return;
      }

      const plan = await getService().createPlan({
        productId: body.productId,
        name: body.name.trim(),
        defaultUsageCount: body.defaultUsageCount,
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

  // Get plan by ID
  fastify.get('/:id', {
    schema: {
      description: 'Retrieve a plan by ID',
      tags: ['Plans'],
      summary: 'Get plan by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Plan ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          description: 'Plan details',
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            name: { type: 'string' },
            defaultUsageCount: { type: 'integer', nullable: true },
            durationDays: { type: 'integer', nullable: true },
            deviceLimit: { type: 'integer', nullable: true },
            features: { type: 'array', items: { type: 'string' } },
            price: { type: 'number' },
          },
        },
        404: {
          description: 'Plan not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
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
      const { id } = request.params as { id: string };
      logger.info(`GET /api/plans/${id} - Fetching plan`);
      const plan = await getService().getPlan(id);
      if (!plan) {
        reply.code(404).send({ error: 'Plan not found' });
        return;
      }
      return plan;
    } catch (error: any) {
      logger.error('❌ Error fetching plan:', error);
      reply.code(500).send({ error: error.message || 'Failed to fetch plan' });
    }
  });

  // Delete plan
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a plan by ID',
      tags: ['Plans'],
      summary: 'Delete a plan',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Plan ID' },
        },
        required: ['id'],
      },
      response: {
        204: {
          description: 'Plan deleted successfully',
          type: 'null',
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

