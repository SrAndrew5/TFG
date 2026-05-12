const { Router } = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = Router();

/**
 * GET /api/discount-codes/validate?code=XXXX
 * Solo informativo — el descuento real lo aplica el servidor en pricing.service
 * cuando se crea la cita/reserva. Aquí no consumimos uso, solo verificamos.
 */
router.get('/validate', authenticate, async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Introduce un código de descuento' });
    }

    const codigo = code.trim().toUpperCase();
    const cd = await prisma.codigoDescuento.findUnique({ where: { codigo } });

    if (!cd || !cd.activo) {
      return res.status(404).json({ success: false, message: 'Código de descuento no válido' });
    }
    if (cd.fecha_expiry && cd.fecha_expiry < new Date()) {
      return res.status(404).json({ success: false, message: 'Código de descuento expirado' });
    }
    if (cd.max_usos !== null && cd.usos_actuales >= cd.max_usos) {
      return res.status(404).json({ success: false, message: 'Código de descuento agotado' });
    }

    return res.json({
      success: true,
      data: {
        code: cd.codigo,
        percent: cd.porcentaje,
        description: cd.descripcion,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
