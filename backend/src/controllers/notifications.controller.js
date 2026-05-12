const prisma = require('../config/database');
const { emitToUser } = require('../config/socket');

/**
 * GET /api/notifications
 * Devuelve las notificaciones del usuario autenticado, más recientes primero,
 * junto con el contador de no leídas.
 */
async function getAll(req, res, next) {
  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { usuario_id: req.user.id },
        orderBy: { created_at: 'desc' },
        take: 100,
      }),
      prisma.notification.count({
        where: { usuario_id: req.user.id, read: false },
      }),
    ]);

    res.json({ success: true, data: { items, unreadCount } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notifications
 * Crea una notificación para el usuario autenticado.
 * Pensado para consumo desde el propio frontend al completar acciones.
 */
async function create(req, res, next) {
  try {
    const { type = 'info', title, body } = req.body;
    const notif = await prisma.notification.create({
      data: {
        usuario_id: req.user.id,
        type,
        title,
        body: body || null,
      },
    });
    // Push en tiempo real si el usuario tiene socket activo
    emitToUser(req.user.id, 'notification', notif);
    res.status(201).json({ success: true, data: notif });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marca una notificación concreta como leída.
 * updateMany asegura ownership en una sola query (no se puede marcar la de otro usuario).
 */
async function markRead(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await prisma.notification.updateMany({
      where: { id, usuario_id: req.user.id },
      data: { read: true },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marca todas las notificaciones del usuario como leídas.
 */
async function markAllRead(req, res, next) {
  try {
    const result = await prisma.notification.updateMany({
      where: { usuario_id: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ success: true, updated: result.count });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notifications/:id
 * Borra una notificación. deleteMany con filtro de ownership evita el race
 * de "comprobar y borrar" en dos queries.
 */
async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await prisma.notification.deleteMany({
      where: { id, usuario_id: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, create, markRead, markAllRead, remove };
