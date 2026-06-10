const express = require('express');
const router = express.Router();
const CattleRecord = require('../models/CattleRecord');
const DailyUpdate = require('../models/DailyUpdate');

// Re-calculate total water for a given calendar date and upsert DailyUpdate
async function syncWaterForDate(date) {
  try {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const agg = await CattleRecord.aggregate([
      { $match: { createdAt: { $gte: dayStart, $lt: dayEnd }, Water_Intake: { $exists: true, $ne: null } } },
      { $group: { _id: null, total: { $sum: '$Water_Intake' } } },
    ]);

    const totalWater = agg.length > 0 ? agg[0].total : 0;

    await DailyUpdate.findOneAndUpdate(
      { date: dayStart },
      { $set: { 'water.cattleDrinking': totalWater } },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error('syncWaterForDate error:', e.message);
  }
}

// Get all cattle records
router.get('/', async (req, res) => {
  try {
    const records = await CattleRecord.find().populate('cattleId');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get records for a specific cow
router.get('/cattle/:cattleId', async (req, res) => {
  try {
    const records = await CattleRecord.find({ cattleId: req.params.cattleId }).sort({ createdAt: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get weekly report data for a specific cow
router.get('/weekly-report/:cattleId', async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const records = await CattleRecord.find({
      cattleId: req.params.cattleId,
      createdAt: { $gte: oneWeekAgo }
    }).sort({ createdAt: 1 });
    
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new cattle record
router.post('/', async (req, res) => {
  const record = new CattleRecord(req.body);
  try {
    const newRecord = await record.save();
    // Auto-sync water consumption into DailyUpdate
    await syncWaterForDate(newRecord.createdAt);
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a record
router.patch('/:id', async (req, res) => {
  try {
    const record = await CattleRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    Object.assign(record, req.body);
    const updatedRecord = await record.save();
    // Auto-sync water consumption into DailyUpdate
    await syncWaterForDate(updatedRecord.createdAt);
    res.json(updatedRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a record
router.delete('/:id', async (req, res) => {
  try {
    const result = await CattleRecord.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
