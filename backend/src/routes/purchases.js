const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchaseController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getPurchases);
router.post('/', ctrl.createPurchase);
router.get('/:id', ctrl.getPurchaseById);
router.post('/:id/receive', ctrl.receivePurchase);
router.post('/:id/pay', ctrl.payPurchase);
router.post('/:id/return', ctrl.returnPurchase);

module.exports = router;
