const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');

exports.getExpenses = async (req, res, next) => {
  try {
    const { category, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23,59,59,999); filter.date.$lte = t; }
    }
    const expenses = await Expense.find(filter)
      .populate('locationId', 'name').populate('createdBy', 'name')
      .sort({ date: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Expense.countDocuments(filter);
    res.json({ success: true, data: expenses, total });
  } catch (error) { next(error); }
};

exports.createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      expenseNumber: `EXP-${Date.now()}`,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) { next(error); }
};

exports.getPayments = async (req, res, next) => {
  try {
    const { type, partyType, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (partyType) filter.partyType = partyType;
    if (from || to) {
      filter.paymentDate = {};
      if (from) filter.paymentDate.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23,59,59,999); filter.paymentDate.$lte = t; }
    }
    const payments = await Payment.find(filter)
      .populate('createdBy', 'name')
      .sort({ paymentDate: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Payment.countDocuments(filter);
    res.json({ success: true, data: payments, total });
  } catch (error) { next(error); }
};

exports.createPayment = async (req, res, next) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      paymentNumber: `PAY-${Date.now()}`,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error) { next(error); }
};

exports.getProfitAndLoss = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) { const t = new Date(to); t.setHours(23,59,59,999); dateFilter.$lte = t; }

    const saleFilter = Object.keys(dateFilter).length ? { saleDate: dateFilter } : {};
    const purchaseFilter = Object.keys(dateFilter).length ? { purchaseDate: dateFilter, status: 'received' } : { status: 'received' };
    const expenseFilter = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    // Revenue
    const salesAgg = await Sale.aggregate([
      { $match: saleFilter },
      { $group: { _id: null, revenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);

    // Cost of goods (purchase cost)
    const cogs = await Sale.aggregate([
      { $match: saleFilter },
      { $unwind: '$items' },
      { $lookup: { from: 'inventories', let: { pid: '$items.productId', lid: '$locationId' }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$productId', '$$pid'] }, { $eq: ['$locationId', '$$lid'] }] } } }], as: 'inv' } },
      { $unwind: { path: '$inv', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, cogs: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$inv.averageCost', 0] }] } } } }
    ]);

    // Total expenses
    const expenseAgg = await Expense.aggregate([
      { $match: expenseFilter },
      { $group: { _id: null, total: { $sum: '$amount' }, byCategory: { $push: { category: '$category', amount: '$amount' } } } }
    ]);

    const expenseByCategory = await Expense.aggregate([
      { $match: expenseFilter },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const revenue = salesAgg[0]?.revenue || 0;
    const totalCogs = cogs[0]?.cogs || 0;
    const grossProfit = revenue - totalCogs;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      success: true,
      data: {
        revenue, cogs: totalCogs, grossProfit,
        expenses: totalExpenses, netProfit,
        salesCount: salesAgg[0]?.count || 0,
        expenseByCategory
      }
    });
  } catch (error) { next(error); }
};

exports.getBalanceSheet = async (req, res, next) => {
  try {
    // Assets
    const stockValue = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$stockValue' } } }
    ]);
    const receivables = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$currentBalance' } } }
    ]);

    // Cash/Bank (sum of all receipts - payments)
    const totalReceipts = await Payment.aggregate([
      { $match: { type: 'receipt' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPayments = await Payment.aggregate([
      { $match: { type: 'payment' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const cash = (totalReceipts[0]?.total || 0) - (totalPayments[0]?.total || 0) - (totalExpenses[0]?.total || 0);

    // Liabilities
    const payables = await Supplier.aggregate([
      { $group: { _id: null, total: { $sum: '$currentBalance' } } }
    ]);

    const totalAssets = (stockValue[0]?.total || 0) + (receivables[0]?.total || 0) + Math.max(0, cash);
    const totalLiabilities = payables[0]?.total || 0;
    const equity = totalAssets - totalLiabilities;

    res.json({
      success: true,
      data: {
        assets: {
          inventory: stockValue[0]?.total || 0,
          receivables: receivables[0]?.total || 0,
          cash: Math.max(0, cash),
          total: totalAssets
        },
        liabilities: {
          payables: payables[0]?.total || 0,
          total: totalLiabilities
        },
        equity
      }
    });
  } catch (error) { next(error); }
};
