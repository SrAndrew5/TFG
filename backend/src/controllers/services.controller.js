const prisma = require('../config/database');

/**
 * GET /api/services
 */
async function getAll(req, res, next) {
  try {
    const { categoria, activo } = req.query;

    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    else where.activo = true; // Por defecto solo activos
    if (categoria) where.categoria = categoria;

    const servicios = await prisma.servicio.findMany({
      where,
      include: {
        empleados: {
          include: {
            empleado: {
              select: { id: true, nombre: true, apellidos: true, especialidad: true, avatar_url: true },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    // Transformar la respuesta para aplanar la relación N:M
    const data = servicios.map((s) => ({
      ...s,
      empleados: s.empleados.map((se) => se.empleado),
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/services/:id
 */
async function getById(req, res, next) {
  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        empleados: {
          include: {
            empleado: {
              select: { id: true, nombre: true, apellidos: true, especialidad: true, avatar_url: true, activo: true },
            },
          },
        },
      },
    });

    if (!servicio) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    res.json({
      success: true,
      data: {
        ...servicio,
        empleados: servicio.empleados.map((se) => se.empleado),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/services (Admin)
 */
async function create(req, res, next) {
  try {
    const { nombre, descripcion, duracion_min, precio, categoria } = req.body;

    const servicio = await prisma.servicio.create({
      data: { nombre, descripcion, duracion_min, precio, categoria },
    });

    res.status(201).json({
      success: true,
      message: 'Servicio creado',
      data: servicio,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/services/:id (Admin)
 */
async function update(req, res, next) {
  try {
    const servicio = await prisma.servicio.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });

    res.json({
      success: true,
      message: 'Servicio actualizado',
      data: servicio,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/services/:id (Admin) — Soft delete
 */
async function remove(req, res, next) {
  try {
    await prisma.servicio.update({
      where: { id: parseInt(req.params.id) },
      data: { activo: false },
    });

    res.json({ success: true, message: 'Servicio desactivado' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/services/categories — Lista de categorías únicas
 */
async function getCategories(req, res, next) {
  try {
    const categorias = await prisma.servicio.findMany({
      where: { activo: true, categoria: { not: null } },
      select: { categoria: true },
      distinct: ['categoria'],
      orderBy: { categoria: 'asc' },
    });

    res.json({
      success: true,
      data: categorias.map((c) => c.categoria),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove, getCategories };
