const mongoose = require('mongoose');

const shopProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['Dairy', 'Poultry', 'Fish'] },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopProduct', shopProductSchema);
