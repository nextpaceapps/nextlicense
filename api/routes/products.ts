import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FirestoreService, getFirestoreInstance } from '../services/firestore';
import { logger } from '../logger';

// Lazy initialization - will initialize on first route call
let firestoreService: FirestoreService | null = null;

function getService(): FirestoreService {
  if (!firestoreService) {
    const db = getFirestoreInstance();
    firestoreService = new FirestoreService(db);
  }
  return firestoreService;
}

export async function productRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Get all products
  fastify.get('/', async (request, reply) => {
    try {
      logger.info('GET /api/products - Fetching all products');
      const products = await getService().getAllProducts();
      logger.info(`✅ Retrieved ${products.length} products`);
      return products;
    } catch (error: any) {
      logger.error('❌ Error fetching products:', error);
      reply.code(500).send({ error: error.message || 'Failed to fetch products' });
    }
  });

  // Create product
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as { name: string; code: string; description?: string };
      logger.info({ name: body.name, code: body.code }, 'POST /api/products - Creating product');
      
      if (!body.name || !body.code) {
        reply.code(400).send({ error: 'Name and code are required' });
        return;
      }

      const product = await getService().createProduct({
        name: body.name.trim(),
        code: body.code.trim(),
        description: body.description?.trim(),
      });
      
      logger.info(`✅ Product created: ${product.id}`);
      reply.code(201).send(product);
    } catch (error: any) {
      logger.error('❌ Error creating product:');
      logger.error(`   Message: ${error.message}`);
      logger.error(`   Code: ${error.code}`);
      if (error.stack) {
        logger.error(`   Stack:\n${error.stack.split('\n').slice(0, 5).join('\n')}`);
      }
      
      // Send a more detailed error message
      reply.code(500).send({ 
        error: error.message || 'Failed to create product',
        code: error.code,
        hint: error.message?.includes('NOT_FOUND') || error.code === 5
          ? 'Firestore database may not be enabled. Check the server logs for details.'
          : undefined
      });
    }
  });

  // Delete product
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      logger.info(`DELETE /api/products/${id} - Deleting product`);
      
      await getService().deleteProduct(id);
      logger.info(`✅ Product deleted: ${id}`);
      reply.code(204).send();
    } catch (error: any) {
      logger.error('❌ Error deleting product:', error);
      reply.code(500).send({ error: error.message || 'Failed to delete product' });
    }
  });
}

