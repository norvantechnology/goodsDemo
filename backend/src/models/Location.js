const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['warehouse', 'shop'], required: true },
  parentLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  allowedDestinationLocationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
