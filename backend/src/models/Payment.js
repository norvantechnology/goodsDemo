const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['receipt', 'payment'], required: true },
  partyType: { type: String, enum: ['customer', 'supplier'], required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyModel' },
  partyModel: { type: String, enum: ['Customer', 'Supplier'] },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank', 'other'], default: 'cash' },
  referenceType: { type: String, enum: ['sale', 'purchase', 'manual'] },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  notes: { type: String },
  paymentDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
