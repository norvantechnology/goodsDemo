const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  type: {
    type: String,
    enum: ['opening_stock', 'purchase', 'transfer_in', 'transfer_out', 'sale', 'sale_return', 'purchase_return', 'adjustment', 'damaged'],
    required: true
  },
  quantity: { type: Number, required: true },
  referenceType: { type: String, enum: ['purchase', 'transfer', 'sale', 'adjustment', 'return', 'opening'] },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
