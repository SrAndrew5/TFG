const prisma = require('../config/database');
const { isResourceAvailable, getResourceOccupiedSlots } = require('../services/availability.service');
const { sendResourceBookingConfirmation } = require('../services/email.service');

/**
 * GET /api/resource-bookings
 * Cliente: sus reservas | Admin: todas
 */
async function getAll(req, res, next) {
  try {
    const { estado, fecha_desde, fecha_hasta, recurso_id } = req.query;
    const where = {};

    if (req.user.rol !== 'ADMIN') {
      where.usuario_id = req.user.id;
    }

    if (estado) where.estado = estado;
    if (recurso_id) where.recurso_id = parseInt(recurso_id);
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha.gte = new Date(fecha_desde);
      if (fecha_hasta) where.fecha.lte = new Date(fecha_hasta);
    }

    const reservas = await prisma.reservaRecurso.findMany({
      where,
      include: {
        usuario: {
          select: { id: true, nombre: true, apellidos: true, email: true },
        },
        recurso: {
          select: { id: true, nombre: true, tipo: true, ubicacion: true, precio_hora: true },
        },
      },
      orderBy: [{ fecha: 'desc' }, { hora_inicio: 'asc' }],
    });

    res.json({ success: true, data: reservas });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resource-bookings/availability?recursoId=X&date=YYYY-MM-DD
 */
async function checkAvailability(req, res, next) {
  try {
    const { recursoId, date } = req.query;

    if (!recursoId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros "recursoId" y "date" son obligatorios',
      });
    }

    const occupied = await getResourceOccupiedSlots(parseInt(recursoId), date);

    res.json({
      success: true,
      data: {
        recurso_id: parseInt(recursoId),
        fecha: date,
        occupied_slots: occupied,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/resource-bookings
 */
async function create(req, res, next) {
  try {
    const { recurso_id, fecha, hora_inicio, hora_fin, notas } = req.body;

    // Verificar que el recurso existe y está activo
    const recurso = await prisma.recurso.findUnique({ where: { id: recurso_id } });
    if (!recurso || !recurso.activo) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado o inactivo',
      });
    }

    // Verificar disponibilidad
    const available = await isResourceAvailable(recurso_id, fecha, hora_inicio, hora_fin);
    if (!available) {
      return res.status(409).json({
        success: false,
        message: 'El recurso no está disponible en el horario seleccionado',
      });
    }

    // Crear reserva
    const reserva = await prisma.reservaRecurso.create({
      data: {
        usuario_id: req.user.id,
        recurso_id,
        fecha: new Date(fecha),
        hora_inicio,
        hora_fin,
        notas,
      },
      include: {
        recurso: true,
      },
    });

    // Enviar email
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    sendResourceBookingConfirmation(
      { ...reserva, fecha },
      usuario,
      reserva.recurso
    );

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: reserva,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/resource-bookings/:id/status
 */
async function updateStatus(req, res, next) {
  try {
    const { estado } = req.body;
    const reservaId = parseInt(req.params.id);

    const reservaExistente = await prisma.reservaRecurso.findUnique({
      where: { id: reservaId },
    });

    if (!reservaExistente) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    if (req.user.rol !== 'ADMIN' && reservaExistente.usuario_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes acceso a esta reserva' });
    }

    if (req.user.rol === 'CLIENTE' && estado !== 'CANCELADA') {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes cancelar tus reservas',
      });
    }

    const reserva = await prisma.reservaRecurso.update({
      where: { id: reservaId },
      data: { estado },
    });

    res.json({
      success: true,
      message: `Reserva ${estado.toLowerCase()}`,
      data: reserva,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/resource-bookings/:id — Cancelar reserva
 */
async function remove(req, res, next) {
  try {
    const reservaId = parseInt(req.params.id);

    const reserva = await prisma.reservaRecurso.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    if (req.user.rol !== 'ADMIN' && reserva.usuario_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes acceso a esta reserva' });
    }

    await prisma.reservaRecurso.update({
      where: { id: reservaId },
      data: { estado: 'CANCELADA' },
    });

    res.json({ success: true, message: 'Reserva cancelada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, checkAvailability, create, updateStatus, remove };
