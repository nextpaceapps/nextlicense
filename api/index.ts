// Load environment variables from .env.local in development
// In production, Firebase App Hosting provides environment variables
import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

if (process.env.NODE_ENV !== 'production') {
  const envLocalPath = resolve(process.cwd(), '.env.local');
  const envPath = resolve(process.cwd(), '.env');
  
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from './logger';
import { authenticate } from './middleware/auth';
import { productRoutes } from './routes/products';
import { planRoutes } from './routes/plans';
import { licenseRoutes } from './routes/licenses';
import { logRoutes } from './routes/logs';
import { validationRoutes } from './routes/validation';

// Note: Firebase Admin will be initialized lazily on first API request
// This ensures environment variables are available when needed

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register CORS
fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return cb(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'https://license-513ef.web.app', 'https://license-513ef.firebaseapp.com'];
    
    if (allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
});

// Health check (Public)
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Validation routes (Public)
fastify.register(validationRoutes, { prefix: '/api/validate' });

// Protected routes (Require Authentication)
fastify.register(async (instance) => {
  instance.addHook('preHandler', authenticate);
  
  instance.register(productRoutes, { prefix: '/api/products' });
  instance.register(planRoutes, { prefix: '/api/plans' });
  instance.register(licenseRoutes, { prefix: '/api/licenses' });
  instance.register(logRoutes, { prefix: '/api/logs' });
});

// Start server
const start = async () => {
  try {
    // Log environment variable status
    logger.info('🔍 Environment check:');
    logger.info(`   GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'not set'}`);
    logger.info(`   PORT: ${process.env.PORT || '3001 (default)'}`);
    
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    logger.info(`🚀 Server listening on http://${host}:${port}`);
    logger.info(`📊 Health check: http://${host}:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Export for testing
export { fastify };

