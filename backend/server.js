const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });
const { migrateLegacyCustomers } = require('./utils/migrateLegacyCustomers');

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cattle_management';
console.log('Using MongoDB URI:', mongoUri.replace(/(mongodb:\/\/)([^:]+):([^@]+)@/, '$1$2:*****@'));
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected');
    await migrateLegacyCustomers();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
const cattleRoutes = require('./routes/cattleRoutes');
const cattleRecordRoutes = require('./routes/cattleRecordRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const feedStockRoutes = require('./routes/feedStockRoutes');
const farmAssetRoutes = require('./routes/farmAssetRoutes');
const shopProductRoutes = require('./routes/shopProductRoutes');
const behaviorLogRoutes = require('./routes/behaviorLogRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const videoRoutes = require('./routes/videoRoutes');
const dailyUpdateRoutes = require('./routes/dailyUpdateRoutes');
const carbonRoutes = require('./routes/carbonRoutes');
const reportRoutes = require('./routes/reportRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

app.use('/api/cattle', cattleRoutes);
app.use('/api/cattle-records', cattleRecordRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feed-stock', feedStockRoutes);
app.use('/api/farm-assets', farmAssetRoutes);
app.use('/api/shop-products', shopProductRoutes);
app.use('/api/behavior-logs', behaviorLogRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/daily-updates', dailyUpdateRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('Cattle Management API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
