import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
// import { calendarService } from './calendar.js';
// import { sheetsService } from './sheets.js';
// import { getGoogleAuthClient, getFreshAccessToken, generateAuthUrl, exchangeAuthCode, validateTokens } from './lib/googleAuth.js';
import { safely, getFallback, setFallback, getAdminDb } from './lib/firestoreSafe.js';
import { google } from 'googleapis';

// Determine the current directory correctly for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin Initialization
const adminDb = getAdminDb();
const projectId = admin.app().options.projectId || process.env.FIREBASE_PROJECT_ID || '(default)';

// Automated Daily Tasks: Backups and Reminders
async function runDailyTasks() {
  if (!adminDb) return;
  console.log('[System] Running scheduled daily tasks...');
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const birthdayPattern = `-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  try {
    const orgsSnap = await safely(adminDb.collection('organizations').get(), getFallback);
    const backupData: any = {};

    for (const orgDoc of orgsSnap.docs) {
      if (!orgDoc.exists) continue;
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();
      
      // 1. Process Birthday Reminders for this Org
      const visitsSnap = await safely(orgDoc.ref.collection('visits').get(), getFallback);
      for (const visitDoc of visitsSnap.docs) {
        const v = visitDoc.data();
        if (v.dob && v.dob.includes(birthdayPattern)) {
          // Check for existing notification to avoid spam
          const id = `BIRTHDAY-${orgId}-${visitDoc.id}-${dateStr}`;
          const notifRef = orgDoc.ref.collection('notifications').doc(id);
          const notifSnap = await safely(notifRef.get(), getFallback);
          
          if (!notifSnap.exists) {
            await safely(notifRef.set({
              id,
              organizationId: orgId,
              title: 'Birthday Alert! 🎂',
              message: `${v.name} has a birthday today. Consider sending a wish!`,
              type: 'BIRTHDAY',
              visitorId: visitDoc.id,
              date: dateStr,
              timestamp: new Date().toISOString(),
              read: false,
              deleted: false
            }), undefined);
            console.log(`[Reminders] Created birthday notification for ${v.name} in ${orgId}`);
          }
        }
      }

      // 2. Process Occasions from Donations
      const donationsSnap = await safely(orgDoc.ref.collection('donations').get(), getFallback);
      for (const donationDoc of donationsSnap.docs) {
        const d = donationDoc.data();
        if (d.occasionDate && d.occasionDate.includes(birthdayPattern)) {
          const id = `OCCASION-${orgId}-${donationDoc.id}-${dateStr}`;
          const notifRef = orgDoc.ref.collection('notifications').doc(id);
          const notifSnap = await safely(notifRef.get(), getFallback);

          if (!notifSnap.exists) {
            await safely(notifRef.set({
              id,
              organizationId: orgId,
              title: `${d.occasion || 'Special Occasion'}! ✨`,
              message: `${d.visitorName}'s ${d.occasion || 'special occasion'} is today.`,
              type: 'OCCASION',
              donationId: donationDoc.id,
              date: dateStr,
              timestamp: new Date().toISOString(),
              read: false,
              deleted: false
            }), undefined);
            console.log(`[Reminders] Created occasion notification for ${d.visitorName} in ${orgId}`);
          }
        }
      }

      // 3. Process Inquiries for Follow-up Reminders
      const inquiriesSnap = await safely(orgDoc.ref.collection('inquiries')
        .where('status', '==', 'PENDING')
        .where('deleted', '!=', true)
        .get(), getFallback);
        
      for (const inquiryDoc of inquiriesSnap.docs) {
        const inquiry = inquiryDoc.data();
        if (inquiry.followUpDate && inquiry.followUpDate <= dateStr) {
          const id = `FOLLOW-UP-${orgId}-${inquiryDoc.id}-${dateStr}`;
          const notifRef = orgDoc.ref.collection('notifications').doc(id);
          const notifSnap = await safely(notifRef.get(), getFallback);
          
          if (!notifSnap.exists) {
            const isOverdue = inquiry.followUpDate < dateStr;
            await safely(notifRef.set({
              id,
              organizationId: orgId,
              title: isOverdue ? 'Overdue Follow-up! ⚠️' : 'Follow-up Due! 📞',
              message: `${isOverdue ? 'Overdue' : 'Due'} follow-up for ${inquiry.callerName}. Purpose: ${inquiry.purpose}`,
              type: 'FOLLOW_UP',
              inquiryId: inquiryDoc.id,
              date: dateStr,
              timestamp: new Date().toISOString(),
              read: false,
              deleted: false
            }), undefined);
            console.log(`[Reminders] Created ${isOverdue ? 'overdue' : 'due'} follow-up notification for ${inquiry.callerName} in ${orgId}`);
          }
        }
      }

      // 4. Collect Data for Backup
      backupData[orgId] = {
        config: orgData,
        visits: visitsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        donations: donationsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        inquiries: inquiriesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        invitations: (await safely(orgDoc.ref.collection('invitations').get(), getFallback)).docs.map(d => ({ id: d.id, ...d.data() })),
        notifications: (await safely(orgDoc.ref.collection('notifications').get(), getFallback)).docs.map(d => ({ id: d.id, ...d.data() })),
        preRegistrations: (await safely(orgDoc.ref.collection('preRegistrations').get(), getFallback)).docs.map(d => ({ id: d.id, ...d.data() })),
        reviews: (await safely(orgDoc.ref.collection('reviews').get(), getFallback)).docs.map(d => ({ id: d.id, ...d.data() })),
        profiles: (await safely(orgDoc.ref.collection('profiles').get(), getFallback)).docs.map(d => ({ id: d.id, ...d.data() })),
      };
    }

    // 4. Save Backup to Storage
    try {
      const timestamp = today.toISOString().replace(/[:.]/g, '-');
      const bucket = getStorage().bucket();

      // Org-specific backups (discoverable in Profile)
      for (const orgId in backupData) {
        const orgFileName = `backups/visitor-data-${orgId}-${timestamp}.json`;
        const orgFile = bucket.file(orgFileName);
        await orgFile.save(JSON.stringify(backupData[orgId], null, 2), {
          contentType: 'application/json',
          metadata: { backupDate: today.toISOString() }
        });
      }

      // Global backup
      const globalFileName = `backups/firestore-backup-${timestamp}.json`;
      const globalFile = bucket.file(globalFileName);
      
      await globalFile.save(JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        metadata: {
          backupDate: today.toISOString(),
          projectId: projectId
        }
      });
      
      console.log(`[Backup Hub] Synchronized global backup and ${Object.keys(backupData).length} organizational snapshots.`);
    } catch (storageErr) {
      console.warn('[System] Storage backup failed (likely permission or not enabled):', storageErr);
    }
  } catch (error) {
    console.error('[System] Daily tasks failed:', error);
  }
}

