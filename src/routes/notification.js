const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { admin, db } = require('../config/firebase');
const Notification = require('../models/Notification');
const { removeInvalidTokens } = require('../helpers/tokenHelper');
const connectDB = require('../config/database');

// POST /send
// Body: { title, msg, tokens:[{hocVienId, DeviceTokens}], notiId?, data?, sendAll? }
router.post('/send', async (req, res) => {
  try {
    await connectDB();
    const { title, msg, tokens, notiId, data = {}, sendAll = false } = req.body;
    if (!title || !msg)
      return res.status(400).json({ success: false, message: 'Thiếu title hoặc msg' });

    let groups = tokens || [];
    if (sendAll) {
      const snap = await db.collection('users').get();
      groups = snap.docs
        .map(d => ({ hocVienId: d.id, ...d.data() }))
        .filter(d => d.DeviceTokens?.length > 0);
    }

    if (!groups.length)
      return res.status(400).json({ success: false, message: 'Không có thiết bị nào' });

    const allTokens = groups.flatMap(g => g.DeviceTokens);
    const allResponses = [];

    // Gửi theo chunk 500 (giới hạn của FCM)
    for (let i = 0; i < allTokens.length; i += 500) {
      const chunk = allTokens.slice(i, i + 500);
      const result = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body: msg },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: { priority: 'high', notification: { sound: 'default' } },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      allResponses.push(...result.responses);
    }

    await removeInvalidTokens(groups, allResponses);

    const successCount = allResponses.filter(r => r.success).length;
    const failureCount = allResponses.length - successCount;

    const notifyID = notiId || uuidv4();
    await Notification.create({
      notifyID, title, body: msg, data,
      users: groups.map(g => ({ userID: String(g.hocVienId), status: 'unread' })),
    });

    res.json({ success: true, successCount, failureCount, notifyID });
  } catch (e) {
    console.error('[send]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /notifications?studentID=xxx — Flutter lấy danh sách thông báo
router.get('/', async (req, res) => {
  try {
    await connectDB();
    const { studentID } = req.query;
    if (!studentID)
      return res.status(400).json({ success: false, message: 'Thiếu studentID' });

    const list = await Notification.find({ 'users.userID': studentID })
      .sort({ sentAt: -1 }).limit(50).lean();

    const data = list.map(n => ({
      id:     n.notifyID,
      title:  n.title,
      body:   n.body,
      data:   n.data,
      status: n.users.find(u => u.userID === studentID)?.status ?? 'unread',
      sentAt: n.sentAt,
    }));

    res.json({ success: true, data });
  } catch (e) {
    console.error('[get-notifications]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /notifications/all — web admin xem lịch sử
router.get('/all', async (req, res) => {
  try {
    await connectDB();
    const data = await Notification.find()
      .select('-users').sort({ sentAt: -1 }).limit(100).lean();
    res.json({ success: true, data });
  } catch (e) {
    console.error('[get-all-notifications]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /notifications/read — đánh dấu đọc 1 cái
// Body: { studentID, notifyID }
router.put('/read', async (req, res) => {
  try {
    await connectDB();
    const { studentID, notifyID } = req.body;
    if (!studentID || !notifyID)
      return res.status(400).json({ success: false, message: 'Thiếu studentID hoặc notifyID' });

    await Notification.updateOne(
      { notifyID, 'users.userID': studentID },
      { $set: { 'users.$.status': 'read' } }
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[read]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /notifications/read-all — đánh dấu đọc tất cả
// Body: { studentID }
router.put('/read-all', async (req, res) => {
  try {
    await connectDB();
    const { studentID } = req.body;
    if (!studentID)
      return res.status(400).json({ success: false, message: 'Thiếu studentID' });

    await Notification.updateMany(
      { 'users.userID': studentID },
      { $set: { 'users.$[e].status': 'read' } },
      { arrayFilters: [{ 'e.userID': studentID }] }
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[read-all]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /notifications/:notifyID — xóa thông báo
router.delete('/:notifyID', async (req, res) => {
  try {
    await connectDB();
    await Notification.deleteOne({ notifyID: req.params.notifyID });
    res.json({ success: true });
  } catch (e) {
    console.error('[delete-notification]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
