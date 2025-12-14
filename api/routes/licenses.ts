import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FirestoreService, getFirestoreInstance } from '../services/firestore';
import { logger } from '../logger';
import { LicenseStatus } from '../types';

let firestoreService: FirestoreService | null = null;

function getService(): FirestoreService {
  if (!firestoreService) {
    const db = getFirestoreInstance();
    firestoreService = new FirestoreService(db);
  }
  return firestoreService;
}

export async function licenseRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get all licenses
  fastify.get('/', {
    schema: {
      description: 'Retrieve all licenses in the system',
      tags: ['Licenses'],
      summary: 'List all licenses',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of licenses',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              key: { type: 'string' },
              productId: { type: 'string' },
              planId: { type: 'string' },
              userEmail: { type: 'string' },
              status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
              issuedAt: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              activations: { type: 'array', items: { type: 'object' } },
              currentUsageCount: { type: 'integer', nullable: true },
              totalUsageCount: { type: 'integer', nullable: true },
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
            code: { type: 'string', nullable: true },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      logger.info('GET /api/licenses - Fetching all licenses');
      const licenses = await getService().getAllLicenses();
      logger.info(`✅ Retrieved ${licenses.length} licenses`);
      return licenses;
    } catch (error: any) {
      logger.error({ error }, '❌ Error fetching licenses');
      logger.error({
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      }, '   Error details');
      reply.code(500).send({ 
        error: error.message || 'Failed to fetch licenses',
        code: error.code || 'UNKNOWN_ERROR'
      });
    }
  });

  // Get license by key
  fastify.get('/key/:key', {
    schema: {
      description: 'Retrieve a license by license key',
      tags: ['Licenses'],
      summary: 'Get license by key',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'License key' },
        },
        required: ['key'],
      },
      response: {
        200: {
          description: 'License details',
          type: 'object',
          properties: {
            id: { type: 'string' },
            key: { type: 'string' },
            productId: { type: 'string' },
            planId: { type: 'string' },
            userEmail: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
            issuedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            activations: { type: 'array', items: { type: 'object' } },
            currentUsageCount: { type: 'integer', nullable: true },
            totalUsageCount: { type: 'integer', nullable: true },
          },
        },
        404: {
          description: 'License not found',
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
      const { key } = request.params as { key: string };
      logger.info(`GET /api/licenses/key/${key} - Fetching license by key`);
      
      const license = await getService().getLicenseByKey(key);
      if (!license) {
        reply.code(404).send({ error: 'License not found' });
        return;
      }
      
      return license;
    } catch (error: any) {
      logger.error('❌ Error fetching license:', error);
      reply.code(500).send({ error: error.message || 'Failed to fetch license' });
    }
  });

  // Create license
  fastify.post('/', {
    schema: {
      description: 'Create a new license for a user with a specific product and plan',
      tags: ['Licenses'],
      summary: 'Create a new license',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['productId', 'planId', 'userEmail'],
        properties: {
          productId: { type: 'string', description: 'Product ID' },
          planId: { type: 'string', description: 'Plan ID' },
          userEmail: { type: 'string', format: 'email', description: 'User email address' },
        },
      },
      response: {
        201: {
          description: 'License created successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            key: { type: 'string' },
            productId: { type: 'string' },
            planId: { type: 'string' },
            userEmail: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
            issuedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            activations: { type: 'array', items: { type: 'object' } },
            currentUsageCount: { type: 'integer', nullable: true },
            totalUsageCount: { type: 'integer', nullable: true },
          },
        },
        400: {
          description: 'Bad request - missing required fields',
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
      const body = request.body as {
        productId: string;
        planId: string;
        userEmail: string;
      };
      
      logger.info({ userEmail: body.userEmail }, 'POST /api/licenses - Creating license');
      
      if (!body.productId || !body.planId || !body.userEmail) {
        reply.code(400).send({ error: 'Missing required fields' });
        return;
      }

      const license = await getService().createLicense({
        productId: body.productId,
        planId: body.planId,
        userEmail: body.userEmail.trim(),
      });

      // Log the license creation
      await getService().createLog({
        type: 'ISSUE',
        details: `Issued license ${license.key} to ${license.userEmail}`,
        relatedId: license.id,
      });
      
      logger.info(`✅ License created: ${license.id} (${license.key})`);
      reply.code(201).send(license);
    } catch (error: any) {
      logger.error('❌ Error creating license:', error);
      reply.code(500).send({ error: error.message || 'Failed to create license' });
    }
  });

  // Renew license
  fastify.post('/:id/renew', {
    schema: {
      description: 'Renew an existing license, extending its expiration date',
      tags: ['Licenses'],
      summary: 'Renew a license',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'License ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          description: 'License renewed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
      logger.info(`POST /api/licenses/${id}/renew - Renewing license`);
      
      await getService().renewLicense(id);
      
      await getService().createLog({
        type: 'RENEW',
        details: `Renewed license (ID: ${id})`,
        relatedId: id,
      });
      
      logger.info(`✅ License renewed: ${id}`);
      reply.code(200).send({ success: true });
    } catch (error: any) {
      logger.error('❌ Error renewing license:', error);
      reply.code(500).send({ error: error.message || 'Failed to renew license' });
    }
  });

  // Cancel license
  fastify.post('/:id/cancel', {
    schema: {
      description: 'Cancel an existing license',
      tags: ['Licenses'],
      summary: 'Cancel a license',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'License ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          description: 'License cancelled successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
      logger.info(`POST /api/licenses/${id}/cancel - Cancelling license`);
      
      await getService().cancelLicense(id);
      
      await getService().createLog({
        type: 'CANCEL',
        details: `Cancelled license (ID: ${id})`,
        relatedId: id,
      });
      
      logger.info(`✅ License cancelled: ${id}`);
      reply.code(200).send({ success: true });
    } catch (error: any) {
      logger.error('❌ Error cancelling license:', error);
      reply.code(500).send({ error: error.message || 'Failed to cancel license' });
    }
  });

  // Topup license
  fastify.post('/:id/topup', {
    schema: {
      description: 'Add usage count to a usage-based license',
      tags: ['Licenses'],
      summary: 'Topup a license',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'License ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'integer', description: 'Amount of usage to add', minimum: 1 },
        },
      },
      response: {
        200: {
          description: 'License topped up successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            license: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                currentUsageCount: { type: 'integer' },
                totalUsageCount: { type: 'integer' },
              },
            },
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
      const { id } = request.params as { id: string };
      const body = request.body as { amount: number };
      
      logger.info(`POST /api/licenses/${id}/topup - Topping up license with ${body.amount} usages`);
      
      // Validate topup amount
      if (!body.amount || body.amount <= 0 || !Number.isInteger(body.amount)) {
        reply.code(400).send({ error: 'amount must be a positive integer', code: 'VALIDATION_ERROR' });
        return;
      }
      
      const result = await getService().topupLicense(id, body.amount);
      
      if (!result.success) {
        const statusCode = (result.statusCode || 400) as 400 | 401 | 500;
        reply.code(statusCode).send({ 
          error: result.error || 'Failed to topup license',
          code: result.code
        });
        return;
      }
      
      // Log topup operation
      await getService().createLog({
        type: 'TOPUP',
        details: `Topped up license ${id} with ${body.amount} usages. New total: ${result.license?.totalUsageCount}, remaining: ${result.license?.currentUsageCount}`,
        relatedId: id,
      });
      
      logger.info(`✅ License topped up: ${id}, new currentUsageCount: ${result.license?.currentUsageCount}, totalUsageCount: ${result.license?.totalUsageCount}`);
      reply.code(200).send({
        success: true,
        license: {
          id: result.license!.id,
          currentUsageCount: result.license!.currentUsageCount!,
          totalUsageCount: result.license!.totalUsageCount!,
        }
      });
    } catch (error: any) {
      logger.error('❌ Topup error:', error);
      reply.code(500).send({ error: error.message || 'Failed to topup license' });
    }
  });
}

