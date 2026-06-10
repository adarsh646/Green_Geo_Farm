const mongoose = require('mongoose');

const cattleRecordSchema = new mongoose.Schema({
  cattleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cattle', 
    required: true 
  },
  tagNumber: { 
    type: String, 
    required: true 
  },
  // Identification
  Breed: { type: String },
  Age: { type: String },
  
  // Production
  Milk_AM: { type: Number },
  Milk_PM: { type: Number },
  Total_Milk: { type: Number },
  
  // Activity
  Number_of_Steps: { type: Number },
  Distance_Moved: { type: Number },
  Standing_Time: { type: Number },
  Lying_Time: { type: Number },
  Walking_Time: { type: Number },
  
  // Feeding
  Feed_Type: { type: String }, // Comma separated: "Corn (5kg), Hay (2kg)"
  Total_Feed_Weight: { type: Number }, // Sum of weights in kg
  Feeding_Time: { type: Number },
  Number_of_Feeding_Visits: { type: Number },
  Water_Intake: { type: Number },
  Water_pH: { type: Number },
  Rumination_Time: { type: Number },
  
  // Health
  Body_Temperature: { type: Number },
  Heart_Rate: { type: Number },
  Respiration_Rate: { type: Number },
  Ammonia_Level: { type: Number }, // ppm
  Methane_Level: { type: Number }, // ppm
  Carbon_Dioxide_Level: { type: Number }, // ppm
  Cleanliness: { type: String, enum: ['Not Cleaned', 'Average', 'Good'] },
  
  // Reproduction
  Estrus_Activity_Index: { type: Number },
  Mounting_Events: { type: Number },
  Pregnancy_Status: { type: String },
  
  // Locomotion
  Gait_Score: { type: Number },
  Limb_Movement_Symmetry: { type: String },
  
  // Environment
  Ambient_Temperature: { type: Number },
  Humidity: { type: Number },
  THI_Index: { type: Number },
  
  // Alerts
  Health_Risk_Score: { type: Number },
  Estrus_Probability: { type: Number },
  Lameness_Risk: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CattleRecord', cattleRecordSchema);
