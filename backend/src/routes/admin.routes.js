const { Router } = require('express');
const ctrl = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN'), ctrl.getStats);
router.get('/users', authenticate, authorize('ADMIN'), ctrl.getUsers);
router.put('/users/:id/toggle', authenticate, authorize('ADMIN'), ctrl.toggleUser);

module.exports = router;