// Set up daily schedule (runs every 24 hours)
if (!process.env.VERCEL && process.env.VITE_APP_BUILD_ENV !== 'serverless') {
  setInterval(runDailyTasks, 24 * 60 * 60 * 1000);
  // Also run once on startup (with a slight delay to ensure DB is ready)
  setTimeout(runDailyTasks, 60000);
}

// Diagnostic: Periodic connection check with fallback
const checkConnection = async () => {
  if (!adminDb) return;
  try {
    // Attempt a lightweight read to check connection
    // Use a specific doc in a test collection to be safe
    const testDocRef = adminDb.collection('_connection_test').doc('status');
    await safely(testDocRef.get(), getFallback);
    
    // Attempt safe write to ensure collections can exist (optional, mostly for initialization)
    try {
      await safely(testDocRef.set({ lastChecked: new Date().toISOString(), status: 'OK' }, { merge: true }), undefined);
    } catch (writeErr) {
      console.warn('Firestore write warning:', writeErr);
    }
    
    const currentDbId = (adminDb as any)._databaseId || (adminDb as any).databaseId || '(default)';
    console.log(`Firestore Status: CONNECTED [${projectId}] (${currentDbId})`);
  } catch (err: any) {
    const code = err.code || (err.status && err.status.code);
    console.warn(`Firestore Connectivity Warning [${code}]:`, err.message);

    if (code === 5) {
      console.warn('Firestore Database does not exist or is not enabled for this project.');
      console.warn('Please ensure Firestore is enabled in the Firebase Console (Database id: (default)).');
    }
  }
};

// Background periodic check
if (!process.env.VERCEL && process.env.VITE_APP_BUILD_ENV !== 'serverless') {
  setInterval(checkConnection, 600000);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// API Routes
app.get('/api/debug-firebase', (req, res) => {
  const currentApp = admin.app();
  res.json({
    projectId: currentApp.options.projectId,
    databaseId: (adminDb as any)._databaseId || (adminDb as any).databaseId || '(default)',
    envProjectId: process.env.FIREBASE_PROJECT_ID,
    hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    hasKeys: !!(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL),
    isDefaultCredential: currentApp.options.credential === undefined
  });
});

// Async Handler Wrapper
// Ensure proper error handling in async routes
const asyncHandler = (fn: express.RequestHandler) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('API Error:', err);
    // For production, avoid sending raw error messages to clients
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message || 'Internal Server Error' });
  });
};

interface Profile {
  name: string;
  dob: string;
  phone: string;
  email?: string;
}

app.use(express.json({ limit: '10mb' }));

app.get('/api/visitors', asyncHandler(async (req, res) => {
  res.json([]);
}));

const syncToGoogle = async (organizationId: string, visitor: any, isUpdate: boolean = false) => {
  // Logic removed as per request. Keeping UI as is.
  console.log(`[Mock Sync] ${isUpdate ? 'Update' : 'New'} visitor sync triggered for ${organizationId}`);
};

