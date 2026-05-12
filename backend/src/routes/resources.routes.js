const { Router } = require('express');
const ctrl = require('../controllers/resources.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, schemas } = require('../middleware/validation');

const router = Router();

router.get('/', optionalAuthenticate, ctrl.getAll);
router.get('/:id', optionalAuthenticate, validate(schemas.idParam), ctrl.getById);
router.post('/', authenticate, authorize('ADMIN'), validate(schemas.createResource), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN'), validate(schemas.idParam), validate(schemas.updateResource), ctrl.update);
router.delete('/:id', authenticate, authorize('ADMIN'), validate(schemas.idParam), ctrl.remove);

module.exports = router;
