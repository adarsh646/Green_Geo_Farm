const express = require('express');
const router = express.Router();
const AnimalGroup = require('../models/AnimalGroup');
const CarbonEmissionFactor = require('../models/CarbonEmissionFactor');

// --- AnimalGroup Routes ---

// Get all animal groups
router.get('/animal-groups', async (req, res) => {
  try {
    const groups = await AnimalGroup.find();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create an animal group
router.post('/animal-groups', async (req, res) => {
  const group = new AnimalGroup(req.body);
  try {
    const newGroup = await group.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- CarbonEmissionFactor Routes ---

// Get the default emission factors
router.get('/emission-factors', async (req, res) => {
  try {
    // We assume there's one default region, e.g., 'India'
    let factor = await CarbonEmissionFactor.findOne({ region: 'India' });
    if (!factor) {
      // Create default if not exists
      factor = new CarbonEmissionFactor({ region: 'India' });
      await factor.save();
    }
    res.json(factor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update emission factors
router.put('/emission-factors', async (req, res) => {
  try {
    const updatedFactor = await CarbonEmissionFactor.findOneAndUpdate(
      { region: 'India' },
      req.body,
      { new: true, upsert: true }
    );
    res.json(updatedFactor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- Bio-CNG Production Routes ---
const BioCngProduction = require('../models/BioCngProduction');

// Get all Bio-CNG production logs
router.get('/bio-cng', async (req, res) => {
  try {
    const logs = await BioCngProduction.find().sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new Bio-CNG production log
router.post('/bio-cng', async (req, res) => {
  const log = new BioCngProduction(req.body);
  try {
    const newLog = await log.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
