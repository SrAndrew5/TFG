const prisma = require('../config/database');
const { getAvailableSlots, timeToMinutes } = require('../services/availability.service');
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require('../services/email.service');

/**
 * GET /api/appointments
 * Cliente: sus citas | Admin: todas
 */
async function getAll(req, res, next) {
  try {
    const { estado, fecha_desde, fecha_hasta } = req.query;
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

    const citas = await prisma.cita.findMany({
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
      },
      orderBy: [{ fecha: 'desc' }, { hora_inicio: 'asc' }],
    });

    res.json({ success: true, data: citas });
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
    const { empleado_id, servicio_id, fecha, hora_inicio, notas } = req.body;

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

    // Verificar disponibilidad
    const slots = await getAvailableSlots(empleado_id, fecha, servicio.duracion_min);
    const isAvailable = slots.some((slot) => slot.hora_inicio === hora_inicio);

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'El horario seleccionado no está disponible',
      });
    }

    // Crear la cita
    const cita = await prisma.cita.create({
      data: {
        usuario_id: req.user.id,
        empleado_id,
        servicio_id,
        fecha: new Date(fecha),
        hora_inicio,
        hora_fin,
        notas,
      },
      include: {
        empleado: { select: { id: true, nombre: true, apellidos: true } },
        servicio: { select: { id: true, nombre: true, precio: true } },
      },
    });

    // Enviar email de confirmación
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    sendAppointmentConfirmation(
      { ...cita, fecha: fecha },
      usuario,
      cita.servicio,
      cita.empleado
    );

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: cita,
    });
  } catch (error) {
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

    // Si se cancela, enviar email
    if (estado === 'CANCELADA') {
      sendAppointmentCancellation(citaExistente, citaExistente.usuario, citaExistente.servicio);
    }

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

    sendAppointmentCancellation(cita, cita.usuario, cita.servicio);

    res.json({ success: true, message: 'Cita cancelada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, updateStatus, remove };
