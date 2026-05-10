
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { SystemBackup } from '../types';

export async function createBackup(organizationId: string, data: any, userId: string, userName: string) {
  const timestamp = new Date().toISOString();
  const backupId = `BK-${Date.now()}`;
  
  // 1. Prepare Metadata
  const metadata = {
    profilesCount: data.profiles?.length || 0,
    visitsCount: data.visits?.length || 0,
    donationsCount: data.donations?.length || 0,
    preRegCount: data.preRegistrations?.length || 0,
    inquiriesCount: data.inquiries?.length || 0,
    size: JSON.stringify(data).length
  };

  const backupRecord: SystemBackup = {
    id: backupId,
    organizationId,
    timestamp,
    createdBy: userId,
    createdByName: userName,
    data,
    metadata
  };

  // 2. Save to Firestore (Primary for the specific request)
  // Note: We might hit 1MB limit. 
  try {
    await setDoc(doc(db, 'organizations', organizationId, 'system_backups', backupId), backupRecord);
  } catch (firestoreErr: any) {
    console.warn('Firestore backup failed (likely size limit):', firestoreErr);
    // If it fails, save metadata with a flag indicating it's too large for Firestore
    await setDoc(doc(db, 'organizations', organizationId, 'system_backups', backupId), {
      ...backupRecord,
      data: null, // Clear data if too big for Firestore
      isLargeBackup: true,
      note: 'Backup too large for Firestore storage. Please use the GitHub Actions automated backup for full data.'
    });
  }

  return backupId;
}

export async function getBackups(organizationId: string) {
  // Fetch from Firestore system_backups collection
  const backupsRef = collection(db, 'organizations', organizationId, 'system_backups');
  const q = query(backupsRef, orderBy('timestamp', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemBackup));
}

// Stub for backward compatibility
export async function getStorageBackups(_organizationId: string) {
  return [];
}
