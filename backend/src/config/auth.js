if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido. El servidor no puede arrancar en producción sin él.');
}

module.exports = {
  secret: process.env.JWT_SECRET || 'dev-fallback-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-fallback-secret',
  accessExpiration: '15m',
  refreshExpiration: '7d',
};
