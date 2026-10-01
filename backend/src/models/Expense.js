const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now, required: true },
  category: {
    type: String,
    enum: ['rent', 'electricity', 'transport', 'salary', 'office_expense', 'other'],
    required: true
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank', 'other'], default: 'cash' },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
