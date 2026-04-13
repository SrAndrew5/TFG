const { Router } = require('express');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const router = Router();

/**
 * GET /api/discount-codes/validate?code=XXXX
 * Valida un código de descuento. Requiere autenticación.
 */
router.get('/validate', authenticate, (req, res) => {
  try {
    const { code } = req.query;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Introduce un código de descuento' });
    }

    // Cargamos el JSON en cada petición para que los cambios en el fichero se reflejen sin reiniciar
    const codesPath = path.join(__dirname, '../config/discount-codes.json');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    delete require.cache[require.resolve(codesPath)];
    const codes = require(codesPath);

    const found = codes.find((c) => c.code === code.trim().toUpperCase());

    if (!found) {
      return res.status(404).json({ success: false, message: 'Código de descuento no válido o expirado' });
    }

    return res.json({
      success: true,
      data: {
        code: found.code,
        percent: found.percent,
        description: found.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al validar el código' });
  }
});

module.exports = router;
