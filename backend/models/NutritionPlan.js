const mongoose = require('mongoose');

const nutritionPlanSchema = new mongoose.Schema({
  cattleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cattle', 
    required: true,
    unique: true 
  },
  roughageStrategy: { type: String, required: true },
  inputs: { type: Object, default: {} },
  dietPlan: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('NutritionPlan', nutritionPlanSchema);
