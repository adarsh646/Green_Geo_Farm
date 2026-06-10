const mongoose = require('mongoose');

const FeedStockSchema = new mongoose.Schema({
  feedType: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['Silage', 'Fresh Green Grass', 'Dry Fodder', 'Concentrate', 'Other'],
    default: 'Other'
  },
  weight: {
    type: Number,
    default: 0
  },
  maxCapacity: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // --- Carbon Credit Parameters (VM0041) ---
  isMethanogenicInhibitor: {
    type: Boolean,
    default: false
  },
  QElec: { // Manufacturing electricity usage (MWh/kg)
    type: Number,
    default: 0
  },
  Qffa: { // Manufacturing fossil fuel usage (kg/kg)
    type: Number,
    default: 0
  },
  transportDistance: { // Di,m: Distance traveled (km)
    type: Number,
    default: 0
  },
  amountPurchased: { // FMi: Amount purchased (kg)
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('FeedStock', FeedStockSchema);
