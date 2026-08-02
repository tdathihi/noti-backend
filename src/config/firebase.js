const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  let serviceAccount;
  const jsonPath = path.join(__dirname, '../../vido-student-beta-firebase-adminsdk-4rkqd-b41028adde.json');

  if (fs.existsSync(jsonPath)) {
    serviceAccount = require(jsonPath);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
    } catch (e) {
      console.error('Lỗi parse FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      );
    } catch (e) {
      console.error('Lỗi parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e.message);
    }
  }

  if (serviceAccount && serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = { admin, db };