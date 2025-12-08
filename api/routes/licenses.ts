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
  fastify.get('/', async (request, reply) => {
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
  fastify.get('/key/:key', async (request, reply) => {
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
  fastify.post('/', async (request, reply) => {
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
  fastify.post('/:id/renew', async (request, reply) => {
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
  fastify.post('/:id/cancel', async (request, reply) => {
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
}

