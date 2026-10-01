const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accountingController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/expenses', ctrl.getExpenses);
router.post('/expenses', ctrl.createExpense);
router.get('/payments', ctrl.getPayments);
router.post('/payments', ctrl.createPayment);
router.get('/profit-loss', ctrl.getProfitAndLoss);
router.get('/balance-sheet', ctrl.getBalanceSheet);

module.exports = router;
