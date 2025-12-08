import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isFirebaseInitialized = false;
let dbConnectionError: string | null = null;

// Check if the Firebase API key is loaded
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseInitialized = true;
    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    dbConnectionError = error instanceof Error ? error.message : "Unknown Firebase initialization error";
    isFirebaseInitialized = false;
  }
} else {
  const missingVars = [];
  if (!firebaseConfig.apiKey) missingVars.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.authDomain) missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
  
  dbConnectionError = `Firebase configuration is missing. Required environment variables: ${missingVars.join(', ')}`;
  console.error("❌", dbConnectionError);
  isFirebaseInitialized = false;
}

// Verify database connection by attempting to read from a collection
export const verifyDatabaseConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  if (!isFirebaseInitialized || !db) {
    return { 
      connected: false, 
      error: dbConnectionError || "Firestore database is not initialized" 
    };
  }

  try {
    // Try to read from a collection to verify database connection
    // This will fail if the database doesn't exist or is unreachable
    // Note: Empty collections or permission errors will still allow connection verification
    // as long as the database exists
    await getDocs(collection(db, 'products'));
    console.log("✅ Database connection verified");
    return { connected: true };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "Unknown database connection error";
    const errorCode = error?.code || '';
    
    console.error("❌ Database connection verification failed:", errorMessage, "Code:", errorCode);
    
    // Permission denied is OK for connection check - it means DB exists but rules need fixing
    // We'll allow the app to start and show better errors when actually trying to save
    if (errorCode === 'permission-denied' || errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
      console.warn("⚠️ Permission denied, but database exists. Security rules may need configuration.");
      // Allow connection but warn about rules
      return { 
        connected: true,  // DB exists, just need to fix rules
        error: undefined
      };
    }
    
    // Other errors mean DB might not exist or connection failed
    return { 
      connected: false, 
      error: `Cannot connect to Firestore database: ${errorMessage}. Please ensure the database exists in your Firebase project.` 
    };
  }
};

export { db, auth, isFirebaseInitialized, dbConnectionError };
