const prisma = require('../config/database');
const { getAvailableSlots, timeToMinutes } = require('../services/availability.service');
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require('../services/email.service');
const { priceForAppointment } = require('../services/pricing.service');
const { audit } = require('../middleware/audit');
const logger = require('../config/logger');

/**
 * GET /api/appointments
 * Cliente: sus citas | Admin: todas
 */
async function getAll(req, res, next) {
  try {
    const { estado, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
    // Cap a 100 para evitar que un cliente pida ?limit=999999 y haga DoS al servidor
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;
    const where = {};

    // Si no es admin, solo sus citas
    if (req.user.rol !== 'ADMIN') {
      where.usuario_id = req.user.id;
    }

    if (estado) where.estado = estado;
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha.gte = new Date(fecha_desde);
      if (fecha_hasta) where.fecha.lte = new Date(fecha_hasta);
    }

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        include: {
          usuario: {
            select: { id: true, nombre: true, apellidos: true, email: true, telefono: true },
          },
          empleado: {
            select: { id: true, nombre: true, apellidos: true, especialidad: true },
          },
          servicio: {
            select: { id: true, nombre: true, duracion_min: true, precio: true, categoria: true },
          },
          // Para que el frontend sepa si esta cita ya tiene reseña y oculte el botón
          review: { select: { id: true, rating: true, comentario: true } },
        },
        orderBy: [{ fecha: 'desc' }, { hora_inicio: 'asc' }],
        skip,
        take,
      }),
      prisma.cita.count({ where }),
    ]);

    res.json({ success: true, data: citas, total, page: parseInt(page), limit: take });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/appointments/:id
 */
async function getById(req, res, next) {
  try {
    const cita = await prisma.cita.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellidos: true, email: true, telefono: true },
        },
        empleado: {
          select: { id: true, nombre: true, apellidos: true, especialidad: true, avatar_url: true },
        },
        servicio: true,
      },
    });

    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    // Verificar que el usuario es dueño o admin
    if (req.user.rol !== 'ADMIN' && cita.usuario_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes acceso a esta cita' });
    }

    res.json({ success: true, data: cita });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/appointments
 */
