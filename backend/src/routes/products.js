const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/barcode/:barcode', ctrl.getByBarcode);
router.get('/', ctrl.getProducts);
router.post('/', ctrl.createProduct);
router.get('/:id', ctrl.getProductById);
router.put('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
