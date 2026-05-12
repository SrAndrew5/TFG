const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const prisma = require('../config/database');

/**
 * Middleware de autenticación JWT
 * Verifica el token y adjunta el usuario al request
 */
async function authenticate(req, res, next) {
  try {
    // Cookie httpOnly tiene prioridad; Authorization header como fallback (Swagger/tests)
    const token = req.cookies?.token
      || (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.split(' ')[1]
          : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso no proporcionado',
      });
    }
    const decoded = jwt.verify(token, authConfig.secret);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        rol: true,
        activo: true,
        motivo_suspension: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Cuenta suspendida',
        motivo: usuario.motivo_suspension || null,
      });
    }

    req.user = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }
    next(error);
  }
}

async function optionalAuthenticate(req, res, next) {
  try {
    const token = req.cookies?.token
      || (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.split(' ')[1]
          : null);

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, authConfig.secret);
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { id: true, nombre: true, apellidos: true, email: true, rol: true, activo: true },
    });

    if (usuario && usuario.activo) {
      req.user = usuario;
    }
    next();
  } catch (error) {
    // Si el token es inválido o expiró, simplemente ignoramos al usuario (es un guest)
    next();
  }
}

module.exports = { authenticate, optionalAuthenticate };
