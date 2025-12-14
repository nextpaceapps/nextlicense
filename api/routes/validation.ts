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

export async function validationRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Validate license
  fastify.post('/', {
    schema: {
      description: 'Validate a license key and register device activation',
      tags: ['Validation'],
      summary: 'Validate a license',
      body: {
        type: 'object',
        required: ['key', 'deviceId'],
        properties: {
          key: { type: 'string', description: 'License key' },
          deviceId: { type: 'string', description: 'Device identifier' },
        },
        examples: {
          example1: {
            value: {
              key: 'LICENSE-KEY-12345',
              deviceId: 'device-abc-123',
            },
          },
        },
      },
      response: {
        200: {
          description: 'Validation result',
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            message: { type: 'string' },
            license: {
              type: 'object',
              nullable: true,
              properties: {
                status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
                productName: { type: 'string' },
                planName: { type: 'string' },
                expiresAt: { type: 'string', format: 'date-time' },
                features: { type: 'array', items: { type: 'string' } },
                daysRemaining: { type: 'integer' },
              },
            },
          },
          examples: {
            valid: {
              value: {
                valid: true,
                message: 'License Valid',
                license: {
                  status: 'ACTIVE',
                  productName: 'My Product',
                  planName: 'Premium Plan',
                  expiresAt: '2025-12-31T23:59:59Z',
                  features: ['feature1', 'feature2'],
                  daysRemaining: 365,
                },
              },
            },
            invalid: {
              value: {
                valid: false,
                message: 'Invalid License Key',
              },
            },
          },
        },
        400: {
          description: 'Bad request - missing required fields',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const body = request.body as { key: string; deviceId: string };
      
      if (!body.key || !body.deviceId) {
        reply.code(400).send({ error: 'Key and deviceId are required' });
        return;
      }

      logger.info(`POST /api/validate - Validating license key: ${body.key.substring(0, 8)}...`);

      const license = await getService().getLicenseByKey(body.key);
      
      if (!license) {
        await getService().createLog({
          type: 'ERROR',
          details: `Validation failed: Invalid key ${body.key}`,
        });
        return {
          valid: false,
          message: 'Invalid License Key',
        };
      }

      if (license.status === LicenseStatus.CANCELLED) {
        await getService().createLog({
          type: 'VALIDATE',
          details: `Validation failed: Cancelled key ${body.key}`,
          relatedId: license.id,
        });
        return {
          valid: false,
          message: 'License has been cancelled',
        };
      }

      const now = new Date();
      const expiresAt = new Date(license.expiresAt);

      if (now > expiresAt) {
        if (license.status !== LicenseStatus.EXPIRED) {
          await getService().updateLicenseStatus(license.id, LicenseStatus.EXPIRED);
        }
        await getService().createLog({
          type: 'EXPIRE',
          details: `Validation failed: Expired key ${body.key}`,
          relatedId: license.id,
        });
        return {
          valid: false,
          message: 'License has expired',
        };
      }

      const plan = await getService().getPlan(license.planId);
      if (!plan) {
        return {
          valid: false,
          message: 'Internal Error: Plan missing',
        };
      }

      const existingDeviceIndex = license.activations.findIndex(
        (a) => a.deviceId === body.deviceId
      );

      let updatedActivations = [...license.activations];

      if (existingDeviceIndex === -1) {
        // Only check device limit for time-based plans
        if (plan.deviceLimit !== undefined && license.activations.length >= plan.deviceLimit) {
          await getService().createLog({
            type: 'VALIDATE',
            details: `Device limit reached for ${body.key}`,
            relatedId: license.id,
          });
          return {
            valid: false,
            message: `Device limit reached. Max ${plan.deviceLimit} devices allowed.`,
          };
        }
        
        updatedActivations.push({
          deviceId: body.deviceId,
          activatedAt: now.toISOString(),
          lastUsedAt: now.toISOString(),
        });
        
        await getService().createLog({
          type: 'VALIDATE',
          details: `New device activated: ${body.deviceId}`,
          relatedId: license.id,
        });
      } else {
        updatedActivations[existingDeviceIndex] = {
          ...updatedActivations[existingDeviceIndex],
          lastUsedAt: now.toISOString(),
        };
      }

      await getService().updateLicenseActivations(license.id, updatedActivations);

      // Get product name
      const products = await getService().getAllProducts();
      const product = products.find((p) => p.id === license.productId);

      logger.info(`✅ License validated successfully: ${body.key.substring(0, 8)}...`);
      
      return {
        valid: true,
        message: 'License Valid',
        license: {
          status: license.status,
          productName: product?.name || 'Unknown',
          planName: plan.name,
          expiresAt: license.expiresAt,
          features: plan.features,
          daysRemaining: Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
      };
    } catch (error: any) {
      logger.error('❌ Validation error:', error);
      return {
        valid: false,
        message: `Validation Error: ${error.message}`,
      };
    }
  });
}

