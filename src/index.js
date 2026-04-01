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

app.get('/', (req, res) => res.json({ success: true, message: 'Notification server running' }));

app.get('/debug', (req, res) => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return res.json({ error: 'FIREBASE_SERVICE_ACCOUNT is not set' });
  try {
    const parsed = JSON.parse(raw);
    res.json({
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      has_private_key: !!parsed.private_key,
      private_key_start: parsed.private_key?.substring(0, 40),
    });
  } catch (e) {
    res.json({ error: 'JSON parse failed', detail: e.message });
  }
});

module.exports = app;
