const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const StockTransfer = require('../models/StockTransfer');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const buildDateFilter = (from, to, field = 'createdAt') => {
  const filter = {};
  if (from || to) {
    filter[field] = {};
    if (from) filter[field].$gte = new Date(from);
    if (to) { const t = new Date(to); t.setHours(23,59,59,999); filter[field].$lte = t; }
  }
  return filter;
};

exports.stockReport = async (req, res, next) => {
  try {
    const { locationId } = req.query;
    const filter = locationId ? { locationId } : {};
    const inventory = await Inventory.find(filter)
      .populate('productId', 'name sku barcode minimumStock unit')
      .populate('locationId', 'name code type')
      .sort({ 'productId.name': 1 });
    res.json({ success: true, data: inventory });
  } catch (error) { next(error); }
};

exports.stockMovementReport = async (req, res, next) => {
  try {
    const { locationId, productId, type, from, to, page = 1, limit = 50 } = req.query;
    const filter = { ...buildDateFilter(from, to) };
    if (locationId) filter.locationId = locationId;
    if (productId) filter.productId = productId;
    if (type) filter.type = type;
    const movements = await StockMovement.find(filter)
      .populate('productId', 'name sku')
      .populate('locationId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await StockMovement.countDocuments(filter);
    res.json({ success: true, data: movements, total });
  } catch (error) { next(error); }
};

exports.salesReport = async (req, res, next) => {
  try {
    const { locationId, customerId, from, to, page = 1, limit = 50 } = req.query;
    const filter = { ...buildDateFilter(from, to, 'saleDate') };
    if (locationId) filter.locationId = locationId;
    if (customerId) filter.customerId = customerId;
    const sales = await Sale.find(filter)
      .populate('locationId', 'name').populate('customerId', 'name')
      .sort({ saleDate: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Sale.countDocuments(filter);
    const totalAmount = await Sale.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
    res.json({ success: true, data: sales, total, totalAmount: totalAmount[0]?.total || 0 });
  } catch (error) { next(error); }
};

exports.purchaseReport = async (req, res, next) => {
  try {
    const { supplierId, status, from, to, page = 1, limit = 50 } = req.query;
    const filter = { ...buildDateFilter(from, to, 'purchaseDate') };
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;
    const purchases = await Purchase.find(filter)
      .populate('supplierId', 'name').populate('locationId', 'name')
      .sort({ purchaseDate: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Purchase.countDocuments(filter);
    const totalAmount = await Purchase.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
    res.json({ success: true, data: purchases, total, totalAmount: totalAmount[0]?.total || 0 });
  } catch (error) { next(error); }
};

exports.outstandingReport = async (req, res, next) => {
  try {
    const customers = await Customer.find({ currentBalance: { $gt: 0 } }).sort({ currentBalance: -1 });
    const suppliers = await Supplier.find({ currentBalance: { $gt: 0 } }).sort({ currentBalance: -1 });
    const totalReceivables = customers.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
    res.json({ success: true, data: { customers, suppliers, totalReceivables, totalPayables } });
  } catch (error) { next(error); }
};

exports.transferReport = async (req, res, next) => {
  try {
    const { from, to, status, page = 1, limit = 50 } = req.query;
    const filter = { ...buildDateFilter(from, to, 'transferDate') };
    if (status) filter.status = status;
    const transfers = await StockTransfer.find(filter)
      .populate('sourceLocationId', 'name').populate('destinationLocationId', 'name')
      .populate('items.productId', 'name sku').populate('createdBy', 'name')
      .sort({ transferDate: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await StockTransfer.countDocuments(filter);
    res.json({ success: true, data: transfers, total });
  } catch (error) { next(error); }
};

exports.salesByProduct = async (req, res, next) => {
  try {
    const { from, to, locationId } = req.query;
    const filter = buildDateFilter(from, to, 'saleDate');
    if (locationId) filter.locationId = locationId;
    const result = await Sale.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.total' } } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { productName: '$product.name', sku: '$product.sku', totalQty: 1, totalRevenue: 1 } },
      { $sort: { totalRevenue: -1 } }
    ]);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.lowStockReport = async (req, res, next) => {
  try {
    const inventory = await Inventory.find()
      .populate({ path: 'productId', match: { status: 'active' }, select: 'name sku minimumStock unit' })
      .populate('locationId', 'name code');
    const lowStock = inventory
      .filter(i => i.productId && i.quantity <= i.productId.minimumStock)
      .map(i => ({
        product: i.productId, location: i.locationId,
        quantity: i.quantity, minimumStock: i.productId.minimumStock,
        shortage: i.productId.minimumStock - i.quantity
      }));
    res.json({ success: true, data: lowStock });
  } catch (error) { next(error); }
};
