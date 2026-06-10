const mongoose = require('mongoose');

const bioCngProductionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  feedstockType: { 
    type: String, 
    enum: ['Cattle Dung', 'Paddy Straw', 'Bagasse', 'MSW', 'Press Mud'],
    default: 'Cattle Dung'
  },
  feedstockAmount: { type: Number, default: 0 }, // in Tonnes
  gasProduced: { type: Number, default: 0 }, // in kg
  slurryProduced: { type: Number, default: 0 }, // in Litres
  slurryToBiogas: { type: Number, default: 0 }, // in Litres
  ammoniaPpm: { type: Number, default: 0 }, // Sensor reading
  co2Ppm: { type: Number, default: 0 }, // Sensor reading
  
  // Calculated Parameters based on TERI methodology
  methaneAvoidedAa: { type: Number, default: 0 }, // Avoided during production
  methaneAvoidedAb: { type: Number, default: 0 }, // Avoided from fertilizer replacement
  totalMethaneAvoided: { type: Number, default: 0 }, // Aa + Ab
  
  cafeCreditsPotential: { type: Number, default: 0 }, // Ec
  ruralCostSavings: { type: Number, default: 0 } // Estimated Rs. saved
}, { timestamps: true });

// Pre-save hook to calculate methodological variables
bioCngProductionSchema.pre('save', function() {
  // Simplistic assumptions based on TERI pdf for Cattle Dung as an example
  // In a full implementation, these would use exact IPCC emission factors
  
  if (this.feedstockType === 'Cattle Dung') {
    // Example: 26.2 tonnes CO2e avoided per tonne of gas
    this.totalMethaneAvoided = this.gasProduced * 26.223; 
  } else {
    // Fallback estimation
    this.totalMethaneAvoided = this.gasProduced * 15.0; 
  }

  this.methaneAvoidedAa = this.totalMethaneAvoided * 0.8;
  this.methaneAvoidedAb = this.totalMethaneAvoided * 0.2;

  // CAFE Credit Potential: (At/30000) + 0.108
  this.cafeCreditsPotential = (this.totalMethaneAvoided / 30000) + 0.108;

  // Rural Cost Savings: Rs 2.727 saved per km. 1 kg CNG = ~22.95 km
  const kmEquivalent = this.gasProduced * 22.95;
  this.ruralCostSavings = kmEquivalent * 2.727;
});

module.exports = mongoose.model('BioCngProduction', bioCngProductionSchema);
