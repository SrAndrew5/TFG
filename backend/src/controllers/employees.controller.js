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
    const id = parseInt(req.params.id);
    const where = req.user.rol === 'ADMIN' ? { id } : { id, business_id: req.user.business_id };

    const empleado = await prisma.empleado.findUnique({
      where,
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
      data: {
        nombre,
        apellidos,
        email,
        telefono,
        especialidad,
        business_id: req.user.rol === 'ADMIN' ? (req.body.business_id || null) : req.user.business_id,
      },
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
    const id = parseInt(req.params.id);
    const where = req.user.rol === 'ADMIN' ? { id } : { id, business_id: req.user.business_id };

    const empleado = await prisma.empleado.update({
      where,
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
 * PUT /api/employees/:id/toggle (Admin) — Soft delete o reactivar
 */
async function toggleActive(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const where = req.user.rol === 'ADMIN' ? { id } : { id, business_id: req.user.business_id };

    const empleado = await prisma.empleado.findUnique({ where });
    if (!empleado) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    const updated = await prisma.empleado.update({
      where: { id: empleado.id },
      data: { activo: !empleado.activo }
    });

    res.json({
      success: true,
      message: updated.activo ? 'Empleado reactivado' : 'Empleado dado de baja',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function getOwnerBusinessId(userId) {
  const biz = await prisma.business.findUnique({ where: { owner_id: userId } });
  return biz?.id ?? null;
}

/**
 * POST /api/employees/:id/services — Asignar servicio a empleado
 */
async function assignService(req, res, next) {
  try {
    const empleadoId = parseInt(req.params.id);
    const { servicio_id } = req.body;

    if (req.user.rol !== 'ADMIN') {
      const businessId = await getOwnerBusinessId(req.user.id);
      if (!businessId) return res.status(403).json({ success: false, message: 'No tienes negocio registrado' });
      const emp = await prisma.empleado.findUnique({ where: { id: empleadoId } });
      if (!emp || emp.business_id !== businessId) {
        return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      }
      const svc = await prisma.servicio.findFirst({ where: { id: servicio_id, business_id: businessId } });
      if (!svc) return res.status(404).json({ success: false, message: 'Servicio no encontrado en tu negocio' });
    }

    await prisma.servicioEmpleado.create({
      data: { empleado_id: empleadoId, servicio_id },
    });

    res.status(201).json({ success: true, message: 'Servicio asignado al empleado' });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/employees/:id/services/:serviceId — Desasignar servicio
 */
async function removeService(req, res, next) {
  try {
    const empleadoId = parseInt(req.params.id);
    const servicioId = parseInt(req.params.serviceId);

    if (req.user.rol !== 'ADMIN') {
      const businessId = await getOwnerBusinessId(req.user.id);
      if (!businessId) return res.status(403).json({ success: false, message: 'No tienes negocio registrado' });
      const emp = await prisma.empleado.findUnique({ where: { id: empleadoId } });
      if (!emp || emp.business_id !== businessId) {
        return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      }
    }

    await prisma.servicioEmpleado.deleteMany({
      where: { empleado_id: empleadoId, servicio_id: servicioId },
    });

    res.json({ success: true, message: 'Servicio desasignado del empleado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, toggleActive, assignService, removeService };
