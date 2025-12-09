# Quick Start Guide: Usage-Based Plans and Licenses

**Feature**: 002-usage-based-plans  
**Date**: 2025-12-08

## Overview

This guide provides step-by-step instructions for implementing the usage-based plans and licenses feature. The implementation spans both the API backend and web frontend.

## Implementation Order

### Phase 1: Backend Foundation

#### 1.1 Update Type Definitions

**File**: `api/types.ts` and `web/types.ts` (keep in sync)

**Changes**:
- Add `defaultUsageCount?: number` to `Plan` type
- Add `currentUsageCount?: number` and `totalUsageCount?: number` to `License` type
- Add `'CONSUME' | 'TOPUP'` to `LogEvent.type`

**Example**:

```typescript
export type Plan = {
  id: string;
  productId: string;
  name: string;
  defaultUsageCount?: number;  // NEW: For usage-based plans
  durationDays?: number;
  deviceLimit?: number;
  features: string[];
  price: number;
};

export type License = {
  // ... existing fields ...
  currentUsageCount?: number;  // NEW: For usage-based licenses
  totalUsageCount?: number;    // NEW: For usage-based licenses
};
```

#### 1.2 Update Plan Creation Endpoint

**File**: `api/routes/plans.ts`

**Changes**:
- Add validation for plan type exclusivity
- Accept `defaultUsageCount` in request body
- Validate: usage-based plans must have `defaultUsageCount` and NOT have `durationDays`/`deviceLimit`
- Validate: time-based plans must have `durationDays`/`deviceLimit` and NOT have `defaultUsageCount`

**Key Validation Logic**:

```typescript
const isUsageBased = body.defaultUsageCount !== undefined;
const isTimeBased = body.durationDays !== undefined || body.deviceLimit !== undefined;

if (isUsageBased && isTimeBased) {
  reply.code(400).send({ error: 'Plan cannot be both usage-based and time-based' });
  return;
}

if (isUsageBased) {
  if (!body.defaultUsageCount || body.defaultUsageCount <= 0) {
    reply.code(400).send({ error: 'defaultUsageCount must be a positive integer' });
    return;
  }
  // Ensure time-based fields are not set
  if (body.durationDays !== undefined || body.deviceLimit !== undefined) {
    reply.code(400).send({ error: 'Usage-based plans cannot have durationDays or deviceLimit' });
    return;
  }
}
```

#### 1.3 Update License Creation Service

**File**: `api/services/firestore.ts`

**Changes**:
- In `createLicense()`, check if plan is usage-based
- If usage-based: initialize `currentUsageCount` and `totalUsageCount` from `plan.defaultUsageCount`
- If time-based: do not set usage tracking fields

**Key Logic**:

```typescript
async createLicense(data: {...}): Promise<License> {
  const plan = await this.getPlan(data.planId);
  if (!plan) throw new Error('Plan not found');
  
  const licenseData: any = {
    // ... existing fields ...
  };
  
  // Initialize usage tracking for usage-based plans
  if (plan.defaultUsageCount !== undefined) {
    licenseData.currentUsageCount = plan.defaultUsageCount;
    licenseData.totalUsageCount = plan.defaultUsageCount;
  }
  
  // ... rest of creation logic ...
}
```

#### 1.4 Create Consumption Endpoint

**File**: `api/routes/consume.ts` (NEW)

**Create new file** with consumption endpoint:

```typescript
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

export async function consumeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as { key: string; amount: number };
      const productId = request.headers['product-id'] as string;
      
      // Validation
      if (!productId) {
        reply.code(400).send({ error: 'product-id header is required' });
        return;
      }
      
      if (!body.key || !body.amount) {
        reply.code(400).send({ error: 'key and amount are required' });
        return;
      }
      
      if (body.amount <= 0 || !Number.isInteger(body.amount)) {
        reply.code(400).send({ error: 'amount must be a positive integer' });
        return;
      }
      
      // Use transaction for atomic consumption
      const result = await getService().consumeUsage(body.key, productId, body.amount);
      
      if (!result.success) {
        reply.code(result.statusCode || 400).send({ error: result.error });
        return;
      }
      
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
```

