module.exports = {
  secret: process.env.JWT_SECRET || 'dev-fallback-secret',
  expiration: process.env.JWT_EXPIRATION || '24h',
};
