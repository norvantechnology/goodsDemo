const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stock', ctrl.stockReport);
router.get('/stock-movement', ctrl.stockMovementReport);
router.get('/sales', ctrl.salesReport);
router.get('/purchases', ctrl.purchaseReport);
router.get('/outstanding', ctrl.outstandingReport);
router.get('/transfers', ctrl.transferReport);
router.get('/sales-by-product', ctrl.salesByProduct);
router.get('/low-stock', ctrl.lowStockReport);

module.exports = router;
