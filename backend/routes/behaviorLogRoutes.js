const express = require('express');
const router = express.Router();
const DailyBehaviorLog = require('../models/DailyBehaviorLog');

// Get historical logs for a specific cow
router.get('/:cowId', async (req, res) => {
  try {
    const { cowId } = req.params;
    // We expect cowId to be something like "Ammini" or "TX-402"
    const logs = await DailyBehaviorLog.find({ cow_id: cowId })
      .sort({ date: 1 })
      .limit(30); // get up to the last 30 days
    res.json(logs);
  } catch (error) {
    console.error('Error fetching behavior logs:', error);
    res.status(500).json({ message: 'Server error fetching behavior logs' });
  }
});

module.exports = router;
