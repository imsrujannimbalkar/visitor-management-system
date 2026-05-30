import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import configData from '../firebase-applet-config.json';

const config = configData as any;

// Configuration priority: Environment Variables > JSON Config > Defaults/Mock
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || config.appId,
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || config.measurementId,
};

const databaseId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || config.firestoreDatabaseId;

const placeholders = ['YOUR_API_KEY', 'YOUR_PROJECT_ID', 'mock'];

// Check if config is actually filled
const isConfigValid = firebaseConfig.apiKey && 
                     !placeholders.includes(firebaseConfig.apiKey) &&
                     firebaseConfig.projectId &&
                     !placeholders.includes(firebaseConfig.projectId);

if (!isConfigValid) {
}

const app = initializeApp(isConfigValid ? firebaseConfig : {
  apiKey: "mock",
  authDomain: "mock.firebaseapp.com",
  projectId: "mock",
  storageBucket: "mock.appspot.com",
  messagingSenderId: "mock",
  appId: "mock"
});

export const isConfigured = isConfigValid;
export const auth = getAuth(app);


// Use database ID from config with long polling for proxy compatibility
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId || '(default)');

export const googleProvider = new GoogleAuthProvider();

// Error Handling Pattern
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isPermissionError = error instanceof Error && error.message.toLowerCase().includes('permission');
  const isUnauthenticated = !auth.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }

  // Silence "Permission Denied" errors that occur during logout/unauthenticated states or expected lists
  if (isPermissionError) {
    if (isUnauthenticated || operationType === OperationType.LIST || operationType === OperationType.GET) {
      // Quietly suppress expected permission failures to keep console clean
      return;
    }
  }

  // Use stringification for graceful object handling without crashing
  if (import.meta.env.DEV) {
  } else {
    // Basic log in prod to not expose sensitive user info object structure
  }
}

// Optional: Initial connectivity check - fail silently
import { getDocFromServer, doc } from 'firebase/firestore';
if (isConfigured) {
  getDocFromServer(doc(db, '_connection_test_', 'ping')).catch(() => {});
}

export default app;
