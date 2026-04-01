const { Router } = require('express');
const ctrl = require('../controllers/appointments.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = Router();

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, validate(schemas.idParam), ctrl.getById);
router.post('/', authenticate, validate(schemas.createAppointment), ctrl.create);
router.put('/:id/status', authenticate, validate(schemas.idParam), validate(schemas.updateAppointmentStatus), ctrl.updateStatus);
router.delete('/:id', authenticate, validate(schemas.idParam), ctrl.remove);

module.exports = router;
