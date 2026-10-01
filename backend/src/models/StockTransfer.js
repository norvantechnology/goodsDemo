const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const stockTransferSchema = new mongoose.Schema({
  transferNumber: { type: String, required: true, unique: true },
  sourceLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  destinationLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  items: [transferItemSchema],
  status: { type: String, enum: ['pending', 'approved', 'completed', 'cancelled'], default: 'pending' },
  transferDate: { type: Date, default: Date.now },
  notes: { type: String },
  isExceptionTransfer: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
