const prisma = require('../config/database');

/**
 * GET /api/resources
 */
async function getAll(req, res, next) {
  try {
    const { tipo, activo } = req.query;
    const where = {
      // Solo recursos activos de negocios activos (o recursos de la plataforma sin negocio)
      activo: activo !== undefined ? activo === 'true' : true,
      OR: [
        { business_id: null },
        { business: { estado: 'ACTIVO' } },
      ],
    };
    if (tipo) where.tipo = tipo;

    const recursos = await prisma.recurso.findMany({
      where,
      include: {
        _count: {
          select: { reservas: { where: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } } } },
        },
      },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });

    // Agregación de reviews igual que en servicios — una sola query para todos los IDs visibles.
    const ids = recursos.map((r) => r.id);
    const ratings = ids.length > 0
      ? await prisma.review.groupBy({
          by: ['recurso_id'],
          where: { recurso_id: { in: ids } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];
    const ratingMap = new Map(
      ratings.map((r) => [r.recurso_id, {
        avg: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null,
        count: r._count.rating,
      }]),
    );

    const data = recursos.map((r) => ({
      ...r,
      reservas_activas: r._count.reservas,
      avg_rating:   ratingMap.get(r.id)?.avg ?? null,
      review_count: ratingMap.get(r.id)?.count ?? 0,
      _count: undefined,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resources/:id
 */
async function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const recurso = await prisma.recurso.findUnique({
      where: { id },
    });

    if (!recurso) {
      return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
    }

    res.json({ success: true, data: recurso });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/resources (Admin)
 */
async function create(req, res, next) {
  try {
    const data = {
      ...req.body,
      business_id: req.user.rol === 'ADMIN' ? (req.body.business_id || null) : req.user.business_id,
    };
    const recurso = await prisma.recurso.create({ data });

    res.status(201).json({
      success: true,
      message: 'Recurso creado',
      data: recurso,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/resources/:id (Admin)
 */
async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const where = req.user.rol === 'ADMIN' ? { id } : { id, business_id: req.user.business_id };

    const recurso = await prisma.recurso.update({
      where,
      data: req.body,
    });

    res.json({
      success: true,
      message: 'Recurso actualizado',
      data: recurso,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/resources/:id (Admin) — Soft delete
 */
async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const where = req.user.rol === 'ADMIN' ? { id } : { id, business_id: req.user.business_id };

    await prisma.recurso.update({
      where,
      data: { activo: false },
    });

    res.json({ success: true, message: 'Recurso desactivado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove };
