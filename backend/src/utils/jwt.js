const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/**
 * Genera un token JWT para el usuario
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      rol: user.rol,
    },
    authConfig.secret,
    { expiresIn: authConfig.expiration }
  );
}

/**
 * Verifica y decodifica un token JWT
 */
function verifyToken(token) {
  return jwt.verify(token, authConfig.secret);
}

module.exports = { generateToken, verifyToken };
