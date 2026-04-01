const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');

// GET /api/cron/birthday — Vercel gọi hàng ngày lúc 7:00 SA (GMT+7 = 0:00 UTC)
router.get('/birthday', async (req, res) => {
  try {
    const now = new Date();
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

    const allTokens = users.flatMap(u => u.DeviceTokens);
    const chunks = [];
    for (let i = 0; i < allTokens.length; i += 500)
      chunks.push(allTokens.slice(i, i + 500));

    let successCount = 0;
    for (const chunk of chunks) {
      const result = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: '🎂 Chúc mừng sinh nhật!',
          body: 'Chúc bạn sinh nhật vui vẻ, luôn mạnh khỏe và học tập thật tốt! 🎉',
        },
        android: { priority: 'high', notification: { sound: 'default' } },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      successCount += result.responses.filter(r => r.success).length;
    }

    console.log(`[birthday-cron] ${today} — gửi cho ${users.length} SV, ${successCount}/${allTokens.length} thiết bị`);
    res.json({ success: true, date: today, students: users.length, successCount });
  } catch (e) {
    console.error('[birthday-cron]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