#### 1.5 Add Consumption Service Method

**File**: `api/services/firestore.ts`

**Add new method**:

```typescript
async consumeUsage(key: string, productId: string, amount: number): Promise<{
  success: boolean;
  remaining?: number;
  error?: string;
  statusCode?: number;
}> {
  return this.db.runTransaction(async (transaction) => {
    // Find license by key
    const licensesRef = this.db.collection('licenses');
    const snapshot = await transaction.get(
      licensesRef.where('key', '==', key).limit(1)
    );
    
    if (snapshot.empty) {
      return { success: false, error: 'License not found', statusCode: 404 };
    }
    
    const licenseDoc = snapshot.docs[0];
    const licenseRef = licenseDoc.ref;
    const license = licenseDoc.data() as License;
    
    // Validate product-id
    if (license.productId !== productId) {
      return { success: false, error: 'Product mismatch', statusCode: 400 };
    }
    
    // Validate status
    if (license.status !== LicenseStatus.ACTIVE) {
      return { success: false, error: 'License is not active', statusCode: 409 };
    }
    
    // Check expiration (usage-based vs time-based)
    const isUsageBased = license.currentUsageCount !== undefined;
    if (isUsageBased) {
      if (license.currentUsageCount === 0) {
        return { success: false, error: 'License has no usages remaining', statusCode: 409 };
      }
      if (license.currentUsageCount < amount) {
        return { success: false, error: 'Insufficient usages', statusCode: 400 };
      }
    } else {
      // Time-based expiration check
      const expiresAt = new Date(license.expiresAt);
      if (new Date() > expiresAt) {
        return { success: false, error: 'License has expired', statusCode: 409 };
      }
    }
    
    // Consume usage (only for usage-based)
    if (isUsageBased) {
      const newCount = license.currentUsageCount - amount;
      transaction.update(licenseRef, {
        currentUsageCount: newCount,
        status: newCount === 0 ? LicenseStatus.EXPIRED : LicenseStatus.ACTIVE
      });
      
      // Log consumption
      await this.createLog({
        type: 'CONSUME',
        details: `Consumed ${amount} usages from license ${key}, remaining: ${newCount}`,
        relatedId: license.id
      });
      
      return { success: true, remaining: newCount };
    }
    
    return { success: false, error: 'License is not usage-based', statusCode: 400 };
  });
}
```

#### 1.6 Add Topup Endpoint

**File**: `api/routes/licenses.ts`

**Add new route**:

```typescript
// Topup license
fastify.post('/:id/topup', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as { amount: number };
    
    if (!body.amount || body.amount <= 0 || !Number.isInteger(body.amount)) {
      reply.code(400).send({ error: 'amount must be a positive integer' });
      return;
    }
    
    const result = await getService().topupLicense(id, body.amount);
    
    if (!result.success) {
      reply.code(result.statusCode || 400).send({ error: result.error });
      return;
    }
    
    await getService().createLog({
      type: 'TOPUP',
      details: `Topped up license ${id} with ${body.amount} usages`,
      relatedId: id
    });
    
    reply.code(200).send({
      success: true,
      license: {
        id: result.license.id,
        currentUsageCount: result.license.currentUsageCount,
        totalUsageCount: result.license.totalUsageCount
      }
    });
  } catch (error: any) {
    logger.error('❌ Topup error:', error);
    reply.code(500).send({ error: error.message || 'Failed to topup license' });
  }
});
```

#### 1.7 Add Topup Service Method

**File**: `api/services/firestore.ts`

**Add new method**:

```typescript
async topupLicense(id: string, amount: number): Promise<{
  success: boolean;
  license?: License;
  error?: string;
  statusCode?: number;
}> {
  return this.db.runTransaction(async (transaction) => {
    const licenseRef = this.db.collection('licenses').doc(id);
    const licenseDoc = await transaction.get(licenseRef);
    
    if (!licenseDoc.exists) {
      return { success: false, error: 'License not found', statusCode: 404 };
    }
    
    const license = licenseDoc.data() as License;
    
    // Validate license is usage-based
    if (license.currentUsageCount === undefined || license.totalUsageCount === undefined) {
      return { success: false, error: 'License is not usage-based', statusCode: 400 };
    }
    
    // Validate status
    if (license.status !== LicenseStatus.ACTIVE) {
      return { success: false, error: 'Only ACTIVE licenses can be topped up', statusCode: 409 };
    }
    
    // Update usage counts
    const newCurrent = license.currentUsageCount + amount;
    const newTotal = license.totalUsageCount + amount;
    
    transaction.update(licenseRef, {
      currentUsageCount: newCurrent,
      totalUsageCount: newTotal
    });
    
    return {
      success: true,
      license: {
        ...license,
        currentUsageCount: newCurrent,
        totalUsageCount: newTotal
      }
    };
  });
}
```

