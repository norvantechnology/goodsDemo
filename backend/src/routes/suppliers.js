const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getSuppliers);
router.post('/', ctrl.createSupplier);
router.get('/:id', ctrl.getSupplierById);
router.put('/:id', ctrl.updateSupplier);
router.post('/:id/payment', ctrl.makePayment);

module.exports = router;
