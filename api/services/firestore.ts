import { Firestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, isAbsolute } from 'path';
import { logger } from '../logger';
import { Product, Plan, License, LicenseStatus, LogEvent } from '../types';

// Lazy initialization - store the Firestore instance
let firestoreInstance: Firestore | null = null;

// Initialize Firebase Admin and return Firestore instance
export function initializeFirestore(): Firestore {
  if (getApps().length === 0) {
    try {
      // Debug: Log all environment variables related to Firebase
      logger.info('🔍 Checking Firebase configuration...');
      logger.info(`   GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'not set'}`);
      logger.info(`   FIREBASE_SERVICE_ACCOUNT: ${process.env.FIREBASE_SERVICE_ACCOUNT ? 'set (hidden)' : 'not set'}`);
      logger.info(`   FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || 'not set'}`);
      
      let appConfig: any = undefined;

      // Option 1: Service Account JSON from environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          if (!serviceAccount.project_id) {
            throw new Error('Service account JSON missing project_id field');
          }
          appConfig = {
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id
          };
          logger.info('✅ Using Firebase Service Account from environment variable');
          logger.info(`   Project ID: ${serviceAccount.project_id}`);
        } catch (parseError: any) {
          logger.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseError.message);
          throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON format: ${parseError.message}`);
        }
      }
      // Option 2: Service Account file path
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
          logger.info(`📁 Attempting to read service account from: ${filePath}`);
          
          // Resolve relative paths
          const resolvedPath = isAbsolute(filePath) 
            ? filePath 
            : resolve(process.cwd(), filePath);
          
          logger.info(`📁 Resolved path: ${resolvedPath}`);
          
          const serviceAccountContent = readFileSync(resolvedPath, 'utf8');
          const serviceAccount = JSON.parse(serviceAccountContent);
          
          if (!serviceAccount.project_id) {
            throw new Error('Service account JSON missing project_id field');
          }
          
          appConfig = {
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id
          };
          logger.info('✅ Using Firebase Service Account from file');
          logger.info(`   Project ID: ${serviceAccount.project_id}`);
          logger.info(`   Client Email: ${serviceAccount.client_email}`);
        } catch (fileError: any) {
          logger.error('❌ Failed to read service account file:', fileError.message);
          logger.error(`   File path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
          if (fileError.code === 'ENOENT') {
            throw new Error(`Service account file not found: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
          }
          throw new Error(`Cannot read service account file: ${fileError.message}`);
        }
      }
      // Option 3: Use Firebase config from environment (same as frontend)
      else if (process.env.FIREBASE_PROJECT_ID) {
        appConfig = {
          projectId: process.env.FIREBASE_PROJECT_ID
        };
        // If we have a service account path, use it; otherwise try default credentials
        if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
          try {
            const serviceAccountContent = readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
            const serviceAccount = JSON.parse(serviceAccountContent);
            appConfig.credential = cert(serviceAccount);
            logger.info('✅ Using Firebase config with service account from file');
          } catch (fileError) {
            logger.error({ error: fileError }, '❌ Failed to read service account file');
            throw new Error(`Cannot read service account file: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`);
          }
        } else {
          logger.info('✅ Using Firebase config with default credentials');
        }
      }
      // Option 4: Use default credentials (for Google Cloud/Firebase App Hosting environments)
      else {
        logger.info('🔧 Using Application Default Credentials (Cloud Run/App Hosting environment)...');
        // In Cloud Run, we can just initialize without explicit credentials
        // The environment will provide default credentials automatically
        logger.warn('💡 Set FIREBASE_SERVICE_ACCOUNT, GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_PROJECT_ID');
      }

      if (appConfig) {
        if (!appConfig.projectId) {
          throw new Error('Project ID is required but not found in configuration');
        }
        initializeApp(appConfig);
        logger.info(`✅ Firebase Admin initialized with project: ${appConfig.projectId}`);
      } else {
        logger.warn('⚠️ No app config found, attempting to initialize with default credentials...');
        try {
          initializeApp();
          logger.info('✅ Firebase Admin initialized with default credentials');
        } catch (defaultError: any) {
          logger.error('❌ Default credentials also failed:', defaultError.message);
          throw new Error('Firebase Admin initialization failed. Please configure credentials.');
        }
      }
    } catch (error: any) {
      logger.error('❌ Firebase Admin initialization failed:', error);
      logger.error('💡 Please configure Firebase Admin using one of these methods:');
      logger.error('   1. Set FIREBASE_SERVICE_ACCOUNT environment variable with service account JSON');
      logger.error('   2. Set GOOGLE_APPLICATION_CREDENTIALS to path of service account JSON file');
      logger.error('   3. Set FIREBASE_PROJECT_ID (and optionally FIREBASE_SERVICE_ACCOUNT_PATH)');
      logger.error('   4. Use default credentials (for Google Cloud environments)');
      throw new Error(`Firebase Admin initialization failed: ${error.message}`);
    }
  }
  
  // Connect to the "licenses" database (not the default database)
  // Firebase Admin SDK uses "(default)" database by default, but your database is named "licenses"
  return getFirestore('licenses');
}

// Get Firestore instance with lazy initialization
export function getFirestoreInstance(): Firestore {
  if (!firestoreInstance) {
    try {
      firestoreInstance = initializeFirestore();
    } catch (error: any) {
      logger.error('❌ Failed to get Firestore instance:', error.message);
      logger.error('   Stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
      throw error;
    }
  }
  return firestoreInstance;
}

export class FirestoreService {
  constructor(private db: Firestore) {}

  // Products
  async getAllProducts(): Promise<Product[]> {
    try {
      logger.info('📊 Querying Firestore collection: products');
      const snapshot = await this.db.collection('products').get();
      logger.info(`📊 Retrieved ${snapshot.docs.length} product documents`);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
    } catch (error: any) {
      logger.error({
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details
      }, '❌ Firestore getAllProducts error');
      
      // If collection doesn't exist, return empty array (Firestore creates collections on first write)
      if (error.code === 5 || error.code === 'NOT_FOUND' || error.message?.includes('NOT_FOUND')) {
        logger.warn('⚠️ Products collection not found - returning empty array (collection will be created on first write)');
        return [];
      }
      
      throw error;
    }
  }

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    try {
      logger.info({ name: data.name, code: data.code }, '📝 Creating product in Firestore');
      const docRef = await this.db.collection('products').add(data);
      logger.info(`✅ Product created successfully with ID: ${docRef.id}`);
      return {
        id: docRef.id,
        ...data,
      };
    } catch (error: any) {
      logger.error('❌ Firestore createProduct error:');
      logger.error(`   Message: ${error.message}`);
      logger.error(`   Code: ${error.code}`);
      logger.error(`   Status: ${error.status}`);
      if (error.details) {
        logger.error(`   Details: ${JSON.stringify(error.details)}`);
      }
      if (error.stack) {
        logger.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
      
      // If database doesn't exist
      if (error.code === 5 || error.code === 'NOT_FOUND' || error.message?.includes('NOT_FOUND')) {
        throw new Error(
          'Firestore database not found. Please enable Firestore in Firebase Console.'
        );
      }
      
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.collection('products').doc(id).delete();
  }

  // Plans
  async getAllPlans(): Promise<Plan[]> {
    const snapshot = await this.db.collection('plans').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Plan[];
  }

  async createPlan(data: Omit<Plan, 'id'>): Promise<Plan> {
    const planData: Omit<Plan, 'id'> = {
      productId: data.productId,
      name: data.name,
      features: data.features || [],
      price: data.price || 0,
    };

    // Add fields based on plan type
    if (data.defaultUsageCount !== undefined) {
      planData.defaultUsageCount = data.defaultUsageCount;
    } else {
      planData.durationDays = data.durationDays;
      planData.deviceLimit = data.deviceLimit;
    }

    const docRef = await this.db.collection('plans').add(planData);
    return {
      id: docRef.id,
      ...planData,
    };
  }

  async deletePlan(id: string): Promise<void> {
    await this.db.collection('plans').doc(id).delete();
  }

  async getPlan(id: string): Promise<Plan | null> {
    const doc = await this.db.collection('plans').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    } as Plan;
  }

  // Helper methods for usage-based plans
  isUsageBasedPlan(plan: Plan): boolean {
    return plan.defaultUsageCount !== undefined;
  }

  initializeUsageTracking(plan: Plan): { currentUsageCount: number; totalUsageCount: number } | null {
    if (this.isUsageBasedPlan(plan) && plan.defaultUsageCount !== undefined) {
      return {
        currentUsageCount: plan.defaultUsageCount,
        totalUsageCount: plan.defaultUsageCount,
      };
    }
    return null;
  }

  // Licenses
  async getAllLicenses(): Promise<License[]> {
    try {
      logger.info('📊 Querying Firestore collection: licenses');
      const snapshot = await this.db.collection('licenses').get();
      logger.info(`📊 Retrieved ${snapshot.docs.length} license documents`);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as License[];
    } catch (error: any) {
      logger.error({
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      }, '❌ Firestore getAllLicenses error');
      
      // If collection doesn't exist, return empty array (Firestore creates collections on first write)
      if (error.code === 5 || error.code === 'NOT_FOUND' || error.message?.includes('NOT_FOUND')) {
        logger.warn('⚠️ Licenses collection not found - returning empty array (collection will be created on first write)');
        return [];
      }
      
      throw error;
    }
  }

  async getLicenseByKey(key: string): Promise<License | null> {
    const snapshot = await this.db.collection('licenses')
      .where('key', '==', key)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as License;
  }

  async createLicense(data: Omit<License, 'id' | 'key' | 'status' | 'activations' | 'issuedAt' | 'expiresAt' | 'currentUsageCount' | 'totalUsageCount'>): Promise<License> {
    const plan = await this.getPlan(data.planId);
    if (!plan) throw new Error('Plan not found');

    const now = new Date();
    const licenseData: any = {
      ...data,
      key: this.generateKey(),
      status: LicenseStatus.ACTIVE,
      activations: [],
      issuedAt: now.toISOString(),
    };

    // Handle usage-based vs time-based plans
    if (this.isUsageBasedPlan(plan)) {
      // Usage-based plan: initialize usage tracking, set expiresAt far in future
      const usageTracking = this.initializeUsageTracking(plan);
      if (usageTracking) {
        licenseData.currentUsageCount = usageTracking.currentUsageCount;
        licenseData.totalUsageCount = usageTracking.totalUsageCount;
      }
      // Set expiresAt far in future (not used for expiration logic, but required field)
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);
      licenseData.expiresAt = farFuture.toISOString();
    } else {
      // Time-based plan: calculate expiresAt from durationDays, no usage tracking
      if (plan.durationDays === undefined) {
        throw new Error('Time-based plan must have durationDays');
      }
      const expires = new Date();
      expires.setDate(now.getDate() + plan.durationDays);
      licenseData.expiresAt = expires.toISOString();
      // Do not set currentUsageCount or totalUsageCount for time-based plans
    }

    const docRef = await this.db.collection('licenses').add(licenseData);
    return {
      id: docRef.id,
      ...licenseData,
    } as License;
  }

  async renewLicense(id: string): Promise<void> {
    return this.db.runTransaction(async (transaction) => {
      const licenseRef = this.db.collection('licenses').doc(id);
      const licenseDoc = await transaction.get(licenseRef);
      
      if (!licenseDoc.exists) throw new Error('License not found');
      const license = licenseDoc.data() as License;

      const plan = await this.getPlan(license.planId);
      if (!plan) throw new Error('Plan not found');

      // Only renew time-based plans
      if (plan.durationDays === undefined) {
        throw new Error('Cannot renew usage-based plan. Use topup instead.');
      }

      const currentExpiry = new Date(license.expiresAt);
      const now = new Date();
      const baseDate = currentExpiry > now ? currentExpiry : now;
      baseDate.setDate(baseDate.getDate() + plan.durationDays);

      transaction.update(licenseRef, {
        expiresAt: baseDate.toISOString(),
        status: LicenseStatus.ACTIVE,
      });
    });
  }

  async cancelLicense(id: string): Promise<void> {
    await this.db.collection('licenses').doc(id).update({
      status: LicenseStatus.CANCELLED,
    });
  }

  async consumeUsage(key: string, productId: string, amount: number): Promise<{
    success: boolean;
    remaining?: number;
    error?: string;
    code?: string;
    statusCode?: number;
  }> {
    return this.db.runTransaction(async (transaction) => {
      // Find license by key
      const licensesRef = this.db.collection('licenses');
      const snapshot = await transaction.get(
        licensesRef.where('key', '==', key).limit(1)
      );
      
      if (snapshot.empty) {
        return { 
          success: false, 
          error: 'License not found', 
          code: 'LICENSE_NOT_FOUND',
          statusCode: 404 
        };
      }
      
      const licenseDoc = snapshot.docs[0];
      const licenseRef = licenseDoc.ref;
      const license = licenseDoc.data() as License;
      
      // Validate product-id header matches license productId
      if (license.productId !== productId) {
        return { 
          success: false, 
          error: 'Product mismatch. The product-id header does not match the license product.', 
          code: 'PRODUCT_MISMATCH',
          statusCode: 400 
        };
      }
      
      // Validate license status
      if (license.status !== LicenseStatus.ACTIVE) {
        return { 
          success: false, 
          error: 'License is not active', 
          code: 'LICENSE_INACTIVE',
          statusCode: 409 
        };
      }
      
      // Check if license is usage-based
      const isUsageBased = license.currentUsageCount !== undefined;
      
      if (!isUsageBased) {
        // For time-based licenses, check expiration
        const expiresAt = new Date(license.expiresAt);
        if (new Date() > expiresAt) {
          // Update status to expired
          transaction.update(licenseRef, { status: LicenseStatus.EXPIRED });
          return { 
            success: false, 
            error: 'License has expired', 
            code: 'LICENSE_EXPIRED',
            statusCode: 409 
          };
        }
        return { 
          success: false, 
          error: 'License is not usage-based', 
          code: 'NOT_USAGE_BASED',
          statusCode: 400 
        };
      }
      
      // Validate usage-based expiration (currentUsageCount > 0)
      // We know currentUsageCount exists because isUsageBased check passed
      const currentUsage = license.currentUsageCount!;
      if (currentUsage === 0) {
        // Update status to expired
        transaction.update(licenseRef, { status: LicenseStatus.EXPIRED });
        return { 
          success: false, 
          error: 'License has no usages remaining', 
          code: 'LICENSE_EXPIRED',
          statusCode: 409 
        };
      }
      
      // Validate sufficient usage available
      if (currentUsage < amount) {
        return { 
          success: false, 
          error: `Insufficient usages. Available: ${currentUsage}, Requested: ${amount}`, 
          code: 'INSUFFICIENT_USAGE',
          statusCode: 400 
        };
      }
      
      // Consume usage atomically
      const newCount = currentUsage - amount;
      const updateData: any = {
        currentUsageCount: newCount,
      };
      
      // If usage exhausted, mark as expired
      if (newCount === 0) {
        updateData.status = LicenseStatus.EXPIRED;
      }
      
      transaction.update(licenseRef, updateData);
      
      // Log consumption (outside transaction for performance)
      // Note: This is done after transaction commits to avoid transaction timeout
      this.createLog({
        type: 'CONSUME',
        details: `Consumed ${amount} usages from license ${key}, remaining: ${newCount}`,
        relatedId: license.id,
      }).catch(err => {
        logger.error('Failed to log consumption:', err);
      });
      
      return { 
        success: true, 
        remaining: newCount 
      };
    });
  }

  async topupLicense(id: string, amount: number): Promise<{
    success: boolean;
    license?: License;
    error?: string;
    code?: string;
    statusCode?: number;
  }> {
    return this.db.runTransaction(async (transaction) => {
      const licenseRef = this.db.collection('licenses').doc(id);
      const licenseDoc = await transaction.get(licenseRef);
      
      if (!licenseDoc.exists) {
        return { 
          success: false, 
          error: 'License not found', 
          code: 'LICENSE_NOT_FOUND',
          statusCode: 404 
        };
      }
      
      const license = licenseDoc.data() as License;
      
      // Validate license is usage-based
      if (license.currentUsageCount === undefined || license.totalUsageCount === undefined) {
        return { 
          success: false, 
          error: 'License is not usage-based. Only usage-based licenses can be topped up.', 
          code: 'NOT_USAGE_BASED',
          statusCode: 400 
        };
      }
      
      // Validate license status (must be ACTIVE)
      if (license.status !== LicenseStatus.ACTIVE) {
        return { 
          success: false, 
          error: 'Only ACTIVE licenses can be topped up', 
          code: 'LICENSE_INACTIVE',
          statusCode: 409 
        };
      }
      
      // Update usage counts atomically
      const newCurrent = license.currentUsageCount + amount;
      const newTotal = license.totalUsageCount + amount;
      
      transaction.update(licenseRef, {
        currentUsageCount: newCurrent,
        totalUsageCount: newTotal,
      });
      
      return {
        success: true,
        license: {
          ...license,
          currentUsageCount: newCurrent,
          totalUsageCount: newTotal,
        }
      };
    });
  }

  async updateLicenseActivations(id: string, activations: License['activations']): Promise<void> {
    await this.db.collection('licenses').doc(id).update({
      activations,
    });
  }

  async updateLicenseStatus(id: string, status: LicenseStatus): Promise<void> {
    await this.db.collection('licenses').doc(id).update({
      status,
    });
  }

  // Logs
  async getAllLogs(limitCount: number = 100): Promise<LogEvent[]> {
    try {
      logger.info('📊 Querying Firestore collection: logs');
      const snapshot = await this.db.collection('logs')
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get();
      
      logger.info(`📊 Retrieved ${snapshot.docs.length} log documents`);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LogEvent[];
    } catch (error: any) {
      logger.error({
        message: error.message,
        code: error.code,
        status: error.status
      }, '❌ Firestore getAllLogs error');
      
      // If collection doesn't exist or index missing, return empty array
      if (error.code === 5 || error.code === 'NOT_FOUND' || error.message?.includes('NOT_FOUND') || error.message?.includes('index')) {
        logger.warn('⚠️ Logs collection not found or index missing - returning empty array');
        return [];
      }
      
      throw error;
    }
  }

  async createLog(event: Omit<LogEvent, 'id' | 'timestamp'>): Promise<LogEvent> {
    const logData = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    const docRef = await this.db.collection('logs').add(logData);
    return {
      id: docRef.id,
      ...logData,
    };
  }

  // Helper
  private generateKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = () => Array.from({ length: 4 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    return `${segment()}-${segment()}-${segment()}-${segment()}`;
  }
}

