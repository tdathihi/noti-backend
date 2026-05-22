require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Routes
app.use('/api/token', require('./routes/token'));
app.use('/api/devices', require('./routes/device'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/cron', require('./routes/cron'));

app.get('/', (req, res) => res.json({ success: true, message: 'Notification server running' }));

app.get('/debug', async (req, res) => {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!b64 && !raw) {
    return res.json({ error: 'Không có env var nào được set' });
  }

  let credInfo = {};
  try {
    const parsed = b64
      ? JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
      : JSON.parse(raw);
    credInfo = {
      source: b64 ? 'FIREBASE_SERVICE_ACCOUNT_BASE64' : 'FIREBASE_SERVICE_ACCOUNT',
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      has_private_key: !!parsed.private_key,
      private_key_starts_correctly: parsed.private_key?.startsWith('-----BEGIN PRIVATE KEY-----'),
    };
  } catch (e) {
    return res.json({ error: 'Parse thất bại', detail: e.message });
  }

  // Test Firestore connection
  try {
    const { db } = require('./config/firebase');
    await db.collection('_ping').doc('test').set({ ts: Date.now() });
    await db.collection('_ping').doc('test').delete();
    res.json({ ...credInfo, firestore: 'OK' });
  } catch (e) {
    res.json({ ...credInfo, firestore: 'FAIL', firestoreError: e.message, firestoreCode: e.code });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;
