const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'accountant', 'warehouse_user', 'shop_user'], required: true },
  locationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
  permissions: {
    view: { type: Boolean, default: true },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    transfer: { type: Boolean, default: false },
    sell: { type: Boolean, default: false },
    purchase: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    accounting: { type: Boolean, default: false },
    allowExceptionTransfer: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function(password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('User', userSchema);
