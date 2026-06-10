const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FeedStock = require('../models/FeedStock');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, 'feed-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Get all feed stocks (supports optional pagination)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const totalCount = await FeedStock.countDocuments();
    const feedStocks = await FeedStock.find()
      .sort({ lastUpdated: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (req.query.page || req.query.limit) {
      res.json({ items: feedStocks, totalCount, page, limit });
    } else {
      res.json(feedStocks);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new feed type (Admin only)
router.post('/add', upload.single('image'), async (req, res) => {
  const { feedType, maxCapacity, category } = req.body;
  const cleanFeedType = typeof feedType === 'string' ? feedType.trim() : '';
  const numericMaxCapacity = Number(maxCapacity);

  if (!cleanFeedType || Number.isNaN(numericMaxCapacity) || numericMaxCapacity <= 0) {
    return res.status(400).json({ message: 'Feed type and valid max capacity are required' });
  }

  const feedStock = new FeedStock({
    feedType: cleanFeedType,
    category: category || 'Other',
    maxCapacity: numericMaxCapacity,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
  });

  try {
    const newFeedStock = await feedStock.save();
    res.status(201).json(newFeedStock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update weight of a feed type (Rancher/Admin) - Replaces weight
router.put('/update-weight', async (req, res) => {
  const { feedType, weight } = req.body;

  try {
    const feedStock = await FeedStock.findOne({ feedType });
    if (!feedStock) {
      return res.status(404).json({ message: 'Feed type not found' });
    }

    if (parseFloat(weight) > feedStock.maxCapacity) {
      return res.status(400).json({ message: `Weight exceeds maximum storage capacity of ${feedStock.maxCapacity} kg` });
    }

    feedStock.weight = parseFloat(weight);
    feedStock.lastUpdated = Date.now();
    await feedStock.save();

    res.json(feedStock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Re-fill stock (Adds to existing weight)
router.put('/refill', async (req, res) => {
  const { feedType, weight } = req.body;

  try {
    const feedStock = await FeedStock.findOne({ feedType });
    if (!feedStock) {
      return res.status(404).json({ message: 'Feed type not found' });
    }

    const newWeight = feedStock.weight + parseFloat(weight);
    if (newWeight > feedStock.maxCapacity) {
      return res.status(400).json({ message: `Refilling exceeds maximum storage capacity of ${feedStock.maxCapacity} kg. Current weight: ${feedStock.weight} kg.` });
    }

    feedStock.weight = newWeight;
    feedStock.lastUpdated = Date.now();
    await feedStock.save();

    res.json(feedStock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Dispense feed (Subtracts from existing weight)
router.put('/dispense', async (req, res) => {
  const { feedType, weight } = req.body;

  try {
    const currentStock = await FeedStock.findOne({ feedType });
    if (!currentStock) {
      return res.status(404).json({ message: 'Feed type not found' });
    }
    if (currentStock.weight < parseFloat(weight)) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const updatedFeedStock = await FeedStock.findOneAndUpdate(
      { feedType },
      { $inc: { weight: -parseFloat(weight) }, lastUpdated: Date.now() },
      { new: true }
    );
    res.json(updatedFeedStock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a feed type (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const deletedFeedStock = await FeedStock.findByIdAndDelete(req.params.id);
    if (!deletedFeedStock) {
      return res.status(404).json({ message: 'Feed type not found' });
    }
    res.json({ message: 'Feed type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
