const mongoose = require('mongoose');

const attendanceEntrySchema = new mongoose.Schema({
  morning: { type: Boolean, default: false },
  evening: { type: Boolean, default: false },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  records: {
    type: Map,
    of: attendanceEntrySchema,
    default: {},
  },
  lastUpdatedBy: { type: String, default: 'system' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Attendance', attendanceSchema);
