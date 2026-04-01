const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hashea una contraseña
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara una contraseña plana con su hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };
