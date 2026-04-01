const prisma = require('../config/database');

/**
 * GET /api/employees
 */
async function getAll(req, res, next) {
  try {
    const { activo } = req.query;
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    else where.activo = true;

    const empleados = await prisma.empleado.findMany({
      where,
      include: {
        servicios: {
          include: {
            servicio: {
              select: { id: true, nombre: true, duracion_min: true, precio: true, categoria: true },
            },
          },
        },
        _count: { select: { citas: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    const data = empleados.map((e) => ({
      ...e,
      servicios: e.servicios.map((se) => se.servicio),
      total_citas: e._count.citas,
      _count: undefined,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/employees/:id
 */
async function getById(req, res, next) {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        servicios: {
          include: {
            servicio: true,
          },
        },
        disponibilidades: {
          orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
        },
      },
    });

    if (!empleado) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    res.json({
      success: true,
      data: {
        ...empleado,
        servicios: empleado.servicios.map((se) => se.servicio),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/employees (Admin)
 */
async function create(req, res, next) {
  try {
    const { nombre, apellidos, email, telefono, especialidad } = req.body;

    const empleado = await prisma.empleado.create({
      data: { nombre, apellidos, email, telefono, especialidad },
    });

    res.status(201).json({
      success: true,
      message: 'Empleado creado',
      data: empleado,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/employees/:id (Admin)
 */
async function update(req, res, next) {
  try {
    const empleado = await prisma.empleado.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });

    res.json({
      success: true,
      message: 'Empleado actualizado',
      data: empleado,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/employees/:id/services (Admin) — Asignar servicio a empleado
 */
async function assignService(req, res, next) {
  try {
    const empleadoId = parseInt(req.params.id);
    const { servicio_id } = req.body;

    await prisma.servicioEmpleado.create({
      data: {
        empleado_id: empleadoId,
        servicio_id: servicio_id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Servicio asignado al empleado',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/employees/:id/services/:serviceId (Admin) — Desasignar servicio
 */
async function removeService(req, res, next) {
  try {
    const empleadoId = parseInt(req.params.id);
    const servicioId = parseInt(req.params.serviceId);

    await prisma.servicioEmpleado.deleteMany({
      where: {
        empleado_id: empleadoId,
        servicio_id: servicioId,
      },
    });

    res.json({
      success: true,
      message: 'Servicio desasignado del empleado',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, assignService, removeService };
