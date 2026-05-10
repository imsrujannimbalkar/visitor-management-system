const admin = require('firebase-admin');
const fs = require('fs');

// your actual key file
const serviceAccount = require('./gen-lang-client-0717245426-firebase-adminsdk-fbsvc-1a8dd74409.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function backupCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();

  const data = [];

  snapshot.forEach(doc => {
    data.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  // create backups folder automatically
  fs.mkdirSync('backups', { recursive: true });

  // save json file
  fs.writeFileSync(
    `backups/${collectionName}.json`,
    JSON.stringify(data, null, 2)
  );

  console.log(`${collectionName} backup complete`);
}

async function runBackup() {

  // add your collections here
  await backupCollection('users');
  await backupCollection('organizations');
  await backupCollection('appFeedback');
  await backupCollection('bugReports');

  console.log('ALL BACKUPS COMPLETED');
}

runBackup();