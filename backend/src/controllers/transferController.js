const mongoose = require('mongoose');
const StockTransfer = require('../models/StockTransfer');
const { validateTransferHierarchy } = require('../services/transferService');
const { addStock, deductStock } = require('../services/inventoryService');
const { runInTransaction } = require('../utils/transaction');

const generateTransferNumber = () => `TRF-${Date.now()}`;

exports.getTransfers = async (req, res, next) => {
  try {
    const { status, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.transferDate = {};
      if (from) filter.transferDate.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23,59,59,999); filter.transferDate.$lte = t; }
    }

    // Location restriction for non-admin
    if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
      const locationIds = req.user.locationIds.map(l => l._id || l);
      filter.$or = [
        { sourceLocationId: { $in: locationIds } },
        { destinationLocationId: { $in: locationIds } }
      ];
    }

    const transfers = await StockTransfer.find(filter)
      .populate('sourceLocationId', 'name code')
      .populate('destinationLocationId', 'name code')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await StockTransfer.countDocuments(filter);
    res.json({ success: true, data: transfers, total });
  } catch (error) { next(error); }
};

exports.getTransferById = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id)
      .populate('sourceLocationId', 'name code type')
      .populate('destinationLocationId', 'name code type')
      .populate('items.productId', 'name sku barcode')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .populate('completedBy', 'name');
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, data: transfer });
  } catch (error) { next(error); }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const { sourceLocationId, destinationLocationId, items, transferDate, notes } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Transfer must have at least one item' });
    }

    // Validate hierarchy
    const validation = await validateTransferHierarchy(sourceLocationId, destinationLocationId);
    if (!validation.allowed) {
      // Check if user is allowed to make exception transfers
      if (validation.isException && req.user.permissions.allowExceptionTransfer) {
        // Allow with isException flag
      } else {
        return res.status(400).json({ success: false, message: validation.reason });
      }
    }

    const transfer = await StockTransfer.create({
      transferNumber: generateTransferNumber(),
      sourceLocationId, destinationLocationId, items,
      transferDate: transferDate || new Date(),
      notes,
      isExceptionTransfer: validation.isException || false,
      createdBy: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    res.status(201).json({ success: true, data: transfer, message: 'Transfer created successfully' });
  } catch (error) { next(error); }
};

exports.approveTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transfer.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot approve a ${transfer.status} transfer` });
    }
    transfer.status = 'approved';
    transfer.approvedBy = req.user._id;
    await transfer.save();
    res.json({ success: true, data: transfer, message: 'Transfer approved' });
  } catch (error) { next(error); }
};

exports.completeTransfer = async (req, res, next) => {
  try {
    const transfer = await runInTransaction(async (session) => {
      let query = StockTransfer.findById(req.params.id);
      if (session) query = query.session(session);
      const t = await query;
      if (!t) {
        const err = new Error('Transfer not found');
        err.status = 404;
        throw err;
      }
      if (t.status !== 'approved') {
        const err = new Error(`Cannot complete a ${t.status} transfer`);
        err.status = 400;
        throw err;
      }

      // Process each item
      for (const item of t.items) {
        // Deduct from source
        await deductStock({
          productId: item.productId, locationId: t.sourceLocationId,
          quantity: item.quantity, movementType: 'transfer_out',
          referenceType: 'transfer', referenceId: t._id,
          notes: `Transfer to ${t.destinationLocationId}`, userId: req.user._id, session
        });

        // Add to destination
        await addStock({
          productId: item.productId, locationId: t.destinationLocationId,
          quantity: item.quantity, movementType: 'transfer_in',
          referenceType: 'transfer', referenceId: t._id,
          notes: `Transfer from ${t.sourceLocationId}`, userId: req.user._id, session
        });
      }

      t.status = 'completed';
      t.completedBy = req.user._id;
      if (session) await t.save({ session });
      else await t.save();

      return t;
    });

    res.json({ success: true, data: transfer, message: 'Transfer completed successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

exports.cancelTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (['completed', 'cancelled'].includes(transfer.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${transfer.status} transfer` });
    }
    transfer.status = 'cancelled';
    await transfer.save();
    res.json({ success: true, data: transfer, message: 'Transfer cancelled' });
  } catch (error) { next(error); }
};
