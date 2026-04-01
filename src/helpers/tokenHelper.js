const { admin, db } = require('../config/firebase');

/**
 * Xóa các FCM token không hợp lệ khỏi Firestore sau khi gửi multicast.
 * @param {Array<{hocVienId: string, DeviceTokens: string[]}>} tokenGroups
 * @param {Array} responses - mảng response từ sendEachForMulticast
 */
async function removeInvalidTokens(tokenGroups, responses) {
  const removalMap = {};
  let idx = 0;

  for (const group of tokenGroups) {
    for (const token of group.DeviceTokens) {
      const r = responses[idx];
      if (r?.error) {
        const code = r.error.code;
        const invalidCodes = [
          'messaging/invalid-registration-token',
          'messaging/registration-token-not-registered',
          'messaging/invalid-argument',
        ];
        if (invalidCodes.includes(code)) {
          (removalMap[group.hocVienId] ??= []).push(token);
        }
      }
      idx++;
    }
  }

  await Promise.allSettled(
    Object.entries(removalMap).map(([hocVienId, tokens]) =>
      db.collection('users').doc(hocVienId).update({
        DeviceTokens: admin.firestore.FieldValue.arrayRemove(...tokens),
      })
    )
  );
}

module.exports = { removeInvalidTokens };
