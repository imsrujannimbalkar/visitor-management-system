import { openDB, IDBPDatabase } from 'idb';
import { Profile, Visit } from '../types';

const DB_NAME = 'vms-offline-db';
const DB_VERSION = 1;
const STORE_PROFILES = 'pending-profiles';
const STORE_VISITS = 'pending-visits';

export async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_PROFILES)) {
        db.createObjectStore(STORE_PROFILES, { keyPath: 'phone' });
      }
      if (!db.objectStoreNames.contains(STORE_VISITS)) {
        db.createObjectStore(STORE_VISITS, { keyPath: 'visitId' });
      }
    },
  });
}

export async function savePendingProfile(profile: Profile) {
  const db = await initDB();
  await db.put(STORE_PROFILES, { ...profile, organizationId: profile.organizationId });
}

export async function savePendingVisit(visit: Visit) {
  const db = await initDB();
  await db.put(STORE_VISITS, { ...visit, organizationId: visit.organizationId });
}

export async function getPendingProfiles(): Promise<Profile[]> {
  const db = await initDB();
  return db.getAll(STORE_PROFILES);
}

export async function getPendingVisits(): Promise<Visit[]> {
  const db = await initDB();
  return db.getAll(STORE_VISITS);
}

export async function clearPendingProfile(phone: string) {
  const db = await initDB();
  await db.delete(STORE_PROFILES, phone);
}

export async function clearPendingVisit(visitId: string) {
  const db = await initDB();
  await db.delete(STORE_VISITS, visitId);
}
