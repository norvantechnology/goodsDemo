const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  quantity: { type: Number, default: 0, min: 0 },
  reservedQuantity: { type: Number, default: 0, min: 0 },
  damagedQuantity: { type: Number, default: 0, min: 0 },
  averageCost: { type: Number, default: 0, min: 0 },
  stockValue: { type: Number, default: 0 }
}, { timestamps: true });

inventorySchema.index({ productId: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
