# Quickstart: API Documentation

**Feature**: API Documentation (004-swagger-docs)  
**Date**: 2025-01-27

## Overview

This guide provides a quick start for implementing API documentation using @fastify/swagger and @fastify/swagger-ui.

## Installation

```bash
cd api
npm install @fastify/swagger @fastify/swagger-ui
```

## Basic Setup

### 1. Register Swagger Plugins in `api/index.ts`

```typescript
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

// Register @fastify/swagger first (generates OpenAPI spec)
await fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'License API',
      description: 'Backend API for the License Management System',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Local development server',
      },
    ],
    tags: [
      { name: 'Products', description: 'Product management endpoints' },
      { name: 'Plans', description: 'Plan management endpoints' },
      { name: 'Licenses', description: 'License management endpoints' },
      { name: 'Validation', description: 'License validation endpoints (public)' },
      { name: 'Consumption', description: 'Usage consumption endpoints (public)' },
      { name: 'Logs', description: 'Event log endpoints' },
      { name: 'Health', description: 'Health check endpoint (public)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID token authentication',
        },
      },
    },
  },
});

// Register @fastify/swagger-ui second (serves UI)
await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
});
```

### 2. Add Schema to a Route Example

Update `api/routes/products.ts`:

```typescript
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
            description: { type: 'string' },
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
  // ... existing handler code
});
```

### 3. Add Export Routes (Optional)

Add routes to serve OpenAPI JSON and YAML:

```typescript
// After registering swagger-ui
fastify.get('/docs/openapi.json', async (request, reply) => {
  return fastify.swagger();
});

fastify.get('/docs/openapi.yaml', async (request, reply) => {
  const yaml = require('js-yaml');
  const spec = fastify.swagger();
  reply.type('text/yaml');
  return yaml.dump(spec);
});
```

## Testing

1. Start the server: `npm run dev`
2. Access documentation: `http://localhost:3001/docs`
3. Verify all endpoints are listed
4. Test interactive requests
5. Test Bearer token authentication
6. Test export: `http://localhost:3001/docs/openapi.json`

## Incremental Implementation

You don't need to add schemas to all routes at once. Start with:

1. **Phase 1**: Add schemas to one route module (e.g., products)
2. **Phase 2**: Add schemas to remaining route modules
3. **Phase 3**: Add examples and detailed descriptions
4. **Phase 4**: Add export routes for JSON/YAML

## Common Patterns

### Public Endpoint (No Auth)

```typescript
fastify.post('/api/validate', {
  schema: {
    tags: ['Validation'],
    summary: 'Validate a license',
    // No security array = public endpoint
    // ... rest of schema
  },
}, handler);
```

### Protected Endpoint (Requires Auth)

```typescript
fastify.get('/api/products', {
  schema: {
    tags: ['Products'],
    security: [{ bearerAuth: [] }], // Requires authentication
    // ... rest of schema
  },
}, handler);
```

### Request Body Schema

```typescript
fastify.post('/api/products', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'code'],
      properties: {
        name: { type: 'string' },
        code: { type: 'string' },
        description: { type: 'string' },
      },
    },
    // ... rest of schema
  },
}, handler);
```

### Path Parameters

```typescript
fastify.delete('/api/products/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    // ... rest of schema
  },
}, handler);
```

### Query Parameters

```typescript
fastify.get('/api/logs', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
      },
    },
    // ... rest of schema
  },
}, handler);
```

## Next Steps

1. Add schemas to all route modules
2. Add detailed descriptions and examples
3. Test interactive documentation
4. Verify export functionality
5. Share documentation URL with other projects
