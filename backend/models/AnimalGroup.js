const mongoose = require('mongoose');

const animalGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true, unique: true }, // e.g., 'Lactating Cows', 'Heifers'
  averageWeight: { type: Number, required: true }, // kg
  productionPhase: { type: String, required: true }, // e.g., 'Lactating', 'Dry', 'Growing'
  DMIj: { type: Number, required: true }, // Average dry mass of feed consumed (kg/head/day)
  VSij: { type: Number, required: true }, // Annual average excretion of volatile solids (kg/head/yr)
  Nexj: { type: Number, required: true }, // Annual average nitrogen excretion per head (kg N/head/yr)
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AnimalGroup', animalGroupSchema);
