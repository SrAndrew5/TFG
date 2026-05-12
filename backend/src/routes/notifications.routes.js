const { Router } = require('express');
const ctrl = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = Router();

router.get('/', authenticate, ctrl.getAll);
router.post('/', authenticate, validate(schemas.createNotification), ctrl.create);
router.patch('/read-all', authenticate, ctrl.markAllRead);
router.patch('/:id/read', authenticate, validate(schemas.idParam), ctrl.markRead);
router.delete('/:id', authenticate, validate(schemas.idParam), ctrl.remove);

module.exports = router;
