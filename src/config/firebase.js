const admin = require('firebase-admin');

if (!admin.apps.length) {
  // Vercel đôi khi lưu \n thật, đôi khi lưu \\n — xử lý cả 2
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, '\n')
    ?.replace(/^"|"$/g, ''); // bỏ dấu nháy nếu có

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();

module.exports = { admin, db };
