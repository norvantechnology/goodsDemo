const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const { addStock } = require('../services/inventoryService');

exports.getInventory = async (req, res, next) => {
  try {
    const { locationId, search, lowStock, page = 1, limit = 50 } = req.query;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'accountant';
    const userLocationIds = req.user.locationIds.map(l => l._id || l);

    const filter = {};
    if (locationId) filter.locationId = locationId;
    else if (!isAdmin) filter.locationId = { $in: userLocationIds };

    let query = Inventory.find(filter)
      .populate('productId', 'name sku barcode minimumStock unit sellingPrice purchasePrice')
      .populate('locationId', 'name code type')
      .sort({ updatedAt: -1 });

    let inventory = await query;

    // Filter by search
    if (search) {
      inventory = inventory.filter(i =>
        i.productId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.productId?.sku?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter low stock
    if (lowStock === 'true') {
      inventory = inventory.filter(i => i.quantity <= (i.productId?.minimumStock || 0));
    }

    // Add stock status
    const result = inventory.map(i => {
      const minStock = i.productId?.minimumStock || 0;
      let stockStatus = 'in_stock';
      if (i.quantity === 0) stockStatus = 'out_of_stock';
      else if (i.quantity <= minStock) stockStatus = 'low_stock';
      return { ...i.toObject(), stockStatus };
    });

    res.json({ success: true, data: result, total: result.length });
  } catch (error) { next(error); }
};

exports.getMovements = async (req, res, next) => {
  try {
    const { locationId, productId, type, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (productId) filter.productId = productId;
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23,59,59,999); filter.createdAt.$lte = t; }
    }

    const movements = await StockMovement.find(filter)
      .populate('productId', 'name sku')
      .populate('locationId', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await StockMovement.countDocuments(filter);
    res.json({ success: true, data: movements, total });
  } catch (error) { next(error); }
};

exports.adjustment = async (req, res, next) => {
  try {
    const { productId, locationId, quantity, type, notes } = req.body;
    if (!productId || !locationId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'productId, locationId, and quantity are required' });
    }

    let inv;
    if (quantity > 0) {
      inv = await addStock({
        productId, locationId, quantity, movementType: 'adjustment',
        referenceType: 'adjustment', notes, userId: req.user._id
      });
    } else if (quantity < 0) {
      const { deductStock } = require('../services/inventoryService');
      inv = await deductStock({
        productId, locationId, quantity: Math.abs(quantity), movementType: 'adjustment',
        referenceType: 'adjustment', notes, userId: req.user._id
      });
    }

    res.json({ success: true, data: inv, message: 'Stock adjusted successfully' });
  } catch (error) { next(error); }
};
