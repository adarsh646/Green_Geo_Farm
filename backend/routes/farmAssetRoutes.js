const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FarmAsset = require('../models/FarmAsset');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, 'asset-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Get all assets
router.get('/', async (req, res) => {
  try {
    const assets = await FarmAsset.find();
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create asset with image
router.post('/', upload.single('image'), async (req, res) => {
  const asset = new FarmAsset({
    name: req.body.name,
    type: req.body.type,
    description: req.body.description,
    purchaseDate: req.body.purchaseDate,
    lastServiceDate: req.body.lastServiceDate,
    nextServiceDate: req.body.nextServiceDate,
    status: req.body.status,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
  });

  try {
    const newAsset = await asset.save();
    res.status(201).json(newAsset);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update asset with image
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const asset = await FarmAsset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const updateData = { ...req.body };
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    Object.assign(asset, updateData);
    const updatedAsset = await asset.save();
    res.json(updatedAsset);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete asset
router.delete('/:id', async (req, res) => {
  try {
    const result = await FarmAsset.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
