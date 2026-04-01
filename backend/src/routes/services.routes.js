const { Router } = require('express');
const ctrl = require('../controllers/services.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, schemas } = require('../middleware/validation');

const router = Router();

router.get('/', authenticate, ctrl.getAll);
router.get('/categories', authenticate, ctrl.getCategories);
router.get('/:id', authenticate, validate(schemas.idParam), ctrl.getById);
router.post('/', authenticate, authorize('ADMIN'), validate(schemas.createService), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN'), validate(schemas.idParam), validate(schemas.updateService), ctrl.update);
router.delete('/:id', authenticate, authorize('ADMIN'), validate(schemas.idParam), ctrl.remove);

module.exports = router;
