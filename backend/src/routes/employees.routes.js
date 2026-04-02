const { Router } = require('express');
const ctrl = require('../controllers/employees.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, schemas } = require('../middleware/validation');

const router = Router();

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, validate(schemas.idParam), ctrl.getById);
router.post('/', authenticate, authorize('ADMIN'), validate(schemas.createEmployee), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN'), validate(schemas.idParam), validate(schemas.updateEmployee), ctrl.update);
router.put('/:id/toggle', authenticate, authorize('ADMIN'), validate(schemas.idParam), ctrl.toggleActive);
router.post('/:id/services', authenticate, authorize('ADMIN'), ctrl.assignService);
router.delete('/:id/services/:serviceId', authenticate, authorize('ADMIN'), ctrl.removeService);

module.exports = router;
