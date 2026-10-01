const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');

exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
    const suppliers = await Supplier.find(filter).sort({ name: 1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Supplier.countDocuments(filter);
    res.json({ success: true, data: suppliers, total });
  } catch (error) { next(error); }
};

exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    const purchases = await Purchase.find({ supplierId: supplier._id }).populate('locationId', 'name').sort({ createdAt: -1 }).limit(20);
    const payments = await Payment.find({ partyId: supplier._id, partyType: 'supplier' }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: { supplier, purchases, payments } });
  } catch (error) { next(error); }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({ ...req.body, currentBalance: req.body.openingBalance || 0 });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

exports.makePayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    supplier.currentBalance = Math.max(0, supplier.currentBalance - amount);
    await supplier.save();

    const payment = await Payment.create({
      paymentNumber: `PAY-${Date.now()}`,
      type: 'payment', partyType: 'supplier',
      partyId: supplier._id, partyModel: 'Supplier',
      amount, paymentMethod: paymentMethod || 'cash',
      referenceType: 'manual', notes, createdBy: req.user._id
    });

    res.json({ success: true, data: payment, message: 'Payment made to supplier' });
  } catch (error) { next(error); }
};
