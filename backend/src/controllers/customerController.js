const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');

exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
    const customers = await Customer.find(filter).sort({ name: 1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Customer.countDocuments(filter);
    res.json({ success: true, data: customers, total });
  } catch (error) { next(error); }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const sales = await Sale.find({ customerId: customer._id }).populate('locationId', 'name').sort({ createdAt: -1 }).limit(20);
    const payments = await Payment.find({ partyId: customer._id, partyType: 'customer' }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: { customer, sales, payments } });
  } catch (error) { next(error); }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create({ ...req.body, currentBalance: req.body.openingBalance || 0 });
    res.status(201).json({ success: true, data: customer });
  } catch (error) { next(error); }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) { next(error); }
};

exports.receivePayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    customer.currentBalance = Math.max(0, customer.currentBalance - amount);
    await customer.save();

    const payment = await Payment.create({
      paymentNumber: `RCP-${Date.now()}`,
      type: 'receipt', partyType: 'customer',
      partyId: customer._id, partyModel: 'Customer',
      amount, paymentMethod: paymentMethod || 'cash',
      referenceType: 'manual', notes, createdBy: req.user._id
    });

    res.json({ success: true, data: payment, message: 'Payment received' });
  } catch (error) { next(error); }
};
