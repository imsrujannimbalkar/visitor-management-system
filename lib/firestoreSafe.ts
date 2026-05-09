import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export const safely = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await promise;
  } catch (error: any) {
    if (error.code === 5 || error.code === 7) {
      console.warn("Firestore Database not found or permission denied. Defaulting to safe fallback.", error.message);
      return fallback;
    }
    throw error;
  }
};
export const getFallback: any = { exists: false, data: () => undefined, docs: [], empty: true, forEach: () => {} };
export const setFallback: any = undefined;

let db: admin.firestore.Firestore | null = null;

const getCredential = (projectId?: string) => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } catch (e) {}
  }
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && projectId) {
    return admin.credential.cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  try {
    return admin.credential.applicationDefault();
  } catch (e) {
    return undefined;
  }
};

export const getAdminDb = () => {
  if (db) return db;
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  let dbId = '(default)';
  let projectId = process.env.FIREBASE_PROJECT_ID || '(default)';

  // Try multiple possible locations for the config file
  const possiblePaths = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(__dirname, '..', 'firebase-applet-config.json'),
    path.join(__dirname, 'firebase-applet-config.json'),
    '/app/firebase-applet-config.json'
  ];

  let configFound = false;
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const config = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (config.firestoreDatabaseId) {
          dbId = config.firestoreDatabaseId;
        }
        if (config.projectId && (projectId === '(default)' || !process.env.FIREBASE_PROJECT_ID)) {
          projectId = config.projectId;
        }
        console.log(`[FirestoreInit] Loaded config from: ${p}`);
        console.log(`[FirestoreInit] Using Project: ${projectId}, Database: ${dbId}`);
        configFound = true;
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  if (!configFound) {
    console.warn('[FirestoreInit] WARNING: firebase-applet-config.json not found in expected paths. Falling back to environment variables.');
  }

  if (!admin.apps.length) {
    const creds = getCredential(projectId === '(default)' ? undefined : projectId);
    const options: admin.AppOptions = { projectId };
    
    // Attempt to find storageBucket
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          const config = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (config.storageBucket) {
            options.storageBucket = config.storageBucket;
            console.log(`[FirestoreInit] Using Storage Bucket: ${config.storageBucket}`);
          }
          break;
        }
      } catch (e) {}
    }

    if (creds) {
        options.credential = creds;
        console.log('[FirestoreInit] Initializing with explicit credentials');
    } else {
        console.warn('[FirestoreInit] No explicit credentials found, relying on application default');
    }
    admin.initializeApp(options);
  } else {
      console.log('[FirestoreInit] Admin app already initialized, reusing default app');
  }

  const app = admin.app();
  
  // Verify project ID match
  if (app.options.projectId && projectId !== '(default)' && app.options.projectId !== projectId) {
      console.warn(`[FirestoreInit] Mismatch between requested Project ID (${projectId}) and initialized Project ID (${app.options.projectId})`);
  }

  db = getFirestore(app, dbId);
  console.log(`[FirestoreInit] Firestore client initialized for database: ${dbId}`);
  return db;
};
