const { Router } = require('express');
const ctrl = require('../controllers/availability.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, schemas } = require('../middleware/validation');

const router = Router();

router.get('/:employeeId', authenticate, ctrl.getByEmployee);
router.get('/:employeeId/slots', authenticate, ctrl.getSlots);
router.post('/', authenticate, authorize('ADMIN'), validate(schemas.createAvailability), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN'), ctrl.update);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.remove);

module.exports = router;