app.post('/api/visitors', asyncHandler(async (req, res) => {
  const visitorData = req.body;
  const { organizationId } = visitorData;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'organizationId is required for visitor creation' });
  }

  const now = new Date();
  const timeStr = visitorData.checkInTime || now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  
  let visitorId = visitorData.visitorId;
  if (!visitorId) {
    const datePrefix = (visitorData.date || now.toISOString().split('T')[0]).replace(/-/g, '');
    visitorId = `AF-${datePrefix}-${Math.random().toString(36).substring(2, 9)}`;
  }

  const result = {
    ...visitorData,
    visitorId,
    date: visitorData.date || now.toISOString().split('T')[0],
    checkInTime: timeStr,
    status: 'INSIDE',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Trigger sync
  syncToGoogle(organizationId, result, false);

  res.status(201).json(result);
}));

app.put('/api/visitors/:id/checkout', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organizationId, checkOutTime } = req.body;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'organizationId is required for checkout' });
  }

  const visitRef = adminDb.collection('organizations').doc(organizationId).collection('visits').doc(id);
  const visitSnap = await safely(visitRef.get(), getFallback);

  if (!visitSnap.exists) {
    return res.status(404).json({ error: 'Visit record not found' });
  }

  const now = new Date().toISOString();
  const timeStr = checkOutTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const updates = {
    status: 'CHECKED OUT',
    checkOutTime: timeStr,
    updatedAt: now
  };

  await safely(visitRef.update(updates), undefined);

  const updatedData = { ...visitSnap.data(), ...updates, visitorId: id };

  // Trigger sync for checkout
  syncToGoogle(organizationId, updatedData, true);

  res.json({ success: true, message: 'Checked out successfully', visitor: updatedData });
}));

app.post('/api/donations', asyncHandler(async (req, res) => {
  const donation = req.body;
  const { organizationId } = donation;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'organizationId is required for donation creation' });
  }

  // Add creation timestamp
  const now = new Date().toISOString();
  const donationWithTimestamps = { ...donation, createdAt: now, updatedAt: now };

  res.status(201).json({ success: true, message: 'Donation recorded.' });
}));

// Placeholder for PUT /api/donations/:id
app.put('/api/donations/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const donationUpdates = req.body;
  const { organizationId } = donationUpdates;

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'organizationId is required for donation update' });
  }

  res.json({ success: true, message: `Donation ${id} update acknowledged.` });
}));

// Placeholder for DELETE /api/donations/:id
app.delete('/api/donations/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.body; // Assuming organizationId is sent in body for DELETE

  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'organizationId is required for donation deletion' });
  }

  res.json({ success: true, message: `Donation ${id} deletion acknowledged.` });
}));

// Google OAuth Routes (Mocked)
app.get('/api/auth/google/url', (req, res) => {
  res.json({ url: '#' });
});

app.get('/api/auth/google/callback', asyncHandler(async (req, res) => {
  res.redirect('/');
}));

app.get('/api/google/config', asyncHandler(async (req, res) => {
  res.json({ connected: false });
}));

app.get('/api/google/sheets', asyncHandler(async (req, res) => {
  res.json([]);
}));

app.post('/api/google/sheets/select', asyncHandler(async (req, res) => {
  res.json({ success: true });
}));

app.post('/api/google/sheets/create', asyncHandler(async (req, res) => {
  res.json({ success: true, spreadsheetId: 'mock-sheet-id' });
}));

app.get('/api/google/calendars', asyncHandler(async (req, res) => {
  res.json([]);
}));

app.post('/api/google/calendar/select', asyncHandler(async (req, res) => {
  res.json({ success: true });
}));

app.post('/api/google/calendar/birthday/select', asyncHandler(async (req, res) => {
  res.json({ success: true });
}));

app.post('/api/google/calendar/create', asyncHandler(async (req, res) => {
  res.json({ success: true, id: 'mock-calendar-id' });
}));

app.post('/api/google/calendar/birthday/create', asyncHandler(async (req, res) => {
  res.json({ success: true, id: 'mock-birthday-calendar-id' });
}));

app.post('/api/google/sync', asyncHandler(async (req, res) => {
  res.json({ 
    success: true, 
    message: 'Manual sync mock completed.',
    lastSyncTime: new Date().toLocaleString(),
    totalRecordsSynced: 0,
    totalEventsSynced: 0
  });
}));

app.post('/api/google/disconnect', asyncHandler(async (req, res) => {
  res.json({ success: true });
}));

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  // ESM compatibility for __dirname with vite
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: __dirname, // Ensure Vite uses the correct root for your project
  });
  app.use(vite.middlewares);
} else {
  // In production, serve static files from 'dist'
  const distPath = path.join(__dirname, 'dist'); // Use __dirname
  app.use(express.static(distPath));
  // Catch-all to serve index.html for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start the server only if this file is run directly (not imported as a module)
// This is important for environments like Google Cloud Functions or similar serverless setups
// where the app might be exported and run differently.
// Start the server
async function run() {
  await checkConnection();
  if (!process.env.VERCEL && process.env.VITE_APP_BUILD_ENV !== 'serverless') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Node Environment: ${process.env.NODE_ENV}`);
    });
  } else {
    console.log(`Server is exported for serverless environment (VERCEL=${!!process.env.VERCEL}), skipping app.listen().`);
  }
}

run();

export default app;