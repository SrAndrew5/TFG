const { Router } = require('express');
const ctrl = require('../controllers/reviews.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = Router();

// El listado por entidad es público (no requiere auth) — son reseñas visibles
// para clientes que aún no se han registrado. La creación sí necesita login.
router.get('/', validate(schemas.reviewsQuery), ctrl.getByEntity);
router.post('/', authenticate, validate(schemas.createReview), ctrl.create);

module.exports = router;
