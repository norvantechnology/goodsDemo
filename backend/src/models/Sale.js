const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank', 'other', 'credit'], default: 'cash' },
  paymentStatus: { type: String, enum: ['paid', 'partial', 'credit'], default: 'paid' },
  paidAmount: { type: Number, default: 0 },
  notes: { type: String },
  saleDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
