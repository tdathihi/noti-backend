require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Khởi tạo Firebase (phải load trước các route dùng firebase)
require('./config/firebase');

const tokenRoutes        = require('./routes/token');
const deviceRoutes       = require('./routes/device');
const notificationRoutes = require('./routes/notification');

const app = express();

app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use('/api/firebase', tokenRoutes);
app.use('/api/firebase/devices', deviceRoutes);
app.use('/api/firebase/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Start (local only) ──────────────────────────────────
let dbReady = false;
const ensureDB = async () => {
  if (!dbReady) {
    await connectDB();
    dbReady = true;
  }
};

// Vercel serverless: wrap app để connect DB trước mỗi request
const handler = async (req, res) => {
  await ensureDB();
  return app(req, res);
};

// Export cho Vercel
module.exports = handler;

// Chạy local
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  });
}
