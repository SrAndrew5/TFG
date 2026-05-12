const prisma = require('../config/database');
const { isResourceAvailable, getResourceOccupiedSlots } = require('../services/availability.service');
const { sendResourceBookingConfirmation } = require('../services/email.service');
const { priceForResourceBooking } = require('../services/pricing.service');
const logger = require('../config/logger');

/**
 * GET /api/resource-bookings
 * Cliente: sus reservas | Admin: todas
 */
async function getAll(req, res, next) {
  try {
    const { estado, fecha_desde, fecha_hasta, recurso_id, page = 1, limit = 20 } = req.query;
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;
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

    const [reservas, total] = await Promise.all([
      prisma.reservaRecurso.findMany({
        where,
        include: {
          usuario: {
            select: { id: true, nombre: true, apellidos: true, email: true },
          },
          recurso: {
            select: { id: true, nombre: true, tipo: true, ubicacion: true, precio_hora: true },
          },
          review: { select: { id: true, rating: true, comentario: true } },
        },
        orderBy: [{ fecha: 'desc' }, { hora_inicio: 'asc' }],
        skip,
        take,
      }),
      prisma.reservaRecurso.count({ where }),
    ]);

    res.json({ success: true, data: reservas, total, page: parseInt(page), limit: take });
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
    // OJO: precio_pagado NO se acepta del cliente. Lo recalcula el servidor.
    const { recurso_id, fecha, hora_inicio, hora_fin, notas, codigo_descuento } = req.body;

    // Validar que la fecha no sea pasada
    const fechaReserva = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaReserva < hoy) {
      return res.status(400).json({ success: false, message: 'No se puede reservar en una fecha pasada' });
    }

    // Verificar que el recurso existe, está activo y su negocio también lo está
    const recurso = await prisma.recurso.findUnique({
      where: { id: recurso_id },
      select: {
        activo: true,
        business_id: true,
        precio_hora: true,
        business: { select: { estado: true } },
      },
    });

    if (!recurso || !recurso.activo) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado o inactivo',
      });
    }

    // Si el recurso pertenece a un negocio, éste debe estar ACTIVO
    if (recurso.business_id && recurso.business?.estado !== 'ACTIVO') {
      return res.status(409).json({
        success: false,
        message: 'Este espacio no está disponible actualmente',
      });
    }

    // Verificar disponibilidad y crear reserva en una sola transacción
    // con bloqueo pesimista para evitar race conditions en entornos de alta concurrencia
    const reserva = await prisma.$transaction(async (tx) => {
      // 1. Bloqueamos el recurso específico ANTES de cualquier comprobación (FIX 1)
      await tx.$executeRaw`SELECT * FROM recursos WHERE id = ${recurso_id} FOR UPDATE`;

      const conflict = await tx.reservaRecurso.findFirst({
        where: {
          recurso_id,
          fecha: fechaReserva,
          estado: { notIn: ['CANCELADA'] },
          hora_inicio: { lt: hora_fin },
          hora_fin: { gt: hora_inicio },
        },
      });

      if (conflict) {
        const err = new Error('El recurso ya ha sido reservado por otro usuario en este instante.');
        err.statusCode = 409;
        throw err;
      }

      // Precio recalculado server-side (le pasamos el recurso ya cargado)
      const precioFinal = await priceForResourceBooking(tx, recurso, hora_inicio, hora_fin, codigo_descuento);

      return tx.reservaRecurso.create({
        data: {
          usuario_id: req.user.id,
          recurso_id,
          fecha: fechaReserva,
          hora_inicio,
          hora_fin,
          notas,
          precio_pagado: precioFinal,
          codigo_descuento: codigo_descuento ? codigo_descuento.trim().toUpperCase() : null,
          business_id: recurso.business_id,
        },
        include: {
          recurso: true,
        },
      });
    });

    // Enviar email en segundo plano (no bloquea la respuesta)
    prisma.usuario.findUnique({ where: { id: req.user.id } }).then((usuario) => {
      sendResourceBookingConfirmation({ ...reserva, fecha }, usuario, reserva.recurso)
        .catch((err) => logger.error({ err }, 'Error enviando email de confirmación de reserva'));
    });

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: reserva,
    });
  } catch (error) {
    // Errores de dominio (404 recurso, 400 código, 409 slot ocupado)
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
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

    if (req.user.rol !== 'ADMIN' && estado !== 'CANCELADA') {
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
