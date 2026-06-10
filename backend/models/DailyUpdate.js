const mongoose = require('mongoose');

const DailyUpdateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  energy: {
    solar: { type: Number, default: 0 },       // kWh from Solar
    generator: { type: Number, default: 0 },   // kWh from Generator
    kseb: { type: Number, default: 0 },        // kWh from KSEB
  },
  water: {
    irrigation: { type: Number, default: 0 },     // litres for irrigation
    cleaning: { type: Number, default: 0 },       // litres for cleaning
    cattleDrinking: { type: Number, default: 0 }, // litres for cattle drinking
    amount: { type: Number, default: 0 },         // total litres consumed (sum of above)
  },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Virtual: total energy for the day
DailyUpdateSchema.virtual('totalEnergy').get(function () {
  return this.energy.solar + this.energy.generator + this.energy.kseb;
});

// Pre-save hook to ensure amount is always sum of categories
DailyUpdateSchema.pre('save', function(next) {
  this.water.amount = this.water.irrigation + this.water.cleaning + this.water.cattleDrinking;
  next();
});

module.exports = mongoose.model('DailyUpdate', DailyUpdateSchema);
