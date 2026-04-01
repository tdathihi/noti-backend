const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');

// POST /register-token — Flutter gọi sau khi login
// Body: { hocVienId, token }
router.post('/register-token', async (req, res) => {
  try {
    const { hocVienId, token, mssv, hoTen, ngaysinh } = req.body;
    if (!hocVienId || !token)
      return res.status(400).json({ success: false, message: 'Thiếu hocVienId hoặc token' });

    const ref = db.collection('users').doc(String(hocVienId));
    const snap = await ref.get();

    // Chuẩn hoá ngaysinh → "MM-DD" để so sánh hàng năm
    let ngaysinhMMDD = null;
    if (ngaysinh) {
      try {
        const d = new Date(ngaysinh);
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        ngaysinhMMDD = `${mm}-${dd}`;
      } catch (_) {}
    }

    if (snap.exists) {
      await ref.update({
        DeviceTokens: admin.firestore.FieldValue.arrayUnion(token),
        ...(mssv && { mssv }),
        ...(hoTen && { hoTen }),
        ...(ngaysinhMMDD && { ngaysinhMMDD }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await ref.set({
        hocVienId: String(hocVienId),
        mssv: mssv || '',
        hoTen: hoTen || '',
        DeviceTokens: [token],
        ...(ngaysinhMMDD && { ngaysinhMMDD }),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({ success: true, message: 'Token đã được lưu' });
  } catch (e) {
    console.error('[register-token]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /register-token — Flutter gọi khi logout
// Body: { hocVienId, token }
router.delete('/register-token', async (req, res) => {
  try {
    const { hocVienId, token } = req.body;
    if (!hocVienId || !token)
      return res.status(400).json({ success: false, message: 'Thiếu hocVienId hoặc token' });

    await db.collection('users').doc(String(hocVienId)).update({
      DeviceTokens: admin.firestore.FieldValue.arrayRemove(token),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: 'Token đã được xóa' });
  } catch (e) {
    console.error('[delete-token]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
