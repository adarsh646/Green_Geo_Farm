const mongoose = require('mongoose');

const dailyBehaviorLogSchema = new mongoose.Schema({
  cow_id: { type: String, required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  total_ruminating: { type: Number, default: 0 },
  total_eating: { type: Number, default: 0 },
  total_standing: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
});

// Create model explicitly mapping to the 'daily_behavior_logs' collection deposited by Python
module.exports = mongoose.model('DailyBehaviorLog', dailyBehaviorLogSchema, 'daily_behavior_logs');
