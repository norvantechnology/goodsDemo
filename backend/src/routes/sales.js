const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/salesController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getSales);
router.post('/', ctrl.createSale);
router.get('/:id', ctrl.getSaleById);
router.post('/:id/return', ctrl.saleReturn);

module.exports = router;
