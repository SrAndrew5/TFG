const prisma = require('../config/database');

/**
 * GET /api/resources
 */
async function getAll(req, res, next) {
  try {
    const { tipo, activo } = req.query;
    const where = {};

    if (activo !== undefined) where.activo = activo === 'true';
    else where.activo = true;
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

    const data = recursos.map((r) => ({
      ...r,
      reservas_activas: r._count.reservas,
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
    const recurso = await prisma.recurso.findUnique({
      where: { id: parseInt(req.params.id) },
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
    const recurso = await prisma.recurso.create({ data: req.body });

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
    const recurso = await prisma.recurso.update({
      where: { id: parseInt(req.params.id) },
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
    await prisma.recurso.update({
      where: { id: parseInt(req.params.id) },
      data: { activo: false },
    });

    res.json({ success: true, message: 'Recurso desactivado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove };
