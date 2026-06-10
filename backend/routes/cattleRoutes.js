const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Cattle = require('../models/Cattle');
const NutritionPlan = require('../models/NutritionPlan');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const MODEL_UPLOADS_DIR = path.join(UPLOADS_DIR, 'cattle-models');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(MODEL_UPLOADS_DIR, { recursive: true });

const createFileName = (prefix, originalName) => {
  const extension = path.extname(originalName || '').toLowerCase();
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
};

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, createFileName('image', file.originalname));
  },
});

const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, MODEL_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, createFileName('model', file.originalname));
  },
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const modelUpload = multer({
  storage: modelStorage,
  fileFilter: (req, file, cb) => {
    const isSupported = /\.(glb|gltf)$/i.test(file.originalname || '');
    if (!isSupported) {
      return cb(new Error('Only .glb and .gltf files are allowed'));
    }
    cb(null, true);
  },
});

const removeFileByUrl = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.startsWith('/uploads/')) {
    return;
  }

  const relativePath = fileUrl.replace('/uploads/', '');
  const resolvedPath = path.resolve(UPLOADS_DIR, relativePath);
  const uploadsRoot = path.resolve(UPLOADS_DIR);

  if (!resolvedPath.startsWith(uploadsRoot)) {
    return;
  }

  try {
    await fs.promises.unlink(resolvedPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error removing file ${resolvedPath}:`, error.message);
    }
  }
};

// Get all cattle (supports optional pagination and search)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const search = (req.query.search || '').trim();
    const filter = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { tagNumber: regex },
        { breed: regex },
        { gender: regex },
      ];
    }

    const totalCount = await Cattle.countDocuments(filter);
    const cattle = await Cattle.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (req.query.page || req.query.limit || req.query.search) {
      res.json({ items: cattle, totalCount, page, limit });
    } else {
      res.json(cattle);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one cattle
router.get('/:id', async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id);
    if (!cattle) return res.status(404).json({ message: 'Cattle not found' });
    res.json(cattle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create cattle with image upload (admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  imageUpload.single('image'),
  async (req, res) => {
    const cattle = new Cattle({
      tagNumber: req.body.tagNumber,
      breed: req.body.breed,
      age: req.body.age,
      gender: req.body.gender,
      healthStatus: req.body.healthStatus,
      weight: req.body.weight,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
    });

    try {
      const newCattle = await cattle.save();
      res.status(201).json(newCattle);
    } catch (err) {
      if (req.file) {
        await removeFileByUrl(`/uploads/${req.file.filename}`);
      }
      res.status(400).json({ message: err.message });
    }
  }
);

// Update cattle profile image/details (admin only)
router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  imageUpload.single('image'),
  async (req, res) => {
    try {
      const cattle = await Cattle.findById(req.params.id);
      if (!cattle) return res.status(404).json({ message: 'Cattle not found' });

      const previousImageUrl = cattle.imageUrl;
      const updateData = { ...req.body };

      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      Object.assign(cattle, updateData);
      const updatedCattle = await cattle.save();

      if (req.file && previousImageUrl && previousImageUrl !== updatedCattle.imageUrl) {
        await removeFileByUrl(previousImageUrl);
      }

      res.json(updatedCattle);
    } catch (err) {
      if (req.file) {
        await removeFileByUrl(`/uploads/${req.file.filename}`);
      }
      res.status(400).json({ message: err.message });
    }
  }
);

// Upload or replace 3D model (admin only)
router.patch(
  '/:id/model',
  authenticateToken,
  authorizeRoles('admin'),
  modelUpload.single('model3d'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: '3D model file is required' });
    }

    try {
      const cattle = await Cattle.findById(req.params.id);
      if (!cattle) {
        await removeFileByUrl(`/uploads/cattle-models/${req.file.filename}`);
        return res.status(404).json({ message: 'Cattle not found' });
      }

      const previousModelUrl = cattle.model3dUrl;
      cattle.model3dUrl = `/uploads/cattle-models/${req.file.filename}`;

      const updatedCattle = await cattle.save();

      if (previousModelUrl && previousModelUrl !== updatedCattle.model3dUrl) {
        await removeFileByUrl(previousModelUrl);
      }

      res.json(updatedCattle);
    } catch (err) {
      await removeFileByUrl(`/uploads/cattle-models/${req.file.filename}`);
      res.status(400).json({ message: err.message });
    }
  }
);

// Delete 3D model (admin only)
router.delete(
  '/:id/model',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const cattle = await Cattle.findById(req.params.id);
      if (!cattle) return res.status(404).json({ message: 'Cattle not found' });

      if (cattle.model3dUrl) {
        await removeFileByUrl(cattle.model3dUrl);
      }

      cattle.model3dUrl = '';
      const updatedCattle = await cattle.save();
      res.json(updatedCattle);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Delete cattle (admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const result = await Cattle.findByIdAndDelete(req.params.id);
      if (!result) return res.status(404).json({ message: 'Cattle not found' });

      if (result.imageUrl) {
        await removeFileByUrl(result.imageUrl);
      }

      if (result.model3dUrl) {
        await removeFileByUrl(result.model3dUrl);
      }

      res.json({ message: 'Cattle deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Add an event to a cattle
router.post(
  '/:id/events',
  authenticateToken,
  async (req, res) => {
    try {
      const cattle = await Cattle.findById(req.params.id);
      if (!cattle) return res.status(404).json({ message: 'Cattle not found' });

      const newEvent = {
        eventType: req.body.eventType,
        eventDate: req.body.eventDate,
        doctorName: req.body.doctorName,
        medicineGiven: req.body.medicineGiven,
        notes: req.body.notes
      };

      cattle.events.push(newEvent);
      const updatedCattle = await cattle.save();
      
      res.status(201).json(updatedCattle);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// Add or update a nutrition plan for a cattle (persist generated plan)
router.post(
  '/:id/nutrition-plan',
  authenticateToken,
  async (req, res) => {
    try {
      const cattle = await Cattle.findById(req.params.id);
      if (!cattle) return res.status(404).json({ message: 'Cattle not found' });

      const newPlanData = {
        cattleId: cattle._id,
        roughageStrategy: req.body.inputs?.roughage_strategy || req.body.roughageStrategy || req.body.roughage_strategy,
        inputs: req.body.inputs || {},
        dietPlan: req.body.diet_plan || req.body.dietPlan || {}
      };

      // Upsert: Find existing plan by cattleId and update, or insert if not found.
      const savedPlan = await NutritionPlan.findOneAndUpdate(
        { cattleId: cattle._id },
        { $set: newPlanData },
        { new: true, upsert: true }
      );

      res.status(201).json({ cattle: cattle, addedPlan: savedPlan });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// Get nutrition plans for a cattle
router.get('/:id/nutrition-plans', async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id);
    if (!cattle) return res.status(404).json({ message: 'Cattle not found' });
    
    // Fetch from NutritionPlan collection
    const plan = await NutritionPlan.findOne({ cattleId: cattle._id });
    // We can return it as an array to match the existing frontend expectations if it exists, or just empty array
    res.json(plan ? [plan] : []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
