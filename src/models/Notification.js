const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema({
  notifyID: { type: String, default: () => uuidv4(), unique: true, index: true },
  title:    { type: String, required: true, trim: true },
  body:     { type: String, required: true, trim: true },
  data:     { type: Map, of: String, default: {} },
  users: [{
    userID: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  }],
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Notification
  || mongoose.model('Notification', notificationSchema);
