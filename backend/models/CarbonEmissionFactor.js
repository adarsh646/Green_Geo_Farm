const mongoose = require('mongoose');

const carbonEmissionFactorSchema = new mongoose.Schema({
  region: { type: String, required: true, unique: true, default: 'India' },
  // Electricity emission factor (kg CO2/MWh)
  EFelec: { type: Number, default: 708 }, // Example default for India
  // Energy content per unit of combusted fuel type a (TJ/kg)
  FCa: { type: Number, default: 0.043 }, 
  // Emission factor for fuel type a (kg CO2e/TJ)
  EFa: { type: Number, default: 74100 },
  // CO2 emitted by transport mode m (kg CO2/kg/km)
  TEFim: { type: Number, default: 0.0001 },
  // Emission factor for direct CH4 emissions from management system S (g CH4/kg)
  EFijS: { type: Number, default: 1.5 },
  // Emission factor for direct N2O emissions from management system S (kg N2O-N/kg N)
  EF3S: { type: Number, default: 0.005 },
  
  // VCS Methodology Parameters (VM0041)
  animalGroup: { type: String, default: 'Lactating Cows' },
  meanHeadCount: { type: Number, default: 124 },
  daysOnFarm: { type: Number, default: 365 },
  dryMatterIntake: { type: Number, default: 22.5 },
  feedAmount: { type: Number, default: 4500 },
  gridElecUsed: { type: Number, default: 0.12 },
  transportDist: { type: Number, default: 150 },
  volatileSolidsFraction: { type: Number, default: 0.85 }
}, { timestamps: true });

module.exports = mongoose.model('CarbonEmissionFactor', carbonEmissionFactorSchema);
