const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getInventory);
router.get('/movements', ctrl.getMovements);
router.post('/adjustment', ctrl.adjustment);

module.exports = router;
