const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/users', authorize('admin'), ctrl.getUsers);
router.post('/users', authorize('admin'), ctrl.createUser);
router.put('/users/:id', authorize('admin'), ctrl.updateUser);
router.delete('/users/:id', authorize('admin'), ctrl.deleteUser);
router.get('/locations', ctrl.getLocations);
router.get('/categories', ctrl.getCategories);
router.post('/categories', ctrl.createCategory);

module.exports = router;
