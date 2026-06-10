const express = require('express');
const router = express.Router();
const DailyUpdate = require('../models/DailyUpdate');
const CattleRecord = require('../models/CattleRecord');
const BioCngProduction = require('../models/BioCngProduction');
const BehaviorLog = require('../models/DailyBehaviorLog');

router.get('/daily-summary/:date', async (req, res) => {
  try {
    const requestedDate = new Date(req.params.date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(requestedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 1. Fetch Energy and Water (DailyUpdate normalizes to midnight UTC)
    const dailyUpdate = await DailyUpdate.findOne({ date: startOfDay });

    // 2. Fetch Bio-CNG Production for the day
    const cngRecords = await BioCngProduction.find({ 
      date: { $gte: startOfDay, $lte: endOfDay } 
    });
    const cngSummary = cngRecords.reduce((acc, curr) => {
      acc.gasProduced += curr.gasProduced || 0;
      acc.slurryProduced += curr.slurryProduced || 0;
      acc.totalMethaneAvoided += curr.totalMethaneAvoided || 0;
      acc.cafeCreditsPotential += curr.cafeCreditsPotential || 0;
      acc.ruralCostSavings += curr.ruralCostSavings || 0;
      return acc;
    }, { gasProduced: 0, slurryProduced: 0, totalMethaneAvoided: 0, cafeCreditsPotential: 0, ruralCostSavings: 0 });

    // 3. Fetch Detailed Cattle Records (Production & Health)
    const cattleRecords = await CattleRecord.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('cattleId', 'name tagNumber breed rfidTag'); // Include cattle details if cattleId is available

    let totalMilk = 0;
    let totalFeed = 0;
    let highRiskCount = 0;

    const cattleDetails = cattleRecords.map(record => {
      totalMilk += record.Total_Milk || 0;
      totalFeed += record.Total_Feed_Weight || 0;
      if (record.Health_Risk_Score > 7) highRiskCount++;

      return {
        _id: record._id,
        tagNumber: record.tagNumber,
        cattleId: record.cattleId,
        milkYield: record.Total_Milk || 0,
        feedIntake: record.Total_Feed_Weight || 0,
        healthRiskScore: record.Health_Risk_Score || 0,
        temperature: record.Body_Temperature || 0,
        methaneLevel: record.Methane_Level || 0
      };
    });

    const averageFeed = cattleRecords.length ? (totalFeed / cattleRecords.length) : 0;

    // 4. Fetch Behavior/Event Logs
    const dateString = requestedDate.toISOString().slice(0, 10);
    const rawBehaviorLogs = await BehaviorLog.find({ date: dateString });
    
    const behaviorLogs = rawBehaviorLogs.map(log => ({
      _id: log._id,
      timestamp: log.last_updated || new Date(),
      activityType: 'Behavior Log',
      anomalyDetected: false,
      notes: `Ruminating: ${log.total_ruminating}s, Eating: ${log.total_eating}s, Standing: ${log.total_standing}s`,
      cattleId: { tagNumber: log.cow_id }
    }));

    res.json({
      date: requestedDate,
      dailyUpdate: dailyUpdate || null,
      cngSummary,
      herdSummary: {
        totalMilk,
        averageFeed,
        highRiskCount,
        recordsCount: cattleRecords.length
      },
      cattleDetails, // Array of individual cattle data for that day
      behaviorLogs
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
