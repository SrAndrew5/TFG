const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const prisma = require('../config/database');

/**
 * Middleware de autenticación JWT
 * Verifica el token y adjunta el usuario al request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso no proporcionado',
      });
    }

    const token = authHeader.split(' ')[1];
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
        message: 'Cuenta desactivada',
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

module.exports = { authenticate };
