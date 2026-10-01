const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const { addStock } = require('../services/inventoryService');
const { runInTransaction } = require('../utils/transaction');

const generatePurchaseNumber = () => `PO-${Date.now()}`;

exports.getPurchases = async (req, res, next) => {
  try {
    const { supplierId, status, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;
    if (from || to) {
      filter.purchaseDate = {};
      if (from) filter.purchaseDate.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23,59,59,999); filter.purchaseDate.$lte = t; }
    }

    const purchases = await Purchase.find(filter)
      .populate('supplierId', 'name')
      .populate('locationId', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Purchase.countDocuments(filter);
    res.json({ success: true, data: purchases, total });
  } catch (error) { next(error); }
};

exports.getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierId', 'name phone email address')
      .populate('locationId', 'name code')
      .populate('items.productId', 'name sku barcode')
      .populate('createdBy', 'name');
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.json({ success: true, data: purchase });
  } catch (error) { next(error); }
};

exports.createPurchase = async (req, res, next) => {
  try {
    const { supplierId, locationId, items, subtotal, discount, taxAmount, grandTotal, notes, purchaseDate } = req.body;
    const purchase = await Purchase.create({
      purchaseNumber: generatePurchaseNumber(),
      supplierId, locationId, items, subtotal, discount: discount || 0,
      taxAmount: taxAmount || 0, grandTotal,
      notes, purchaseDate: purchaseDate || new Date(),
      createdBy: req.user._id, status: 'ordered'
    });
    res.status(201).json({ success: true, data: purchase, message: 'Purchase order created' });
  } catch (error) { next(error); }
};

exports.receivePurchase = async (req, res, next) => {
  try {
    const updatedPurchase = await runInTransaction(async (session) => {
      let q = Purchase.findById(req.params.id);
      if (session) q = q.session(session);
      const purchase = await q;
      if (!purchase) {
        const err = new Error('Purchase not found');
        err.status = 404;
        throw err;
      }
      if (purchase.status === 'received') {
        const err = new Error('Purchase already received');
        err.status = 400;
        throw err;
      }
      if (purchase.status === 'cancelled') {
        const err = new Error('Cannot receive cancelled purchase');
        err.status = 400;
        throw err;
      }

      // Add stock for each item
      for (const item of purchase.items) {
        await addStock({
          productId: item.productId, locationId: purchase.locationId,
          quantity: item.quantity, averageCost: item.purchasePrice,
          movementType: 'purchase',
          referenceType: 'purchase', referenceId: purchase._id,
          notes: `Purchase ${purchase.purchaseNumber}`, userId: req.user._id, session
        });
      }

      // Update supplier balance
      const suppOpts = session ? { session } : {};
      await Supplier.findByIdAndUpdate(
        purchase.supplierId,
        { $inc: { currentBalance: purchase.grandTotal - (purchase.paidAmount || 0) } },
        suppOpts
      );

      purchase.status = 'received';
      purchase.receivedAt = new Date();
      if (session) await purchase.save({ session });
      else await purchase.save();

      return purchase;
    });

    res.json({ success: true, data: updatedPurchase, message: 'Goods received and stock updated' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

exports.payPurchase = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    const newPaidAmount = (purchase.paidAmount || 0) + amount;
    purchase.paidAmount = Math.min(newPaidAmount, purchase.grandTotal);
    purchase.paymentStatus = purchase.paidAmount >= purchase.grandTotal ? 'paid' : 'partial';

    // Update supplier balance
    await Supplier.findByIdAndUpdate(purchase.supplierId, { $inc: { currentBalance: -amount } });

    // Create payment record
    const Payment = require('../models/Payment');
    await Payment.create({
      paymentNumber: `PAY-${Date.now()}`,
      type: 'payment', partyType: 'supplier',
      partyId: purchase.supplierId, partyModel: 'Supplier',
      amount, paymentMethod: paymentMethod || 'cash',
      referenceType: 'purchase', referenceId: purchase._id,
      createdBy: req.user._id
    });

    await purchase.save();
    res.json({ success: true, data: purchase, message: 'Payment recorded' });
  } catch (error) { next(error); }
};

exports.returnPurchase = async (req, res, next) => {
  try {
    const { items, reason } = req.body;

    const result = await runInTransaction(async (session) => {
      let q = Purchase.findById(req.params.id);
      if (session) q = q.session(session);
      const purchase = await q;
      if (!purchase) {
        const err = new Error('Purchase not found');
        err.status = 404;
        throw err;
      }
      if (purchase.status !== 'received') {
        const err = new Error('Can only return received purchases');
        err.status = 400;
        throw err;
      }

      const { deductStock } = require('../services/inventoryService');
      let totalRefund = 0;

      for (const item of items) {
        const returnQty = Number(item.quantity);
        const price = Number(item.purchasePrice || item.price || 0);
        const refundAmt = price * returnQty;
        totalRefund += refundAmt;

        await deductStock({
          productId: item.productId,
          locationId: purchase.locationId,
          quantity: returnQty,
          movementType: 'purchase_return',
          referenceType: 'purchase',
          referenceId: purchase._id,
          notes: `Purchase return: ${reason || 'Returned to supplier'}`,
          userId: req.user._id,
          session
        });
      }

      const suppOpts = session ? { session } : {};
      await Supplier.findByIdAndUpdate(
        purchase.supplierId,
        { $inc: { currentBalance: -totalRefund } },
        suppOpts
      );

      return { totalRefund };
    });

    res.json({ success: true, message: 'Purchase return processed successfully', totalRefund: result.totalRefund });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

