const pino = require('pino');

// En tests silenciamos los logs por defecto (LOG_LEVEL=info los reactiva si se necesita).
const defaultLevel = process.env.NODE_ENV === 'test' ? 'silent' : 'info';

const logger = pino({
  level: process.env.LOG_LEVEL || defaultLevel,
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } }
      : undefined,
});

module.exports = logger;
