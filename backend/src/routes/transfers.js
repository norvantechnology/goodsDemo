const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transferController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getTransfers);
router.post('/', ctrl.createTransfer);
router.get('/:id', ctrl.getTransferById);
router.post('/:id/approve', authorize('admin', 'accountant'), ctrl.approveTransfer);
router.post('/:id/complete', ctrl.completeTransfer);
router.post('/:id/cancel', ctrl.cancelTransfer);

module.exports = router;
