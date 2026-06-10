const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ShopProduct = require('../models/ShopProduct');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `shop-product-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const normalizeCategory = (categoryValue) => {
  const normalized = typeof categoryValue === 'string' ? categoryValue.trim().toLowerCase() : '';

  if (normalized === 'diary' || normalized === 'dairy') return 'Dairy';
  if (normalized === 'polutry' || normalized === 'poultry') return 'Poultry';
  if (normalized === 'fish') return 'Fish';

  return '';
};

router.get('/', async (req, res) => {
  try {
    const products = await ShopProduct.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, authorizeRoles('shopkeeper'), upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, unit } = req.body;

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanCategory = normalizeCategory(category);
    const cleanUnit = typeof unit === 'string' ? unit.trim() : '';
    const numericPrice = Number(price);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    if (!cleanName || !cleanCategory || !cleanUnit || Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'Name, category, unit, and a valid price are required' });
    }

    const product = new ShopProduct({
      name: cleanName,
      category: cleanCategory,
      price: numericPrice,
      unit: cleanUnit,
      imageUrl,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('shopkeeper'), upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, unit } = req.body;

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanCategory = normalizeCategory(category);
    const cleanUnit = typeof unit === 'string' ? unit.trim() : '';
    const numericPrice = Number(price);

    if (!cleanName || !cleanCategory || !cleanUnit || Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'Name, category, unit, and a valid price are required' });
    }

    const existingProduct = await ShopProduct.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    existingProduct.name = cleanName;
    existingProduct.category = cleanCategory;
    existingProduct.price = numericPrice;
    existingProduct.unit = cleanUnit;

    if (req.file) {
      existingProduct.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await existingProduct.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('shopkeeper'), async (req, res) => {
  try {
    const deletedProduct = await ShopProduct.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
