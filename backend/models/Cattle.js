const mongoose = require('mongoose');

const cattleSchema = new mongoose.Schema({
  tagNumber: { type: String, required: true, unique: true },
  breed: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  healthStatus: { type: String, default: 'Healthy' },
  weight: { type: Number },
  imageUrl: { type: String },
  model3dUrl: { type: String, default: '' },
  events: [{
    eventType: { type: String, required: true },
    eventDate: { type: Date, required: true },
    doctorName: { type: String },
    medicineGiven: { type: String },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  // --- Carbon Credit Parameters (VM0041) ---
  animalGroupId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AnimalGroup' 
  },
  intakeDate: { // Used to calculate Daysi,j
    type: Date,
    default: Date.now
  }
  ,
  nutritionPlans: [{
    roughageStrategy: { type: String },
    inputs: { type: Object },
    dietPlan: { type: Object },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Cattle', cattleSchema);
