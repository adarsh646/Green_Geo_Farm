const express = require('express');
const router = express.Router();
const DailyUpdate = require('../models/DailyUpdate');

// ── POST /api/daily-updates  — upsert a day's reading ──────────
router.post('/', async (req, res) => {
  try {
    const { date, energy, water, notes } = req.body;

    // Normalise to midnight UTC so each calendar day is unique
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);

    // Calculate total amount if not provided
    const totalWater = (water.irrigation || 0) + (water.cleaning || 0) + (water.cattleDrinking || 0);
    const waterData = { ...water, amount: totalWater };

    const doc = await DailyUpdate.findOneAndUpdate(
      { date: dayStart },
      { date: dayStart, energy, water: waterData, notes },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── GET /api/daily-updates  — all records ──────────────────────
router.get('/', async (req, res) => {
  try {
    const records = await DailyUpdate.find().sort({ date: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/daily-updates/monthly — aggregated per month ──────
router.get('/monthly', async (req, res) => {
  try {
    const agg = await DailyUpdate.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          totalSolar:     { $sum: '$energy.solar' },
          totalGenerator: { $sum: '$energy.generator' },
          totalKseb:      { $sum: '$energy.kseb' },
          totalIrrigation: { $sum: '$water.irrigation' },
          totalCleaning:   { $sum: '$water.cleaning' },
          totalCattleDrinking: { $sum: '$water.cattleDrinking' },
          totalWater:     { $sum: '$water.amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const result = agg.map(r => ({
      year:           r._id.year,
      month:          r._id.month - 1,
      monthLabel:     MONTHS[r._id.month - 1],
      totalSolar:     r.totalSolar,
      totalGenerator: r.totalGenerator,
      totalKseb:      r.totalKseb,
      totalEnergy:    r.totalSolar + r.totalGenerator + r.totalKseb,
      totalIrrigation: r.totalIrrigation,
      totalCleaning:   r.totalCleaning,
      totalCattleDrinking: r.totalCattleDrinking,
      totalWater:     r.totalWater,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/daily-updates/:date — single day ──────────────────
router.get('/:date', async (req, res) => {
  try {
    const dayStart = new Date(req.params.date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const record = await DailyUpdate.findOne({ date: dayStart });
    if (!record) return res.status(404).json({ message: 'No record for this date' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
