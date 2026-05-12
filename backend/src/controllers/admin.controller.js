const prisma = require('../config/database');
const { sendAccountSuspendedEmail, sendAccountReactivatedEmail } = require('../services/email.service');
const logger = require('../config/logger');

/**
 * GET /api/admin/stats
 */
async function getStats(req, res, next) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalUsuarios,
      totalRecursos,
      reservasPorEstado,
      reservasHoy,
      ingresosReservasMes,
    ] = await Promise.all([
      prisma.usuario.count({ where: { activo: true } }),
      prisma.recurso.count({ where: { activo: true } }),
      prisma.reservaRecurso.groupBy({
        by: ['estado'],
        _count: { id: true },
      }),
      prisma.reservaRecurso.count({
        where: {
          fecha: {
            gte: new Date(todayStr),
            lt: new Date(new Date(Date.now() + 86400000).toISOString().split('T')[0]),
          },
          estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        },
      }),
      prisma.reservaRecurso.findMany({
        where: {
          estado: 'COMPLETADA',
          fecha: { gte: mesInicio },
        },
        select: { precio_pagado: true },
      }),
    ]);

    const ingresosMes = ingresosReservasMes.reduce(
      (sum, r) => sum + parseFloat(r.precio_pagado ?? 0),
      0
    );

    res.json({
      success: true,
      data: {
        resumen: {
          total_usuarios: totalUsuarios,
          total_recursos: totalRecursos,
        },
        reservas: {
          por_estado: Object.fromEntries(
            reservasPorEstado.map((r) => [r.estado, r._count.id])
          ),
          hoy: reservasHoy,
        },
        ingresos: {
          mes_actual: ingresosMes,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 */
async function getUsers(req, res, next) {
  try {
    const { rol, activo, page = 1, limit = 20 } = req.query;
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;
    const where = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === 'true';

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          email: true,
          telefono: true,
          rol: true,
          activo: true,
          created_at: true,
          _count: {
            select: { reservas_recurso: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      prisma.usuario.count({ where }),
    ]);

    const data = usuarios.map((u) => ({
      ...u,
      total_reservas: u._count.reservas_recurso,
      _count: undefined,
    }));

    res.json({ success: true, data, total, page: parseInt(page), limit: take });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/admin/users/:id/toggle — Activar/desactivar usuario
 */
async function toggleUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);
    const { motivo } = req.body; // opcional — solo relevante al suspender

    // Un admin no puede desactivarse a sí mismo: evita lockout accidental del único admin.
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta',
      });
    }

    const user = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const willBeActive = !user.activo;

    const updated = await prisma.usuario.update({
      where: { id: userId },
      data: {
        activo: willBeActive,
        motivo_suspension: willBeActive ? null : (motivo?.trim() || null),
      },
    });

    // Notificación in-app
    await prisma.notification.create({
      data: {
        usuario_id: userId,
        type: willBeActive ? 'success' : 'warning',
        title: willBeActive ? 'Cuenta reactivada' : 'Cuenta suspendida',
        body: willBeActive
          ? 'Tu cuenta ha sido reactivada. Ya puedes iniciar sesión con normalidad.'
          : motivo
            ? `Tu cuenta ha sido suspendida. Motivo: ${motivo}`
            : 'Tu cuenta ha sido suspendida temporalmente.',
      },
    }).catch((err) => logger.error({ err }, 'Error creando notificación de toggle de cuenta'));

    // Email fire-and-forget
    if (willBeActive) {
      sendAccountReactivatedEmail(updated)
        .catch((err) => logger.error({ err }, 'Error enviando email de reactivación'));
    } else {
      sendAccountSuspendedEmail(updated, motivo?.trim() || null)
        .catch((err) => logger.error({ err }, 'Error enviando email de suspensión'));
    }

    res.json({
      success: true,
      message: `Usuario ${updated.activo ? 'activado' : 'desactivado'}`,
      data: { id: updated.id, activo: updated.activo },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getStats, getUsers, toggleUser };
