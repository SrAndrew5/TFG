const { Router } = require('express');
const ctrl = require('../controllers/resourceBookings.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = Router();

router.get('/', authenticate, ctrl.getAll);
router.get('/availability', authenticate, ctrl.checkAvailability);
router.post('/', authenticate, validate(schemas.createResourceBooking), ctrl.create);
router.put('/:id/status', authenticate, validate(schemas.idParam), validate(schemas.updateAppointmentStatus), ctrl.updateStatus);
router.delete('/:id', authenticate, validate(schemas.idParam), ctrl.remove);

module.exports = router;
