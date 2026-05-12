const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/**
 * Genera un Access Token (corto plazo: 15 min)
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      rol: user.rol,
      business_id: user.business?.id || user.business_id || null,
    },
    authConfig.secret,
    { expiresIn: '15m' }
  );
}

/**
 * Genera un Refresh Token (largo plazo: 7 días)
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    authConfig.refreshSecret,
    { expiresIn: '7d' }
  );
}

function verifyToken(token, isRefresh = false) {
  return jwt.verify(token, isRefresh ? authConfig.refreshSecret : authConfig.secret);
}

module.exports = { generateToken, generateRefreshToken, verifyToken };
