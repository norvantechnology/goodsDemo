const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const SaleReturn = require('../models/SaleReturn');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const { deductStock, addStock } = require('../services/inventoryService');
const Payment = require('../models/Payment');
const { runInTransaction } = require('../utils/transaction');

const generateInvoiceNumber = () => `INV-${Date.now()}`;
const generateReturnNumber = () => `RET-${Date.now()}`;

exports.getSales = async (req, res, next) => {
  try {
    const { locationId, customerId, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (customerId) filter.customerId = customerId;
    if (from || to) {
      filter.saleDate = {};
      if (from) filter.saleDate.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23,59,59,999); filter.saleDate.$lte = t; }
    }

    // Location restriction for shop users
    if (req.user.role === 'shop_user') {
      const locationIds = req.user.locationIds.map(l => l._id || l);
      filter.locationId = { $in: locationIds };
    }

    const sales = await Sale.find(filter)
      .populate('locationId', 'name code')
      .populate('customerId', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Sale.countDocuments(filter);
    res.json({ success: true, data: sales, total });
  } catch (error) { next(error); }
};

exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('locationId', 'name code')
      .populate('customerId', 'name phone email address')
      .populate('items.productId', 'name sku barcode')
      .populate('createdBy', 'name');
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (error) { next(error); }
};

exports.createSale = async (req, res, next) => {
  try {
    const { locationId, customerId, items, subtotal, discount, taxAmount, grandTotal, paymentMethod, paidAmount, notes } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale must have at least one item' });
    }

    const saleDoc = await runInTransaction(async (session) => {
      // Check stock availability for all items first
      for (const item of items) {
        let q = Inventory.findOne({ productId: item.productId, locationId });
        if (session) q = q.session(session);
        const inv = await q;
        if (!inv || inv.quantity < item.quantity) {
          const err = new Error(`Insufficient stock for product. Available: ${inv?.quantity || 0}, Requested: ${item.quantity}`);
          err.status = 400;
          throw err;
        }
      }

      // Determine payment status
      const paid = paidAmount || grandTotal;
      let paymentStatus = 'paid';
      if (paid < grandTotal && paymentMethod === 'credit') paymentStatus = 'credit';
      else if (paid < grandTotal) paymentStatus = 'partial';

      const saleData = {
        invoiceNumber: generateInvoiceNumber(),
        locationId, customerId, items, subtotal,
        discount: discount || 0, taxAmount: taxAmount || 0, grandTotal,
        paymentMethod: paymentMethod || 'cash',
        paymentStatus, paidAmount: paid, notes,
        saleDate: new Date(), createdBy: req.user._id
      };

      const opts = session ? { session } : {};
      const sale = await Sale.create([saleData], opts);

      // Deduct stock for each item
      for (const item of items) {
        await deductStock({
          productId: item.productId, locationId,
          quantity: item.quantity, movementType: 'sale',
          referenceType: 'sale', referenceId: sale[0]._id,
          notes: `Sale ${sale[0].invoiceNumber}`, userId: req.user._id, session
        });
      }

      // Update customer balance if credit
      if (customerId && paymentStatus === 'credit') {
        const custOpts = session ? { session } : {};
        await Customer.findByIdAndUpdate(customerId, { $inc: { currentBalance: grandTotal - paid } }, custOpts);
      }

      return sale[0];
    });

    const populatedSale = await Sale.findById(saleDoc._id)
      .populate('locationId', 'name')
      .populate('customerId', 'name')
      .populate('items.productId', 'name sku');

    res.status(201).json({ success: true, data: populatedSale, message: 'Sale completed successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

exports.saleReturn = async (req, res, next) => {
  try {
    const { items, reason } = req.body;

    const returnDoc = await runInTransaction(async (session) => {
      let q = Sale.findById(req.params.id);
      if (session) q = q.session(session);
      const sale = await q;
      if (!sale) {
        const err = new Error('Sale not found');
        err.status = 404;
        throw err;
      }

      const totalRefund = items.reduce((sum, item) => sum + item.total, 0);

      const returnData = {
        returnNumber: generateReturnNumber(),
        saleId: sale._id, locationId: sale.locationId,
        customerId: sale.customerId, items, totalRefund, reason,
        createdBy: req.user._id
      };

      const opts = session ? { session } : {};
      const saleReturn = await SaleReturn.create([returnData], opts);

      // Add stock back
      for (const item of items) {
        await addStock({
          productId: item.productId, locationId: sale.locationId,
          quantity: item.quantity, movementType: 'sale_return',
          referenceType: 'return', referenceId: saleReturn[0]._id,
          notes: `Return for invoice ${sale.invoiceNumber}`, userId: req.user._id, session
        });
      }

      // Update customer balance if applicable
      if (sale.customerId) {
        const custOpts = session ? { session } : {};
        await Customer.findByIdAndUpdate(sale.customerId, { $inc: { currentBalance: -totalRefund } }, custOpts);
      }

      return saleReturn[0];
    });

    res.json({ success: true, data: returnDoc, message: 'Return processed successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};
