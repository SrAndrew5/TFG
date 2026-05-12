const prisma = require('../config/database');

/**
 * POST /api/reviews
 * Crea una reseña para una reserva de coworking ya completada.
 */
async function create(req, res, next) {
  try {
    const { reserva_recurso_id, rating, comentario } = req.body;

    if (!reserva_recurso_id) {
      return res.status(400).json({ success: false, message: 'Se requiere reserva_recurso_id' });
    }

    const reserva = await prisma.reservaRecurso.findUnique({
      where: { id: reserva_recurso_id },
      include: { review: true },
    });

    if (!reserva || reserva.usuario_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }
    if (reserva.estado !== 'COMPLETADA') {
      return res.status(400).json({ success: false, message: 'Solo puedes reseñar reservas completadas' });
    }
    if (reserva.review) {
      return res.status(409).json({ success: false, message: 'Ya has reseñado esta reserva' });
    }

    const review = await prisma.review.create({
      data: {
        usuario_id: req.user.id,
        recurso_id: reserva.recurso_id,
        reserva_recurso_id,
        rating,
        comentario: comentario || null,
      },
    });

    res.status(201).json({ success: true, message: 'Reseña publicada', data: review });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reviews?recurso_id=Y
 * Devuelve las reseñas de un recurso, paginadas.
 */
async function getByEntity(req, res, next) {
  try {
    const recurso_id = req.query.recurso_id ? parseInt(req.query.recurso_id) : null;
    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    if (!recurso_id) {
      return res.status(400).json({ success: false, message: 'Indica recurso_id' });
    }

    const where = { recurso_id };

    const [reviews, total, agg] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          usuario: { select: { id: true, nombre: true, apellidos: true, avatar_url: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);

    res.json({
      success: true,
      data: reviews,
      meta: {
        total,
        page,
        limit,
        avg_rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getByEntity };
