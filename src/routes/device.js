const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /devices — web admin lấy tất cả thiết bị
router.get('/', async (req, res) => {
  try {
    const snap = await db.collection('users').get();
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.DeviceTokens?.length > 0);
    res.json({ success: true, data: { array: data, amount: data.length } });
  } catch (e) {
    console.error('[get-devices]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /devices/:hocVienId — lấy token của 1 sinh viên
router.get('/:hocVienId', async (req, res) => {
  try {
    const snap = await db.collection('users').doc(req.params.hocVienId).get();
    if (!snap.exists)
      return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: { id: snap.id, ...snap.data() } });
  } catch (e) {
    console.error('[get-device]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
