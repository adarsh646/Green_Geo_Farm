const mongoose = require('mongoose');

const farmAssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g., Machine, Motor Pump, etc.
  description: { type: String },
  purchaseDate: { type: Date },
  lastServiceDate: { type: Date },
  nextServiceDate: { type: Date },
  status: { type: String, enum: ['Active', 'In Service', 'Maintenance Required', 'Retired'], default: 'Active' },
  imageUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('FarmAsset', farmAssetSchema);
