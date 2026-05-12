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

    // Agregamos rating de Reviews en una sola query con groupBy. Más eficiente que
    // un findMany por servicio: una llamada para todos los servicios mostrados.
    const ids = servicios.map((s) => s.id);
    const ratings = ids.length > 0
      ? await prisma.review.groupBy({
          by: ['servicio_id'],
          where: { servicio_id: { in: ids } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];
    const ratingMap = new Map(
      ratings.map((r) => [r.servicio_id, {
        avg: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null,
        count: r._count.rating,
      }]),
    );

    const data = servicios.map((s) => ({
      ...s,
      empleados: s.empleados.map((se) => se.empleado),
      avg_rating:   ratingMap.get(s.id)?.avg ?? null,
      review_count: ratingMap.get(s.id)?.count ?? 0,
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
    const id = parseInt(req.params.id);
    const where = req.user.rol === 'ADMIN' ? { id } : { id, business_id: req.user.business_id };

    const servicio = await prisma.servicio.findUnique({
      where,
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
      data: {
        nombre,
        descripcion,
        duracion_min,
        precio,
        categoria,
        business_id: req.user.rol === 'ADMIN' ? (req.body.business_id || null) : req.user.business_id,
      },
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
    const id = parseInt(req.params.id);
    const where = req.user.rol === 'ADMIN' ? { id } : { id, business_id: req.user.business_id };

    const servicio = await prisma.servicio.update({
      where,
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
    const id = parseInt(req.params.id);
    const where = req.user.rol === 'ADMIN' ? { id } : { id, business_id: req.user.business_id };

    await prisma.servicio.update({
      where,
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
