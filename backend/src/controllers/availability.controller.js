const prisma = require('../config/database');
const { getAvailableSlots } = require('../services/availability.service');

/**
 * GET /api/availability/:employeeId
 */
async function getByEmployee(req, res, next) {
  try {
    const empleadoId = parseInt(req.params.employeeId);

    const disponibilidades = await prisma.disponibilidad.findMany({
      where: { empleado_id: empleadoId },
      orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
    });

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const formatted = disponibilidades.map((d) => ({
      ...d,
      dia_nombre: diasSemana[d.dia_semana],
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/availability/:employeeId/slots?date=YYYY-MM-DD&serviceId=X
 */
async function getSlots(req, res, next) {
  try {
    const empleadoId = parseInt(req.params.employeeId);
    const { date, serviceId } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'El parámetro "date" es obligatorio' });
    }

    // Obtener duración del servicio
    let duracionMin = 30; // default
    if (serviceId) {
      const servicio = await prisma.servicio.findUnique({
        where: { id: parseInt(serviceId) },
      });
      if (servicio) duracionMin = servicio.duracion_min;
    }

    const slots = await getAvailableSlots(empleadoId, date, duracionMin);

    res.json({
      success: true,
      data: {
        empleado_id: empleadoId,
        fecha: date,
        duracion_min: duracionMin,
        slots,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/availability (Admin)
 */
async function create(req, res, next) {
  try {
    const { empleado_id, dia_semana, hora_inicio, hora_fin } = req.body;

    const disponibilidad = await prisma.disponibilidad.create({
      data: { empleado_id, dia_semana, hora_inicio, hora_fin },
    });

    res.status(201).json({
      success: true,
      message: 'Horario creado',
      data: disponibilidad,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/availability/:id (Admin)
 */
async function update(req, res, next) {
  try {
    const { hora_inicio, hora_fin } = req.body;

    const disponibilidad = await prisma.disponibilidad.update({
      where: { id: parseInt(req.params.id) },
      data: { hora_inicio, hora_fin },
    });

    res.json({
      success: true,
      message: 'Horario actualizado',
      data: disponibilidad,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/availability/:id (Admin)
 */
async function remove(req, res, next) {
  try {
    await prisma.disponibilidad.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ success: true, message: 'Horario eliminado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getByEmployee, getSlots, create, update, remove };