#### 1.8 Register Consumption Routes

**File**: `api/index.ts`

**Add** (after validation routes, before protected routes):

```typescript
import { consumeRoutes } from './routes/consume';

// ... existing code ...

// Consumption routes (Public)
fastify.register(consumeRoutes, { prefix: '/api/consume' });
```

### Phase 2: Frontend Updates

#### 2.1 Update Plan Creation Form

**File**: `web/pages/Plans.tsx`

**Changes**:
- Add radio button or toggle for plan type (usage-based vs time-based)
- Conditionally show `defaultUsageCount` input for usage-based plans
- Conditionally show `durationDays` and `deviceLimit` inputs for time-based plans
- Add validation to ensure mutual exclusivity

#### 2.2 Update License Display

**File**: `web/pages/Licenses.tsx`

**Changes**:
- Display `currentUsageCount` and `totalUsageCount` for usage-based licenses
- Display `defaultUsageCount` in plan details
- Add "Topup" button/action for usage-based licenses
- Show usage progress/remaining

#### 2.3 Add Topup UI

**File**: `web/pages/Licenses.tsx`

**Add**:
- Modal/form for topup amount input
- Call to topup API endpoint
- Refresh license list after topup

#### 2.4 Update API Service

**File**: `web/services/api.ts`

**Add methods**:

```typescript
export const api = {
  // ... existing methods ...
  
  consume: {
    consume: async (key: string, amount: number, productId: string): Promise<{
      success: boolean;
      remaining: number;
      message: string;
    }> => {
      return fetchApi('/api/consume', {
        method: 'POST',
        headers: {
          'product-id': productId
        },
        body: JSON.stringify({ key, amount })
      });
    }
  },
  
  licenses: {
    // ... existing methods ...
    topup: async (id: string, amount: number): Promise<{
      success: boolean;
      license: {
        id: string;
        currentUsageCount: number;
        totalUsageCount: number;
      };
    }> => {
      return fetchApi(`/api/licenses/${id}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
    }
  }
};
```

## Testing Checklist

### Backend Testing

- [ ] Create usage-based plan with `defaultUsageCount`
- [ ] Create time-based plan (should reject if `defaultUsageCount` present)
- [ ] Create license from usage-based plan (verify usage counts initialized)
- [ ] Consume usages (verify atomic decrement)
- [ ] Consume more than available (should reject)
- [ ] Consume with wrong product-id (should reject)
- [ ] Topup license (verify both counts increase)
- [ ] Topup expired license (should reject)
- [ ] Concurrent consumption requests (verify no over-consumption)

### Frontend Testing

- [ ] Create usage-based plan via UI
- [ ] View usage counts in license list
- [ ] Topup license via UI
- [ ] Verify plan type exclusivity validation in form

## Common Pitfalls

1. **Type Sync**: Remember to update both `api/types.ts` and `web/types.ts` when changing types
2. **Transaction Retries**: Firestore transactions automatically retry on conflicts - ensure idempotent operations
3. **Plan Type Detection**: Use `defaultUsageCount !== undefined` to detect usage-based plans, not truthy check (could be 0)
4. **Expiration Logic**: Usage-based licenses expire when `currentUsageCount === 0`, not based on `expiresAt`
5. **Header Validation**: Always validate `product-id` header before processing consumption requests

## Next Steps

After implementation:
1. Test all endpoints manually
2. Verify concurrent consumption scenarios
3. Update API documentation
4. Deploy to staging environment
5. Run `/speckit.tasks` to create detailed task breakdown

