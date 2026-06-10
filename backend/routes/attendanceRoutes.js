const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const attendance = await Attendance.findOne({ date });
    res.json(attendance || { date, records: {} });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const year = Number(req.params.year);
    const monthIndex = Number(req.params.month) - 1;
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1));

    const startKey = start.toISOString().slice(0, 10);
    const endKey = end.toISOString().slice(0, 10);

    const records = await Attendance.find({ date: { $gte: startKey, $lt: endKey } }).sort({ date: 1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { records = {}, lastUpdatedBy = 'system' } = req.body || {};

    const attendance = await Attendance.findOneAndUpdate(
      { date },
      { date, records, lastUpdatedBy },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
