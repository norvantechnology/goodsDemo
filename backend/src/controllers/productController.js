const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } }
    ];
    if (category) filter.categoryId = category;
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments(filter);

    // Get total stock for each product
    const productIds = products.map(p => p._id);
    const inventorySummary = await Inventory.aggregate([
      { $match: { productId: { $in: productIds } } },
      { $group: { _id: '$productId', totalQty: { $sum: '$quantity' } } }
    ]);
    const stockMap = {};
    inventorySummary.forEach(i => { stockMap[i._id.toString()] = i.totalQty; });

    const result = products.map(p => ({
      ...p.toObject(),
      totalStock: stockMap[p._id.toString()] || 0
    }));

    res.json({ success: true, data: result, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) { next(error); }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Stock by location
    const stockByLocation = await Inventory.find({ productId: product._id })
      .populate('locationId', 'name code type');

    // Recent movements
    const movements = await StockMovement.find({ productId: product._id })
      .populate('locationId', 'name').populate('createdBy', 'name')
      .sort({ createdAt: -1 }).limit(20);

    // Recent sales
    const recentSales = await Sale.find({ 'items.productId': product._id })
      .populate('locationId', 'name').sort({ createdAt: -1 }).limit(10);

    // Recent purchases
    const recentPurchases = await Purchase.find({ 'items.productId': product._id })
      .populate('supplierId', 'name').sort({ createdAt: -1 }).limit(10);

    res.json({ success: true, data: { product, stockByLocation, movements, recentSales, recentPurchases } });
  } catch (error) { next(error); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) { next(error); }
};

exports.getByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode, status: 'active' }).populate('categoryId', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};
