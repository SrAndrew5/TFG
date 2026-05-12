const prisma = require('../config/database');
const { audit } = require('../middleware/audit');
const {
  sendAppointmentConfirmedByBusinessEmail,
  sendAppointmentCancelledByBusinessEmail,
} = require('../services/email.service');
const logger = require('../config/logger');

async function loadActiveBusinessForOwner(req, res) {
  const business = await prisma.business.findUnique({ where: { owner_id: req.user.id } });
  if (!business) {
    res.status(404).json({ success: false, message: 'No tienes negocio registrado' });
    return null;
  }
  if (business.estado !== 'ACTIVO') {
    res.status(403).json({ success: false, message: 'Tu negocio no está activo' });
    return null;
  }
  return business;
}

async function getBusinessAppointments(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;

    const { range = 'all', estado, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

    const where = { business_id: business.id };
    if (estado) where.estado = estado;

    if (range !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (range === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        where.fecha = { gte: today, lt: tomorrow };
      } else if (range === 'week') {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        where.fecha = { gte: today, lt: weekEnd };
      }
    }

    if (search) {
      where.usuario = { OR: [{ nombre: { contains: search } }, { email: { contains: search } }] };
    }

    const [items, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        include: { usuario: true, servicio: true, empleado: true },
        orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
        skip, take,
      }),
      prisma.cita.count({ where }),
    ]);

    return res.json({ success: true, data: items, total, page: parseInt(page), limit: take });
  } catch (error) { next(error); }
}

async function updateBusinessAppointmentStatus(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;

    const id = parseInt(req.params.id);
    const { estado, motivo } = req.body;

    const cita = await prisma.cita.findUnique({ where: { id }, include: { usuario: true, servicio: true } });
    if (!cita || cita.business_id !== business.id) return res.status(404).json({ success: false, message: 'No encontrado' });

    const updated = await prisma.cita.update({ where: { id }, data: { estado } });

    if (estado === 'CONFIRMADA') {
      sendAppointmentConfirmedByBusinessEmail(cita.usuario, updated, cita.servicio, business.nombre).catch(err => logger.error(err));
    } else if (estado === 'CANCELADA') {
      sendAppointmentCancelledByBusinessEmail(cita.usuario, updated, cita.servicio, business.nombre, motivo).catch(err => logger.error(err));
    }

    audit({ usuarioId: req.user.id, accion: `BUSINESS_CITA_${estado}`, entidad: 'cita', entidadId: id, ip: req.ip });
    return res.json({ success: true, message: `Cita ${estado.toLowerCase()}`, data: updated });
  } catch (error) { next(error); }
}

async function getBusinessStats(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [citasHoy, ingresosCitasMes, ingresosEspaciosMes, ratingAgg, serviciosActivos] = await Promise.all([
      prisma.cita.count({ where: { business_id: business.id, fecha: { gte: today }, estado: { in: ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA'] } } }),
      prisma.cita.aggregate({ where: { business_id: business.id, estado: 'COMPLETADA', fecha: { gte: monthStart } }, _sum: { precio_pagado: true } }),
      prisma.reservaRecurso.aggregate({ where: { recurso: { business_id: business.id }, estado: { notIn: ['CANCELADA'] }, fecha: { gte: monthStart } }, _sum: { precio_pagado: true } }),
      prisma.review.aggregate({ where: { servicio: { business_id: business.id } }, _avg: { rating: true } }),
      prisma.servicio.count({ where: { business_id: business.id, activo: true } }),
    ]);

    return res.json({
      success: true,
      data: {
        citas_hoy: citasHoy,
        ingresos_mes: Number(ingresosCitasMes._sum.precio_pagado || 0) + Number(ingresosEspaciosMes._sum.precio_pagado || 0),
        valoracion_media: ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
        servicios_activos: serviciosActivos,
      },
    });
  } catch (error) { next(error); }
}

async function getBusinessResourceBookings(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;

    const { estado, fecha_desde, fecha_hasta, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

    const where = { recurso: { business_id: business.id } };
    if (estado) where.estado = estado;
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha.gte = new Date(fecha_desde);
      if (fecha_hasta) where.fecha.lte = new Date(fecha_hasta);
    }
    if (search) {
      where.usuario = { OR: [{ nombre: { contains: search } }, { email: { contains: search } }] };
    }

    const [items, total] = await Promise.all([
      prisma.reservaRecurso.findMany({
        where,
        include: {
          usuario: { select: { id: true, nombre: true, apellidos: true, email: true, telefono: true } },
          recurso: { select: { id: true, nombre: true, tipo: true, precio_hora: true } },
        },
        orderBy: [{ fecha: 'desc' }, { hora_inicio: 'asc' }],
        skip, take,
      }),
      prisma.reservaRecurso.count({ where }),
    ]);

    return res.json({ success: true, data: items, total, page: parseInt(page), limit: take });
  } catch (error) { next(error); }
}

async function updateBusinessResourceBookingStatus(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;

    const id = parseInt(req.params.id);
    const { estado } = req.body;

    const booking = await prisma.reservaRecurso.findUnique({
      where: { id },
      include: { recurso: { select: { business_id: true } } },
    });
    if (!booking || booking.recurso.business_id !== business.id) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    const updated = await prisma.reservaRecurso.update({ where: { id }, data: { estado } });
    audit({ usuarioId: req.user.id, accion: `BUSINESS_RESERVA_${estado}`, entidad: 'reservaRecurso', entidadId: id, ip: req.ip });
    return res.json({ success: true, message: `Reserva ${estado.toLowerCase()}`, data: updated });
  } catch (error) { next(error); }
}

module.exports = {
  getBusinessAppointments,
  updateBusinessAppointmentStatus,
  getBusinessStats,
  getBusinessResourceBookings,
  updateBusinessResourceBookingStatus,
};
