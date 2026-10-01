const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Expense = require('../models/Expense');
const StockTransfer = require('../models/StockTransfer');
const Payment = require('../models/Payment');
const Product = require('../models/Product');

exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build location filter based on user role
    const isAdmin = req.user.role === 'admin' || req.user.role === 'accountant';
    const userLocationIds = req.user.locationIds.map(l => l._id || l);

    const locationFilter = isAdmin ? {} : { locationId: { $in: userLocationIds } };

    // Today's sales
    const todaySalesAgg = await Sale.aggregate([
      { $match: { saleDate: { $gte: today, $lt: tomorrow }, ...locationFilter } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);

    // Today's purchases
    const todayPurchasesAgg = await Purchase.aggregate([
      { $match: { purchaseDate: { $gte: today, $lt: tomorrow }, ...locationFilter } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);

    // Total stock value
    const invFilter = isAdmin ? {} : { locationId: { $in: userLocationIds } };
    const stockAgg = await Inventory.aggregate([
      { $match: invFilter },
      { $group: { _id: null, totalValue: { $sum: '$stockValue' }, totalQty: { $sum: '$quantity' } } }
    ]);

    // Receivables (customer outstanding)
    const receivables = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$currentBalance' } } }
    ]);

    // Payables (supplier outstanding)
    const payables = await Supplier.aggregate([
      { $group: { _id: null, total: { $sum: '$currentBalance' } } }
    ]);

    // Total expenses this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const expensesAgg = await Expense.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Location-wise stock summary
    const locationStock = await Inventory.aggregate([
      { $match: invFilter },
      { $group: { _id: '$locationId', totalQty: { $sum: '$quantity' }, totalValue: { $sum: '$stockValue' } } },
      { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'location' } },
      { $unwind: '$location' },
      { $project: { locationName: '$location.name', totalQty: 1, totalValue: 1 } }
    ]);

    // Low stock items (quantity <= minimumStock)
    const lowStockItems = await Inventory.aggregate([
      { $match: invFilter },
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $match: { $expr: { $lte: ['$quantity', '$product.minimumStock'] }, quantity: { $gt: 0 } } },
      { $lookup: { from: 'locations', localField: 'locationId', foreignField: '_id', as: 'location' } },
      { $unwind: '$location' },
      { $project: { productName: '$product.name', sku: '$product.sku', locationName: '$location.name', quantity: 1, minimumStock: '$product.minimumStock' } },
      { $limit: 10 }
    ]);

    // Sales trend (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const salesTrend = await Sale.aggregate([
      { $match: { saleDate: { $gte: sevenDaysAgo }, ...locationFilter } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } }, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Shop-wise sales today
    const shopSales = await Sale.aggregate([
      { $match: { saleDate: { $gte: today, $lt: tomorrow }, ...locationFilter } },
      { $group: { _id: '$locationId', total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'location' } },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
      { $project: { locationName: { $ifNull: ['$location.name', 'Unknown'] }, total: 1, count: 1 } }
    ]);

    // Recent transactions
    const recentSales = await Sale.find(locationFilter).sort({ createdAt: -1 }).limit(5)
      .populate('customerId', 'name').populate('locationId', 'name');
    const recentPurchases = await Purchase.find(isAdmin ? {} : { locationId: { $in: userLocationIds } }).sort({ createdAt: -1 }).limit(5)
      .populate('supplierId', 'name').populate('locationId', 'name');
    const recentTransfers = await StockTransfer.find().sort({ createdAt: -1 }).limit(5)
      .populate('sourceLocationId', 'name').populate('destinationLocationId', 'name');

    res.json({
      success: true,
      data: {
        todaySales: todaySalesAgg[0] || { total: 0, count: 0 },
        todayPurchases: todayPurchasesAgg[0] || { total: 0, count: 0 },
        totalStockValue: stockAgg[0]?.totalValue || 0,
        totalStockQuantity: stockAgg[0]?.totalQty || 0,
        receivables: receivables[0]?.total || 0,
        payables: payables[0]?.total || 0,
        monthlyExpenses: expensesAgg[0]?.total || 0,
        locationStock,
        lowStockItems,
        salesTrend,
        shopSales,
        recentSales,
        recentPurchases,
        recentTransfers
      }
    });
  } catch (error) {
    next(error);
  }
};
