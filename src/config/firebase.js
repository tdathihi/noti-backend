const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  let serviceAccount;

  // Ưu tiên 1: File JSON mới nhất (firebase-adminsdk-fbsvc)
  const newJsonPath = path.join(__dirname, '../../vido-student-beta-firebase-adminsdk-fbsvc-4f4fe8e784.json');
  // Ưu tiên 2: File JSON cũ (fallback)
  const oldJsonPath = path.join(__dirname, '../../vido-student-beta-firebase-adminsdk-4rkqd-b41028adde.json');

  if (fs.existsSync(newJsonPath)) {
    serviceAccount = require(newJsonPath);
    console.log('[Firebase] Dùng service account mới: fbsvc');
  } else if (fs.existsSync(oldJsonPath)) {
    serviceAccount = require(oldJsonPath);
    console.log('[Firebase] Dùng service account cũ: 4rkqd');
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
      console.log('[Firebase] Dùng service account từ BASE64 env');
    } catch (e) {
      console.error('Lỗi parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e.message);
    }
  }

  if (!serviceAccount) {
    console.error('[Firebase] KHÔNG TÌM THẤY service account! Kiểm tra lại file JSON hoặc env vars.');
    process.exit(1);
  }

  if (serviceAccount && serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('[Firebase] Initialized với project:', serviceAccount.project_id);
}

const db = admin.firestore();

module.exports = { admin, db };