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

module.exports = app;