async function create(req, res, next) {
  try {
    // OJO: precio_pagado NO se acepta del cliente. Lo recalcula el servidor.
    const { empleado_id, servicio_id, fecha, hora_inicio, notas, codigo_descuento } = req.body;

    // Validar que la fecha no sea pasada
    const fechaReserva = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaReserva < hoy) {
      return res.status(400).json({ success: false, message: 'No se puede reservar en una fecha pasada' });
    }

    // Obtener servicio para calcular hora_fin
    const servicio = await prisma.servicio.findUnique({ where: { id: servicio_id } });
    if (!servicio || !servicio.activo) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado o inactivo' });
    }

    // Verificar que el empleado existe y ofrece el servicio
    const asignacion = await prisma.servicioEmpleado.findFirst({
      where: { empleado_id, servicio_id },
    });
    if (!asignacion) {
      return res.status(400).json({
        success: false,
        message: 'Este empleado no ofrece el servicio seleccionado',
      });
    }

    // Calcular hora_fin
    const startMinutes = timeToMinutes(hora_inicio);
    const endMinutes = startMinutes + servicio.duracion_min;
    const hora_fin = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Verificar disponibilidad y crear la cita en una sola transacción
    // con bloqueo pesimista sobre el empleado para evitar race conditions
    const cita = await prisma.$transaction(async (tx) => {
      // 1. Bloqueamos la fila del empleado para serializar reservas concurrentes
      await tx.$executeRaw`SELECT * FROM empleados WHERE id = ${empleado_id} FOR UPDATE`;

      // 2. Verificar conflictos: mismo empleado, misma fecha, no cancelada, rango solapado
      const conflict = await tx.cita.findFirst({
        where: {
          empleado_id,
          fecha: fechaReserva,
          estado: { notIn: ['CANCELADA'] },
          AND: [
            { hora_inicio: { lt: hora_fin } },
            { hora_fin: { gt: hora_inicio } }
          ]
        },
      });

      if (conflict) {
        const err = new Error('El horario seleccionado ya no está disponible. Por favor, elige otro momento.');
        err.statusCode = 409;
        throw err;
      }

      // El precio se calcula DENTRO de la transacción
      const precioFinal = await priceForAppointment(tx, servicio_id, codigo_descuento);

      // Denormalizamos business_id desde el servicio, si existe. Permite al panel
      // BUSINESS_OWNER filtrar sus citas en una sola query indexada.
      const serv = await tx.servicio.findUnique({
        where: { id: servicio_id },
        select: { business_id: true },
      });

      return tx.cita.create({
        data: {
          usuario_id: req.user.id,
          empleado_id,
          servicio_id,
          fecha: fechaReserva,
          hora_inicio,
          hora_fin,
          notas,
          precio_pagado: precioFinal,
          codigo_descuento: codigo_descuento ? codigo_descuento.trim().toUpperCase() : null,
          business_id: serv?.business_id ?? null,
        },
        include: {
          empleado: { select: { id: true, nombre: true, apellidos: true } },
          servicio: { select: { id: true, nombre: true, precio: true } },
        },
      });
    });

    // Enviar email de confirmación en segundo plano (no bloquea la respuesta)
    prisma.usuario.findUnique({ where: { id: req.user.id } }).then((usuario) => {
      sendAppointmentConfirmation(
        { ...cita, fecha },
        usuario,
        cita.servicio,
        cita.empleado
      ).catch((err) => logger.error({ err }, 'Error enviando email de confirmación de cita'));
    });

    audit({ usuarioId: req.user.id, accion: 'CREAR_CITA', entidad: 'cita', entidadId: cita.id, ip: req.ip });

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: cita,
    });
  } catch (error) {
    // Errores de dominio (404 servicio, 400 código inválido, 409 slot ocupado)
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * PUT /api/appointments/:id/status
 */
async function updateStatus(req, res, next) {
  try {
    const { estado } = req.body;
    const citaId = parseInt(req.params.id);

    const citaExistente = await prisma.cita.findUnique({
      where: { id: citaId },
      include: { servicio: true, usuario: true },
    });

    if (!citaExistente) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    // Verificar permisos
    if (req.user.rol !== 'ADMIN' && citaExistente.usuario_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes acceso a esta cita' });
    }

    // Los clientes solo pueden cancelar
    if (req.user.rol === 'CLIENTE' && estado !== 'CANCELADA') {
      return res.status(403).json({
        success: false,
        message: 'Solo puedes cancelar tus citas',
      });
    }

    const cita = await prisma.cita.update({
      where: { id: citaId },
      data: { estado },
    });

    // Si se cancela, enviar email en segundo plano
    if (estado === 'CANCELADA') {
      sendAppointmentCancellation(citaExistente, citaExistente.usuario, citaExistente.servicio)
        .catch((err) => logger.error({ err }, 'Error enviando email de cancelación de cita'));
    }

    audit({ usuarioId: req.user.id, accion: `ESTADO_CITA_${estado}`, entidad: 'cita', entidadId: citaId, ip: req.ip });

    res.json({
      success: true,
      message: `Cita ${estado.toLowerCase()}`,
      data: cita,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/appointments/:id — Cancelar cita
 */
async function remove(req, res, next) {
  try {
    const citaId = parseInt(req.params.id);

    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: { servicio: true, usuario: true },
    });

    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    if (req.user.rol !== 'ADMIN' && cita.usuario_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No tienes acceso a esta cita' });
    }

    await prisma.cita.update({
      where: { id: citaId },
      data: { estado: 'CANCELADA' },
    });

    sendAppointmentCancellation(cita, cita.usuario, cita.servicio)
      .catch((err) => logger.error({ err }, 'Error enviando email de cancelación'));

    res.json({ success: true, message: 'Cita cancelada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, updateStatus, remove };
