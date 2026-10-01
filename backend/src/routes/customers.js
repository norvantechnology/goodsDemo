const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getCustomers);
router.post('/', ctrl.createCustomer);
router.get('/:id', ctrl.getCustomerById);
router.put('/:id', ctrl.updateCustomer);
router.post('/:id/payment', ctrl.receivePayment);

module.exports = router;
