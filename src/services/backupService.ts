
import { ref, uploadString, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from '../firebase';

export async function createBackup(organizationId: string, data: any) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backups/visitor-data-${organizationId}-${timestamp}.json`;
  const storageRef = ref(storage, filename);
  
  await uploadString(storageRef, JSON.stringify(data), 'raw');
  return filename;
}

export async function getBackups(organizationId: string) {
  const backupsRef = ref(storage, 'backups/');
  const result = await listAll(backupsRef);
  
  const backups = await Promise.all(
    result.items
      .filter(item => item.name.includes(organizationId))
      .map(async item => ({
        name: item.name,
        url: await getDownloadURL(item)
      }))
  );
  
  return backups;
}
