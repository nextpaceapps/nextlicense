import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { Product, Plan, License, LicenseStatus, LogEvent, ValidationResponse, Activation } from '../types';

// Helper to generate a key
const generateKey = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
};

// ==========================================
// FIRESTORE IMPLEMENTATION
// ==========================================
// Helper to safely get db or throw
const getDB = () => {
    if (!db) throw new Error("Firestore database is not initialized. Please check your Firebase configuration.");
    return db;
};

const mapDoc = <T>(doc: any): T => ({ id: doc.id, ...doc.data() });

// Firestore Collections:
// - products: Product documents
// - plans: Plan documents
// - licenses: License documents
// - logs: LogEvent documents

export const Backend = {
  products: {
    getAll: async (): Promise<Product[]> => {
      try {
        const snapshot = await getDocs(collection(getDB(), 'products'));
        return snapshot.docs.map(d => mapDoc<Product>(d));
      } catch (error: any) {
        console.error('❌ Error fetching products:', error);
        
        // Check for permission denied errors
        if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('PERMISSION_DENIED')) {
          throw new Error(
            'Permission denied. Please check your Firestore security rules. ' +
            'You need to allow reads from the "products" collection.'
          );
        }
        
        throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    add: async (item: Omit<Product, 'id'>) => {
      try {
        const docRef = await addDoc(collection(getDB(), 'products'), item);
        console.log('✅ Product added successfully:', docRef.id);
        return { id: docRef.id, ...item };
      } catch (error: any) {
        console.error('❌ Error adding product:', error);
        
        // Check for permission denied errors
        if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('PERMISSION_DENIED')) {
          throw new Error(
            'Permission denied. Please check your Firestore security rules. ' +
            'You need to allow writes to the "products" collection. ' +
            'See the browser console for more details.'
          );
        }
        
        throw new Error(`Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(getDB(), 'products', id));
      } catch (error) {
        console.error('Error deleting product:', error);
        throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },
  plans: {
    getAll: async (): Promise<Plan[]> => {
      try {
        const snapshot = await getDocs(collection(getDB(), 'plans'));
        return snapshot.docs.map(d => mapDoc<Plan>(d));
      } catch (error) {
        console.error('Error fetching plans:', error);
        throw new Error(`Failed to fetch plans: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    add: async (item: Omit<Plan, 'id'>) => {
      try {
        const docRef = await addDoc(collection(getDB(), 'plans'), item);
        return { id: docRef.id, ...item };
      } catch (error) {
        console.error('Error adding plan:', error);
        throw new Error(`Failed to add plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(getDB(), 'plans', id));
      } catch (error) {
        console.error('Error deleting plan:', error);
        throw new Error(`Failed to delete plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },
  licenses: {
    getAll: async (): Promise<License[]> => {
      try {
        const snapshot = await getDocs(collection(getDB(), 'licenses'));
        return snapshot.docs.map(d => mapDoc<License>(d));
      } catch (error) {
        console.error('Error fetching licenses:', error);
        throw new Error(`Failed to fetch licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    getByKey: async (key: string): Promise<License | undefined> => {
      try {
        const q = query(collection(getDB(), 'licenses'), where('key', '==', key));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return undefined;
        return mapDoc<License>(snapshot.docs[0]);
      } catch (error) {
        console.error('Error fetching license by key:', error);
        throw new Error(`Failed to fetch license: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    add: async (item: Omit<License, 'id' | 'key' | 'status' | 'activations' | 'issuedAt' | 'expiresAt'>) => {
      try {
        const planRef = doc(getDB(), 'plans', item.planId);
        const planSnap = await getDoc(planRef);
        if (!planSnap.exists()) throw new Error("Plan not found");
        const plan = planSnap.data() as Plan;

        const now = new Date();
        const expires = new Date();
        expires.setDate(now.getDate() + plan.durationDays);

        const newItem = {
          ...item,
          key: generateKey(),
          status: LicenseStatus.ACTIVE,
          activations: [],
          issuedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        };
        
        const docRef = await addDoc(collection(getDB(), 'licenses'), newItem);
        await Backend.logs.add({ type: 'ISSUE', details: `Issued license ${newItem.key} to ${newItem.userEmail}` });
        return { id: docRef.id, ...newItem } as License;
      } catch (error) {
        console.error('Error adding license:', error);
        throw new Error(`Failed to add license: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    renew: async (id: string) => {
      try {
        await runTransaction(getDB(), async (transaction: any) => {
          const licenseRef = doc(getDB(), 'licenses', id);
          const licenseDoc = await transaction.get(licenseRef);
          if (!licenseDoc.exists()) throw new Error("License not found");
          
          const license = licenseDoc.data() as License;
          const planRef = doc(getDB(), 'plans', license.planId);
          const planDoc = await transaction.get(planRef);
          if (!planDoc.exists()) throw new Error("Plan not found");
          const plan = planDoc.data() as Plan;

          const currentExpiry = new Date(license.expiresAt);
          const now = new Date();
          const baseDate = currentExpiry > now ? currentExpiry : now;
          baseDate.setDate(baseDate.getDate() + plan.durationDays);
          
          transaction.update(licenseRef, {
            expiresAt: baseDate.toISOString(),
            status: LicenseStatus.ACTIVE
          });
        });
        await Backend.logs.add({ type: 'RENEW', details: `Renewed license (ID: ${id})` });
      } catch (error) {
        console.error('Error renewing license:', error);
        throw new Error(`Failed to renew license: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    cancel: async (id: string) => {
      try {
        await updateDoc(doc(getDB(), 'licenses', id), {
          status: LicenseStatus.CANCELLED
        });
        await Backend.logs.add({ type: 'CANCEL', details: `Cancelled license (ID: ${id})` });
      } catch (error) {
        console.error('Error cancelling license:', error);
        throw new Error(`Failed to cancel license: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },
  logs: {
    getAll: async (): Promise<LogEvent[]> => {
      try {
        const q = query(collection(getDB(), 'logs'), orderBy('timestamp', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => mapDoc<LogEvent>(d));
      } catch (error) {
        console.error('Error fetching logs:', error);
        throw new Error(`Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    add: async (event: Omit<LogEvent, 'id' | 'timestamp'>) => {
      try {
        await addDoc(collection(getDB(), 'logs'), {
          ...event,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error adding log:', error);
        throw new Error(`Failed to add log: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};

export const validateLicenseLogic = async (key: string, deviceId: string): Promise<ValidationResponse> => {
    try {
        return await runTransaction(getDB(), async (transaction: any) => {
          const q = query(collection(getDB(), 'licenses'), where('key', '==', key));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
             await Backend.logs.add({ type: 'ERROR', details: `Validation failed: Invalid key ${key}` });
             return { valid: false, message: "Invalid License Key" };
          }
    
          const licenseDocRef = snapshot.docs[0].ref;
          const license = snapshot.docs[0].data() as License;
    
          if (license.status === LicenseStatus.CANCELLED) {
            await Backend.logs.add({ type: 'VALIDATE', details: `Validation failed: Cancelled key ${key}` });
            return { valid: false, message: "License has been cancelled" };
          }
    
          const now = new Date();
          const expiresAt = new Date(license.expiresAt);
    
          if (now > expiresAt) {
            if (license.status !== LicenseStatus.EXPIRED) {
              transaction.update(licenseDocRef, { status: LicenseStatus.EXPIRED });
            }
            await Backend.logs.add({ type: 'EXPIRE', details: `Validation failed: Expired key ${key}` });
            return { valid: false, message: "License has expired" };
          }
    
          const planDocRef = doc(getDB(), 'plans', license.planId);
          const planDoc = await transaction.get(planDocRef);
          if (!planDoc.exists()) return { valid: false, message: "Internal Error: Plan missing" };
          const plan = planDoc.data() as Plan;
    
          const existingDeviceIndex = license.activations.findIndex((a: Activation) => a.deviceId === deviceId);
    
          if (existingDeviceIndex === -1) {
            if (license.activations.length >= plan.deviceLimit) {
              await Backend.logs.add({ type: 'VALIDATE', details: `Device limit reached for ${key}` });
              return { valid: false, message: `Device limit reached. Max ${plan.deviceLimit} devices allowed.` };
            }
            const newActivation = {
              deviceId,
              activatedAt: now.toISOString(),
              lastUsedAt: now.toISOString()
            };
            transaction.update(licenseDocRef, {
              activations: [...license.activations, newActivation]
            });
            await Backend.logs.add({ type: 'VALIDATE', details: `New device activated: ${deviceId}` });
          } else {
            const updatedActivations = [...license.activations];
            updatedActivations[existingDeviceIndex] = {
                ...updatedActivations[existingDeviceIndex],
                lastUsedAt: now.toISOString()
            };
            transaction.update(licenseDocRef, { activations: updatedActivations });
          }
    
          const productDocRef = doc(getDB(), 'products', license.productId);
          const productDoc = await transaction.get(productDocRef);
          const product = productDoc.data() as Product;
    
          return {
            valid: true,
            message: "License Valid",
            license: {
              status: license.status,
              productName: product?.name || 'Unknown',
              planName: plan.name,
              expiresAt: license.expiresAt,
              features: plan.features,
              daysRemaining: Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            }
          };
        });
      } catch (e) {
        console.error('Validation error:', e);
        return { valid: false, message: "Validation Error: " + (e as Error).message };
      }
};

export const seedData = async () => {
    // Simple check to see if we have products
    const prods = await Backend.products.getAll();
    if (prods.length === 0) {
        console.log("Seeding Database...");
        const prod = await Backend.products.add({ name: 'SuperAdmin Tool', code: 'SA-01', description: 'Internal admin dashboard utility' });
        await Backend.plans.add({ productId: prod.id, name: 'Basic', durationDays: 30, deviceLimit: 1, features: ['read_only'], price: 0 });
        await Backend.plans.add({ productId: prod.id, name: 'Pro', durationDays: 365, deviceLimit: 5, features: ['read_write', 'export', 'api_access'], price: 100 });
    }
};
