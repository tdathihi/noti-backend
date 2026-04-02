const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const Notification = require('../models/Notification');
const connectDB = require('../config/database');

// GET /api/cron/birthday — Vercel gọi hàng ngày lúc 7:00 SA (GMT+7 = 0:00 UTC)
router.get('/birthday', async (req, res) => {
  try {
    // Dùng giờ Việt Nam (UTC+7) để tránh lệch ngày
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const today = `${mm}-${dd}`;

    // Tìm tất cả user có sinh nhật hôm nay
    const snap = await db.collection('users')
      .where('ngaysinhMMDD', '==', today)
      .get();

    const users = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.DeviceTokens?.length > 0);

    if (!users.length) {
      return res.json({ success: true, message: 'Không có sinh nhật hôm nay', count: 0 });
    }

    await connectDB();

    const title = '🎂 Chúc mừng sinh nhật!';

    let successCount = 0;
    const notifUsers = [];

    for (const user of users) {
      const hoTen = user.hoTen || 'bạn';
      const body = `Chúc mừng sinh nhật ${hoTen}! Chúc bạn luôn mạnh khỏe và học tập thật tốt! 🎉`;

      const tokens = user.DeviceTokens;
      const chunks = [];
      for (let i = 0; i < tokens.length; i += 500)
        chunks.push(tokens.slice(i, i + 500));

      for (const chunk of chunks) {
        const result = await admin.messaging().sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
          android: { priority: 'high', notification: { sound: 'default' } },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        successCount += result.responses.filter(r => r.success).length;
      }

      notifUsers.push({ userID: String(user.hocVienId), status: 'unread' });
    }

    // Lưu vào MongoDB để hiện trong màn hình thông báo
    await Notification.create({
      title,
      body: 'Chúc mừng sinh nhật! Chúc bạn luôn mạnh khỏe và học tập thật tốt! 🎉',
      users: notifUsers,
    });

    console.log(`[birthday-cron] ${today} — gửi cho ${users.length} SV, ${successCount} thiết bị`);
    res.json({ success: true, date: today, students: users.length, successCount });
  } catch (e) {
    console.error('[birthday-cron]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
