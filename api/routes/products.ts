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
  fastify.get('/', {
    schema: {
      description: 'Retrieve all products in the system',
      tags: ['Products'],
      summary: 'List all products',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of products',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              code: { type: 'string' },
              description: { type: 'string', nullable: true },
            },
          },
          example: [
            {
              id: 'prod123',
              name: 'My Product',
              code: 'PROD001',
              description: 'Product description',
            },
          ],
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
  fastify.post('/', {
    schema: {
      description: 'Create a new product with name, code, and optional description',
      tags: ['Products'],
      summary: 'Create a new product',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          name: { type: 'string', description: 'Product name' },
          code: { type: 'string', description: 'Product code (unique identifier)' },
          description: { type: 'string', description: 'Product description', nullable: true },
        },
        examples: {
          example1: {
            value: {
              name: 'My Product',
              code: 'PROD001',
              description: 'Product description',
            },
          },
        },
      },
      response: {
        201: {
          description: 'Product created successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string', nullable: true },
          },
          example: {
            id: 'prod123',
            name: 'My Product',
            code: 'PROD001',
            description: 'Product description',
          },
        },
        400: {
          description: 'Bad request - missing required fields',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          example: {
            error: 'Name and code are required',
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
            hint: { type: 'string', nullable: true },
          },
        },
      },
    },
  }, async (request, reply) => {
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
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a product by ID',
      tags: ['Products'],
      summary: 'Delete a product',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Product ID' },
        },
        required: ['id'],
      },
      response: {
        204: {
          description: 'Product deleted successfully',
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

