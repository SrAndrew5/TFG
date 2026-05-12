const { Server } = require('socket.io');
const logger = require('./logger');

let io = null;

/**
 * Inicializa Socket.io sobre el httpServer existente.
 * Debe llamarse una sola vez al arrancar, antes de app.listen.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    // Permite reconexión automática del cliente
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'WS client connected');

    // El cliente envía su userId tras conectar para suscribirse a su sala privada
    socket.on('register', (userId) => {
      if (!userId) return;
      const room = `user:${Number(userId)}`;
      socket.join(room);
      logger.debug({ userId, socketId: socket.id, room }, 'WS client registered');
    });

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'WS client disconnected');
    });
  });

  return io;
}

/**
 * Emite un evento a todos los sockets suscritos al userId dado.
 * Si el servidor arrancó sin socket.io (ej. tests), no hace nada.
 */
function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${Number(userId)}`).emit(event, data);
}

module.exports = { initSocket, emitToUser };
